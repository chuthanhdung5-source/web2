import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Xóa token tự động đăng nhập cũ ở localStorage để luôn hiện lại trang đăng nhập khi mở trang mới
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    const token = sessionStorage.getItem('token')
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data))
        .catch(err => {
          if (err.response?.status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('user')
            setUser(null)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Keep-alive ping: Tự động gửi request mỗi 10 phút để server cloud không bị ngủ đông (Sleep) khi đang mở tab
  useEffect(() => {
    if (!user) return
    const pingTimer = setInterval(() => {
      authAPI.getMe().catch(() => {})
    }, 10 * 60 * 1000)
    return () => clearInterval(pingTimer)
  }, [user])

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password })
    const { access_token, user: userData } = res.data
    sessionStorage.setItem('token', access_token)
    sessionStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await authAPI.getMe()
    setUser(res.data)
    sessionStorage.setItem('user', JSON.stringify(res.data))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
