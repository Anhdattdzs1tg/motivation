import { useEffect, useRef, useState } from 'react'
import { runDailyMaintenance, autoLockOverdueTasks } from '../lib/engine'
import { todayStr } from '../lib/dateUtils'

/**
 * Chạy bảo trì hằng ngày khi app khởi động (chốt sổ ngày cũ, sinh nhiệm vụ hôm nay),
 * đồng thời kiểm tra định kỳ mỗi phút để tự khoá buổi khi hết giờ và phát hiện khi
 * ngày đã chuyển sang hôm sau (nếu người dùng để app mở qua đêm) để chạy lại bảo trì.
 */
export function useDailyMaintenance() {
  const [ready, setReady] = useState(false)
  const lastDateRef = useRef(todayStr())

  useEffect(() => {
    let cancelled = false
    runDailyMaintenance().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = todayStr()
      if (now !== lastDateRef.current) {
        // Ngày đã chuyển sang hôm sau trong khi app vẫn đang mở
        lastDateRef.current = now
        runDailyMaintenance()
      } else {
        autoLockOverdueTasks(now)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return ready
}
