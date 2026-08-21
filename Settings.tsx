import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { requestNotificationPermission, notificationPermission } from '../lib/notifications'
import { PERIOD_LABELS } from '../lib/types'
import type { Period } from '../lib/types'
import { useAuth } from '../context/AuthContext'

const PERIOD_ORDER: Period[] = ['morning', 'afternoon', 'evening', 'flexible']

export default function Settings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const templates = useLiveQuery(() => db.templates.filter((t) => !t.archived).toArray(), [], [])
  const { user } = useAuth()

  useEffect(() => {
    setPermission(notificationPermission())
  }, [])

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  const archiveTemplate = async (id: string) => {
    await db.templates.update(id, { archived: true, updatedAt: Date.now() })
  }

  const grouped = PERIOD_ORDER.map((p) => ({
    period: p,
    items: templates.filter((t) => t.period === p),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="pb-4">
      <header className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-sky-900">Cài đặt</h1>
      </header>

      <section className="mx-5 mt-4 bg-white rounded-2xl border border-sky-100 p-4">
        <h2 className="text-sm font-semibold text-sky-700 mb-2">Thông báo nhắc nhở</h2>
        {permission === 'granted' ? (
          <p className="text-sm text-success-600 font-medium flex items-center gap-1.5">
            <CheckCircleIcon /> Đã bật thông báo
          </p>
        ) : permission === 'denied' ? (
          <p className="text-sm text-danger-600">
            Thông báo đang bị chặn. Vui lòng bật lại trong cài đặt trình duyệt/điện thoại.
          </p>
        ) : (
          <div>
            <p className="text-sm text-sky-500 mb-3">Bật thông báo để được nhắc trước 1 tiếng và 30 phút mỗi buổi.</p>
            <button
              onClick={handleEnableNotifications}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-sky-500 active:scale-95 transition-transform"
            >
              Bật thông báo
            </button>
          </div>
        )}
      </section>

      <section className="mx-5 mt-4 bg-white rounded-2xl border border-sky-100 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-sky-700">Tài khoản</h2>
          <Link to="/login" className="text-xs font-medium text-sky-500">
            {user ? 'Quản lý' : 'Đăng nhập'} →
          </Link>
        </div>
        <p className="text-sm text-sky-500">{user ? user.email : 'Chưa đăng nhập — dữ liệu chỉ lưu trên thiết bị này.'}</p>
      </section>

      <section className="mx-5 mt-4 bg-white rounded-2xl border border-sky-100 p-4">
        <h2 className="text-sm font-semibold text-sky-700 mb-3">Khung nhiệm vụ chuẩn</h2>
        <div className="space-y-4">
          {grouped.map(({ period, items }) => (
            <div key={period}>
              <p className="text-xs font-medium text-sky-400 mb-1.5">{PERIOD_LABELS[period]}</p>
              <div className="space-y-1.5">
                {items.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-sky-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-sky-800">{t.title}</span>
                    <button onClick={() => archiveTemplate(t.id)} className="text-xs text-danger-600 font-medium">
                      Xoá
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-sky-400 mt-3">Xoá nhiệm vụ ở đây sẽ không sinh ra nữa từ ngày mai trở đi.</p>
      </section>

      <section className="mx-5 mt-4 bg-white rounded-2xl border border-sky-100 p-4">
        <h2 className="text-sm font-semibold text-sky-700 mb-2">Giới thiệu</h2>
        <p className="text-sm text-sky-500">Nhiệm Vụ Hôm Nay — ứng dụng theo dõi thói quen và tạo động lực cá nhân.</p>
        <p className="text-xs text-glow-600 font-semibold mt-3">Được tạo bởi ANHDATDZS1TG#15</p>
      </section>
    </div>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
