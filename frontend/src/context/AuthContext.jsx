import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data))
        .catch(err => {
          // CHỈ xóa token nếu server thực sự trả về 401 (token hết hạn)
          // KHÔNG xóa token khi lỗi mạng, timeout hoặc server đang khởi động
          if (err.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
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
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await authAPI.getMe()
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
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
