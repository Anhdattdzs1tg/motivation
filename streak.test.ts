// Kịch bản kiểm thử thủ công cho logic streak/khôi phục — chạy bằng: npx tsx src/lib/__tests__/streak.test.ts
// (không dùng framework test để giữ dự án gọn nhẹ; đây là smoke test có thể xoá sau khi xác nhận đúng)
import 'fake-indexeddb/auto'
import { db } from '../../src/lib/db'
import { ensureSeeded, finalizeDay, ensureInstancesForDate } from '../../src/lib/engine'
import { addDaysToDateStr } from '../../src/lib/dateUtils'

let pass = 0
let fail = 0
function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass++
    console.log(`✅ ${label}`)
  } else {
    fail++
    console.log(`❌ ${label} — mong đợi ${JSON.stringify(expected)}, nhận được ${JSON.stringify(actual)}`)
  }
}

async function completeAllTasksForDate(date: string) {
  await ensureInstancesForDate(date)
  const instances = await db.instances.where('date').equals(date).toArray()
  for (const inst of instances) {
    await db.instances.update(inst.id, { status: 'done', completedAt: Date.now() })
  }
}

async function leaveOneIncomplete(date: string) {
  await ensureInstancesForDate(date)
  const instances = await db.instances.where('date').equals(date).toArray()
  for (let i = 0; i < instances.length; i++) {
    if (i === 0) continue // để lại 1 task pending -> ngày này coi như bỏ lỡ
    await db.instances.update(instances[i].id, { status: 'done', completedAt: Date.now() })
  }
}

async function main() {
  await ensureSeeded()
  // Templates mặc định được seed với effectiveFrom = hôm nay (ngày thực chạy test),
  // nên phải lùi effectiveFrom về trước ngày bắt đầu kịch bản để các ngày giả lập
  // trong quá khứ (2026-01-xx) thực sự sinh ra instance.
  await db.templates.toCollection().modify({ effectiveFrom: '2020-01-01' })

  const START = '2026-01-01'

  // --- Kịch bản 1: 9 ngày hoàn thành liên tiếp -> streak = 9, chưa đạt mốc 10 nên 0 lượt khôi phục ---
  let cursor = START
  for (let i = 0; i < 9; i++) {
    await completeAllTasksForDate(cursor)
    await finalizeDay(cursor)
    cursor = addDaysToDateStr(cursor, 1)
  }
  let streak = await db.streak.get('main')
  assertEqual(streak?.currentStreak, 9, 'Sau 9 ngày hoàn thành liên tiếp: streak = 9')
  assertEqual(streak?.recoveryCreditsRemaining, 0, 'Streak 9 (<10): chưa có lượt khôi phục')

  // --- Kịch bản 2: ngày thứ 10 hoàn thành -> streak = 10, đạt mốc 10 -> 2 lượt khôi phục ---
  await completeAllTasksForDate(cursor)
  await finalizeDay(cursor)
  cursor = addDaysToDateStr(cursor, 1)
  streak = await db.streak.get('main')
  assertEqual(streak?.currentStreak, 10, 'Ngày thứ 10 hoàn thành: streak = 10')
  assertEqual(streak?.recoveryCreditsRemaining, 2, 'Đạt mốc 10: được cấp 2 lượt khôi phục')

  // --- Kịch bản 3: ngày thứ 11 bỏ lỡ 1 task -> dùng 1 lượt khôi phục, streak GIỮ NGUYÊN 10 ---
  await leaveOneIncomplete(cursor)
  const finalizeResult1 = await finalizeDay(cursor)
  cursor = addDaysToDateStr(cursor, 1)
  streak = await db.streak.get('main')
  assertEqual(finalizeResult1?.usedRecovery, true, 'Ngày bỏ lỡ khi còn lượt: usedRecovery = true')
  assertEqual(streak?.currentStreak, 10, 'Dùng khôi phục: streak giữ nguyên 10 (không tăng)')
  assertEqual(streak?.recoveryCreditsRemaining, 1, 'Sau khi dùng 1 lượt (từ 2): còn lại 1 lượt')

  // --- Kịch bản 4: ngày thứ 12 bỏ lỡ tiếp -> dùng lượt khôi phục cuối cùng, streak vẫn = 10 ---
  await leaveOneIncomplete(cursor)
  await finalizeDay(cursor)
  cursor = addDaysToDateStr(cursor, 1)
  streak = await db.streak.get('main')
  assertEqual(streak?.currentStreak, 10, 'Dùng lượt khôi phục cuối: streak vẫn = 10')
  assertEqual(streak?.recoveryCreditsRemaining, 0, 'Hết lượt khôi phục: còn lại 0')

  // --- Kịch bản 5: ngày thứ 13 bỏ lỡ, HẾT lượt khôi phục -> streak RESET về 0 ---
  await leaveOneIncomplete(cursor)
  const finalizeResult2 = await finalizeDay(cursor)
  cursor = addDaysToDateStr(cursor, 1)
  streak = await db.streak.get('main')
  assertEqual(finalizeResult2?.streakBroken, true, 'Bỏ lỡ khi hết lượt: streakBroken = true')
  assertEqual(streak?.currentStreak, 0, 'Hết lượt khôi phục mà bỏ lỡ: streak reset về 0')
  assertEqual(streak?.longestStreak, 10, 'longestStreak vẫn lưu lại mốc cao nhất đã đạt = 10')

  // --- Kịch bản 6: xây lại streak từ 0 lên tới mốc 30 -> lượt khôi phục "làm mới lại" thành 3
  // (không cộng dồn với phần đã dùng ở mốc 10 trước đó) ---
  for (let i = 0; i < 30; i++) {
    await completeAllTasksForDate(cursor)
    await finalizeDay(cursor)
    cursor = addDaysToDateStr(cursor, 1)
  }
  streak = await db.streak.get('main')
  assertEqual(streak?.currentStreak, 30, 'Xây lại streak liên tục 30 ngày: streak = 30')
  assertEqual(streak?.recoveryCreditsRemaining, 3, 'Đạt mốc 30: lượt khôi phục LÀM MỚI thành 3 (không cộng dồn với 2 lượt cũ)')
  assertEqual(streak?.highestMilestoneReached, 30, 'Mốc cao nhất đã đạt cập nhật thành 30')

  console.log(`\n${pass} pass, ${fail} fail`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Lỗi khi chạy test:', err)
  process.exit(1)
})
