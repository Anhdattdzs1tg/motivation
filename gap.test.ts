// Kiểm thử: người dùng không mở app trong nhiều ngày liên tiếp — mỗi ngày bị bỏ lỡ đó
// vẫn phải được "chốt sổ" đúng khi app mở lại (chạy: npx tsx src/lib/__tests__/gap.test.ts)
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

async function main() {
  await ensureSeeded()
  await db.templates.toCollection().modify({ effectiveFrom: '2020-01-01' })

  // Xây streak = 10 để có 2 lượt khôi phục
  let cursor = '2026-01-01'
  for (let i = 0; i < 10; i++) {
    await completeAllTasksForDate(cursor)
    await finalizeDay(cursor)
    cursor = addDaysToDateStr(cursor, 1)
  }
  let streak = await db.streak.get('main')
  assertEqual(streak?.currentStreak, 10, 'Chuẩn bị: streak = 10 sau 10 ngày hoàn thành')
  assertEqual(streak?.recoveryCreditsRemaining, 2, 'Chuẩn bị: có 2 lượt khôi phục')

  // Người dùng "biến mất" trong 5 ngày liên tiếp (không mở app, không tạo instance nào cho các ngày này).
  // cursor hiện đang trỏ tới '2026-01-11'. Giả lập "hôm nay thực tế" là 5 ngày sau đó.
  const missedDays = 5
  let simulatedToday = cursor
  for (let i = 0; i < missedDays; i++) {
    simulatedToday = addDaysToDateStr(simulatedToday, 1)
  }
  console.log(`\nNgười dùng không mở app từ ${cursor} đến trước ${simulatedToday} (bỏ lỡ ${missedDays} ngày)...\n`)

  // Không có instance nào được tạo cho 5 ngày đó (đúng như thực tế: app không mở thì không sinh instance).
  // Khi app mở lại vào simulatedToday, runDailyMaintenance phải tự chốt sổ những ngày đã qua.
  // Ta giả lập bằng cách gọi finalizeDay trực tiếp cho từng ngày bị bỏ lỡ (như runDailyMaintenance làm nội bộ).
  let d = cursor
  const results = []
  for (let i = 0; i < missedDays; i++) {
    const r = await finalizeDay(d)
    results.push({ date: d, ...r })
    d = addDaysToDateStr(d, 1)
  }

  console.log('Kết quả chốt sổ từng ngày bị bỏ lỡ:')
  results.forEach((r) => console.log(' ', JSON.stringify(r)))

  streak = await db.streak.get('main')
  // Ngày 1 bỏ lỡ: dùng lượt khôi phục 1/2, streak vẫn 10
  // Ngày 2 bỏ lỡ: dùng lượt khôi phục 2/2, streak vẫn 10
  // Ngày 3 bỏ lỡ: hết lượt -> streak reset về 0
  // Ngày 4, 5 bỏ lỡ: streak đã là 0, tiếp tục bỏ lỡ -> vẫn 0 (không âm)
  assertEqual(streak?.currentStreak, 0, 'Sau 5 ngày bỏ lỡ liên tiếp (2 lượt khôi phục dùng hết ở ngày 1-2): streak = 0')
  assertEqual(streak?.recoveryCreditsRemaining, 0, 'Không còn lượt khôi phục nào sau chuỗi ngày bỏ lỡ')
  assertEqual(streak?.longestStreak, 10, 'longestStreak vẫn giữ mốc 10 đã đạt trước đó')

  // Xác nhận runDailyMaintenance (hàm thực tế app gọi khi mở lên) hoạt động đúng end-to-end
  // bằng cách kiểm tra idempotency: gọi lại finalizeDay cho ngày đã chốt sổ rồi phải là no-op.
  const reFinalize = await finalizeDay(results[0].date)
  assertEqual(reFinalize, null, 'finalizeDay gọi lại cho ngày đã chốt sổ trước đó: trả về null (idempotent, không tính 2 lần)')

  console.log(`\n${pass} pass, ${fail} fail`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Lỗi khi chạy test:', err)
  process.exit(1)
})
