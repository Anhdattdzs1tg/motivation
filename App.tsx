import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import History from './pages/History'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { AuthProvider } from './context/AuthContext'
import { useDailyMaintenance } from './hooks/useDailyMaintenance'
import { scheduleTodayReminders, clearScheduledReminders, notificationPermission } from './lib/notifications'

function AppShell() {
  const ready = useDailyMaintenance()

  useEffect(() => {
    if (notificationPermission() !== 'granted') return
    const timers = scheduleTodayReminders()
    return () => clearScheduledReminders(timers)
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <p className="text-sky-400 text-sm">Đang chuẩn bị dữ liệu…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
