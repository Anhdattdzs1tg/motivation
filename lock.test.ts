// Kiểm thử logic khoá buổi theo mốc giờ 0-13 / 13-18 / 18-24 (giờ Việt Nam)
// Chạy: npx tsx src/lib/__tests__/lock.test.ts
import { isPeriodLocked, minutesUntilPeriodEnd, currentPeriod } from '../../src/lib/dateUtils'

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

// Tạo 1 Date object mà khi biểu diễn theo giờ Asia/Bangkok sẽ là đúng giờ:phút chỉ định.
// Cách đơn giản nhất: dùng chuỗi ISO với offset +07:00 cố định.
function bangkokTime(dateStr: string, hh: number, mm: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0')
  return new Date(`${dateStr}T${pad(hh)}:${pad(mm)}:00+07:00`)
}

function main() {
  // 12:59 -> buổi sáng CHƯA khoá
  assertEqual(isPeriodLocked('morning', bangkokTime('2026-08-21', 12, 59)), false, '12:59 - buổi sáng chưa khoá')
  // 13:00 -> buổi sáng ĐÃ khoá (đúng ranh giới)
  assertEqual(isPeriodLocked('morning', bangkokTime('2026-08-21', 13, 0)), true, '13:00 - buổi sáng đã khoá (đúng ranh giới)')
  // 13:01 -> vẫn khoá
  assertEqual(isPeriodLocked('morning', bangkokTime('2026-08-21', 13, 1)), true, '13:01 - buổi sáng vẫn khoá')

  // 17:59 -> buổi chiều chưa khoá
  assertEqual(isPeriodLocked('afternoon', bangkokTime('2026-08-21', 17, 59)), false, '17:59 - buổi chiều chưa khoá')
  // 18:00 -> buổi chiều đã khoá
  assertEqual(isPeriodLocked('afternoon', bangkokTime('2026-08-21', 18, 0)), true, '18:00 - buổi chiều đã khoá')

  // Buổi tối không bao giờ tự khoá trong ngày (kết thúc lúc nửa đêm = chuyển ngày)
  assertEqual(isPeriodLocked('evening', bangkokTime('2026-08-21', 23, 59)), false, '23:59 - buổi tối không tự khoá')
  assertEqual(isPeriodLocked('evening', bangkokTime('2026-08-21', 0, 1)), false, '00:01 - buổi tối (nếu tính) không tự khoá')

  // currentPeriod đúng theo từng mốc giờ
  assertEqual(currentPeriod(bangkokTime('2026-08-21', 6, 0)), 'morning', '06:00 -> đang là buổi sáng')
  assertEqual(currentPeriod(bangkokTime('2026-08-21', 14, 0)), 'afternoon', '14:00 -> đang là buổi chiều')
  assertEqual(currentPeriod(bangkokTime('2026-08-21', 20, 0)), 'evening', '20:00 -> đang là buổi tối')

  // minutesUntilPeriodEnd: nhắc trước 1 tiếng và 30 phút phải rơi đúng vào cửa sổ hợp lệ
  assertEqual(minutesUntilPeriodEnd('morning', bangkokTime('2026-08-21', 12, 0)), 60, '12:00 -> còn đúng 60 phút tới khi khoá buổi sáng (mốc nhắc 1 tiếng)')
  assertEqual(minutesUntilPeriodEnd('morning', bangkokTime('2026-08-21', 12, 30)), 30, '12:30 -> còn đúng 30 phút (mốc nhắc 30 phút)')
  assertEqual(minutesUntilPeriodEnd('morning', bangkokTime('2026-08-21', 13, 0)), 0, '13:00 -> còn 0 phút (đã tới giờ khoá)')

  console.log(`\n${pass} pass, ${fail} fail`)
  process.exit(fail > 0 ? 1 : 0)
}

main()
