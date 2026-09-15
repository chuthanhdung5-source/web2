import { useState, useEffect } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Check saved credentials on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('douluo_remembered_creds')
      if (saved) {
        const parsed = JSON.parse(atob(saved))
        if (parsed.username && parsed.password) {
          setForm({ username: parsed.username, password: parsed.password })
          setRememberMe(true)
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotForm, setForgotForm] = useState({ username: '', email: '', new_password: '', confirm_password: '' })
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.username, form.password)

      // Handle remember password privilege
      if (rememberMe) {
        try {
          const encoded = btoa(JSON.stringify({ username: form.username, password: form.password }))
          localStorage.setItem('douluo_remembered_creds', encoded)
        } catch {
          // ignore
        }
      } else {
        localStorage.removeItem('douluo_remembered_creds')
      }

      if (enabled) {
        spendDiamonds(50, 'Nhập cảnh Đấu La Đại Khảo Chi Lưới')
      }

      toast.success(`Hồn Sư ${user.full_name} nhập cảnh thành công! 🔮`, { duration: 4000 })
      navigate(user.role === 'admin' ? '/admin' : '/member')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tâm pháp!')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setForm({ username: 'admin', password: 'password' })
      toast('⚡ Đã nạp thông tin Admin Giáo Hoàng (admin / password)', { icon: '👑' })
    } else {
      setForm({ username: 'member1', password: 'password' })
      toast('⚡ Đã nạp thông tin Hồn Sư (member1 / password)', { icon: '🥋' })
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
        new_password: forgotForm.new_password,
      })
      toast.success(res.data?.message || '✅ Đặt lại mật khẩu thành công!')
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
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <span>🔮</span>
            <span>Đấu La Tông Môn v2.0</span>
          </div>

          <div className="auth-logo">🔮</div>

          <h1>Đấu La Đại Khảo Chi Lưới</h1>
          <p>Hệ thống Khảo Thí & Tu Vi Hồn Sư</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Tên Hồn Sư (Username)</label>
            <div className="input-with-icon">
              <span className="input-icon-prefix">👤</span>
              <input
                id="login-username"
                className="form-input"
                type="text"
                placeholder="Nhập tên đăng nhập..."
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex flex-between align-center" style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Mật Khẩu Tâm Pháp</label>
              <button
                type="button"
                className="forgot-link btn btn-ghost btn-sm"
                style={{ padding: '0 4px', fontSize: '0.8rem' }}
                onClick={() => {
                  setForgotForm((prev) => ({ ...prev, username: form.username }))
                  setShowForgot(true)
                }}
              >
                Quên tâm pháp?
              </button>
            </div>
            <div className="input-with-icon">
              <span className="input-icon-prefix">🔑</span>
              <input
                id="login-password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Ghi nhớ tâm pháp (Lưu mật khẩu) */}
          <div className="remember-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ tâm pháp (Lưu mật khẩu)</span>
            </label>
            <span className="remember-badge-locked" title="Đặc quyền lưu thông tin">
              🔐 500 💎
            </span>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Đang vận chuyển hồn lực...
              </>
            ) : (
              <>⚡ Nhập Cảnh Tiên Môn</>
            )}
          </button>
        </form>

        {/* Quick Fill Test Accounts */}
        <div className="quick-fill-box">
          <p className="quick-fill-title">⚡ Điền Nhanh Tài Khoản Thử Nghiệm</p>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('admin')}
            >
              👑 Admin Giáo Hoàng
            </button>
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('member')}
            >
              🥋 Hồn Sư Member
            </button>
          </div>
        </div>

        <div className="auth-footer" style={{ marginTop: 18 }}>
          Chưa thức tỉnh Võ Hồn?{' '}
          <Link to="/register" style={{ color: '#c084fc', fontWeight: 700 }}>
            Gia nhập ngay
          </Link>
        </div>
      </div>

      {/* Modal Quên mật khẩu */}
      {showForgot && (
        <div className="modal-backdrop" onClick={() => setShowForgot(false)}>
          <div
            className="modal card"
            style={{ maxWidth: 440, width: '100%', margin: 20, zIndex: 99999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">🔑 Tìm Lại Tâm Pháp (Mật Khẩu)</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForgot(false)}>
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
              Xác minh tên Hồn Sư và thư tín (email) đã đăng ký để tự lập lại tâm pháp mới.
            </p>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={forgotForm.username}
                  onChange={(e) => setForgotForm((f) => ({ ...f, username: e.target.value }))}
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
                  onChange={(e) => setForgotForm((f) => ({ ...f, email: e.target.value }))}
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
                  onChange={(e) => setForgotForm((f) => ({ ...f, new_password: e.target.value }))}
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
                  onChange={(e) => setForgotForm((f) => ({ ...f, confirm_password: e.target.value }))}
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
                  {forgotLoading ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14 }} /> Đang xử lý...
                    </>
                  ) : (
                    '✓ Đặt lại tâm pháp'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
