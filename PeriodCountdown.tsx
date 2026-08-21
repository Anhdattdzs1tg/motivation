import { useEffect, useState } from 'react'
import { minutesUntilPeriodEnd, isPeriodLocked } from '../lib/dateUtils'
import type { Period } from '../lib/types'

export default function PeriodCountdown({ period }: { period: Exclude<Period, 'flexible'> }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  if (period === 'evening') return null // buổi tối không hiển thị đếm ngược (kết thúc lúc nửa đêm, tự chuyển ngày)

  const locked = isPeriodLocked(period)
  if (locked) {
    return <span className="text-xs font-medium text-danger-600">Đã khoá</span>
  }

  const mins = minutesUntilPeriodEnd(period)
  const isUrgent = mins <= 60
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const label = h > 0 ? `${h} giờ ${m} phút` : `${m} phút`

  return (
    <span className={`text-xs font-medium ${isUrgent ? 'text-glow-600' : 'text-sky-500'}`}>
      Còn {label}
    </span>
  )
}
