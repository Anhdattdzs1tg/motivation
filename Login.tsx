import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading, firebaseReady, signInWithGoogle, logout, syncing, isOnline } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) {
    return <div className="px-5 pt-10 text-center text-sky-400 text-sm">Đang tải…</div>
  }

  if (!firebaseReady) {
    return (
      <div className="px-5 pt-10">
        <h1 className="text-xl font-bold text-sky-900 mb-2">Đăng nhập</h1>
        <div className="bg-glow-50 border border-glow-200 rounded-xl p-4 text-sm text-glow-700">
          Chưa cấu hình Firebase nên tính năng đăng nhập &amp; đồng bộ đa thiết bị chưa hoạt động. App vẫn dùng
          được bình thường ở chế độ offline trên thiết bị này. Xem file <code className="bg-white px-1 rounded">SETUP.md</code> để bật đăng nhập.
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pt-10">
      <h1 className="text-xl font-bold text-sky-900 mb-1">Tài khoản</h1>
      <p className="text-sm text-sky-500 mb-6">Đăng nhập để đồng bộ dữ liệu giữa điện thoại và máy tính.</p>

      {user ? (
        <div className="bg-white rounded-2xl border border-sky-100 p-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-sky-200" />
            )}
            <div>
              <p className="font-semibold text-sky-900">{user.displayName ?? 'Người dùng'}</p>
              <p className="text-xs text-sky-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-sky-500">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-500' : 'bg-sky-300'}`} />
            {!isOnline ? 'Đang ngoại tuyến — sẽ đồng bộ khi có mạng' : syncing ? 'Đang đồng bộ…' : 'Đã đồng bộ'}
          </div>
          <button
            onClick={logout}
            className="w-full mt-4 rounded-xl py-3 text-sm font-semibold text-danger-600 bg-danger-500/10 active:scale-[0.98] transition-transform"
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold text-sky-900 bg-white border border-sky-200 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <GoogleIcon />
          {signingIn ? 'Đang đăng nhập…' : 'Đăng nhập bằng Google'}
        </button>
      )}

      {error && <p className="text-sm text-danger-600 mt-3">{error}</p>}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5Z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.6 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7Z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.4 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.9 39.6 16.4 44 24 44Z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.5 5.5C39.7 37.3 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5Z"/>
    </svg>
  )
}
