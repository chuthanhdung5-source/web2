import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import { useDouluo } from '../context/DouluoContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const { enabled, spendDiamonds } = useDouluo()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotForm, setForgotForm] = useState({ username: '', email: '', new_password: '', confirm_password: '' })
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      if (enabled) {
        spendDiamonds(50, 'Nhập cảnh Đấu La Đại Lục')
      }
      toast.success(`Chào mừng ${user.full_name}! 👋`)
      navigate(user.role === 'admin' ? '/admin' : '/member')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (forgotForm.new_password !== forgotForm.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    if (forgotForm.new_password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authAPI.forgotPassword({
        username: forgotForm.username.trim(),
        email: forgotForm.email.trim(),
        new_password: forgotForm.new_password
      })
      toast.success(res.data?.message || '✅ Đặt lại mật khẩu thành công!')
      // Điền sẵn thông tin vừa đổi vào form đăng nhập
      setForm({ username: forgotForm.username.trim(), password: forgotForm.new_password })
      setShowForgot(false)
      setForgotForm({ username: '', email: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Không thể đặt lại mật khẩu')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1>Web Học Hộ</h1>
          <p>Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              id="login-username"
              className="form-input"
              type="text"
              placeholder="username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="flex flex-between align-center" style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Mật khẩu</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '0 4px', fontSize: '0.8rem', color: 'var(--primary-light)', textDecoration: 'underline' }}
                onClick={() => {
                  setForgotForm(prev => ({ ...prev, username: form.username }))
                  setShowForgot(true)
                }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Đang đăng nhập...</> : '🚀 Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>

      {/* Modal Quên mật khẩu */}
      {showForgot && (
        <div className="modal-backdrop" onClick={() => setShowForgot(false)}>
          <div className="modal card" style={{ maxWidth: 440, width: '100%', margin: 20 }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">🔑 Quên mật khẩu</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForgot(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
              Xác minh tên đăng nhập và email đã đăng ký để tự đặt lại mật khẩu mới.
            </p>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={forgotForm.username}
                  onChange={e => setForgotForm(f => ({ ...f, username: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email đã đăng ký</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="vidu@gmail.com"
                  value={forgotForm.email}
                  onChange={e => setForgotForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Tối thiểu 6 ký tự"
                  value={forgotForm.new_password}
                  onChange={e => setForgotForm(f => ({ ...f, new_password: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={forgotForm.confirm_password}
                  onChange={e => setForgotForm(f => ({ ...f, confirm_password: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForgot(false)}
                  disabled={forgotLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Đang xử lý...</> : '✓ Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
