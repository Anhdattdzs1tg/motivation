import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { syncAll } from '../lib/sync'

interface AuthContextValue {
  user: User | null
  loading: boolean
  firebaseReady: boolean
  isOnline: boolean
  syncing: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  triggerSync: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const triggerSync = async () => {
    if (!user || !isOnline) return
    setSyncing(true)
    try {
      await syncAll(user.uid)
    } catch (err) {
      console.error('Đồng bộ thất bại:', err)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (user && isOnline) {
      triggerSync()
      const interval = setInterval(triggerSync, 60000) // đồng bộ định kỳ mỗi phút khi đang mở app
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOnline])

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase chưa được cấu hình')
    await signInWithPopup(auth, googleProvider)
  }

  const logout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, firebaseReady: isFirebaseConfigured, isOnline, syncing, signInWithGoogle, logout, triggerSync }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider')
  return ctx
}
