import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Hôm nay', icon: HomeIcon },
  { to: '/history', label: 'Lịch sử', icon: HistoryIcon },
  { to: '/notes', label: 'Nhật ký', icon: NoteIcon },
  { to: '/settings', label: 'Cài đặt', icon: SettingsIcon },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center">
      <main className="flex-1 max-w-md w-full pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sky-200 shadow-[0_-2px_12px_rgba(90,135,204,0.08)]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-glow-500' : 'text-sky-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </nav>
    </div>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function NoteIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a8.1 8.1 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a8.1 8.1 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a8.1 8.1 0 0 0 1.7 1l.4 2.9h4l.4-2.9a8.1 8.1 0 0 0 1.7-1l2.5 1 2-3.5L19.4 13Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
