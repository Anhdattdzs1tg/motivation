import type { Period } from './types'
import { PERIOD_END_HOUR } from './types'

const REMINDER_OFFSETS_MIN = [60, 30] // nhắc trước 1 tiếng và 30 phút

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'default') {
    return await Notification.requestPermission()
  }
  return Notification.permission
}

export function notificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

function showLocalNotification(title: string, body: string) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  // Ưu tiên hiển thị qua Service Worker để hoạt động cả khi không mở app (giống push notification thật)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: `reminder-${title}`,
        })
      } else {
        new Notification(title, { body, icon: '/icons/icon-192.png' })
      }
    })
  } else {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  }
}

const PERIOD_LABEL_VI: Record<Exclude<Period, 'flexible'>, string> = {
  morning: 'buổi sáng',
  afternoon: 'buổi chiều',
  evening: 'buổi tối',
}

/**
 * Lên lịch nhắc nhở cho các buổi trong ngày hôm nay (chỉ những mốc còn ở tương lai).
 * Vì đây là app chạy client-side, các setTimeout này chỉ hoạt động khi tab đang mở.
 * Để nhắc được cả khi không mở app, xem thêm phần Firebase Cloud Messaging (server-side scheduling)
 * được kích hoạt sau khi đăng nhập.
 */
export function scheduleTodayReminders(): number[] {
  const timers: number[] = []
  const now = new Date()

  const periods: Exclude<Period, 'flexible'>[] = ['morning', 'afternoon', 'evening']
  for (const period of periods) {
    const endHour = PERIOD_END_HOUR[period]
    const endTime = new Date(now)
    endTime.setHours(0, 0, 0, 0)
    endTime.setMinutes(endHour * 60)

    for (const offsetMin of REMINDER_OFFSETS_MIN) {
      const fireAt = new Date(endTime.getTime() - offsetMin * 60000)
      const delay = fireAt.getTime() - now.getTime()
      if (delay <= 0) continue
      const timerId = window.setTimeout(() => {
        showLocalNotification(
          'Sắp hết giờ! ⏰',
          `Còn ${offsetMin} phút nữa là hết ${PERIOD_LABEL_VI[period]}. Đừng để nhiệm vụ bị khoá nhé!`,
        )
      }, delay)
      timers.push(timerId)
    }
  }
  return timers
}

export function clearScheduledReminders(timers: number[]) {
  timers.forEach((t) => window.clearTimeout(t))
}
