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
  const [rememberMe, setRememberMe] = useState(true)

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
    } catch {}
  }, [])

  const [showForgot, setShowForgot] = useState(false)
  const [forgotForm, setForgotForm] = useState({ username: '', email: '', new_password: '', confirm_password: '' })
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.username, form.password)

      try {
        const encoded = btoa(JSON.stringify({ username: form.username, password: form.password }))
        localStorage.setItem('douluo_remembered_creds', encoded)
      } catch {}

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
      toast('⚡ Đã nạp thông tin Admin Giáo Hoàng: admin', { icon: '👑' })
    } else {
      setForm({ username: 'member1', password: 'password' })
      toast('⚡ Đã nạp thông tin Hồn Sư: member1', { icon: '🥋' })
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
      <div className="auth-overlay-backdrop" />
      <div className="celestial-particles" />

      <form onSubmit={handleSubmit} className="auth-realm-container">
        <div className="celestial-header-shrine">
          <div className="shrine-top-badge">
            <span>✦</span>
            <span>ĐẤU LA TÔNG MÔN v2.0</span>
            <span>✦</span>
          </div>

          <div className="shrine-orb-core">
            <div className="shrine-orb-glow" />
            <div className="shrine-orb-ring" />
          </div>

          <h1 className="shrine-title">Đấu La Đại Khảo Chi Lưới</h1>
          <p className="shrine-subtitle">Hệ thống Khảo Thí & Tu Vi Hồn Sư</p>
        </div>

        <div className="celestial-dual-formation">
          <div className="celestial-portal-sphere sphere-ice">
            <div className="portal-crest-icon">❄️</div>
            <h2 className="portal-heading ice">THIÊN PHÚ</h2>
            <div className="portal-subheading ice">Đạo Tịch</div>
            <div className="portal-field-label">Tên Hồn Sư</div>

            <div className="celestial-input-tablet tablet-ice">
              <span className="tablet-icon-left">📜</span>
              <input
                id="login-username"
                className="celestial-raw-input"
                type="text"
                placeholder="Nhập tên đăng nhập..."
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
              <span className="tablet-icon-right">🛡️</span>
            </div>
          </div>

          <div className="celestial-center-nexus">
            <div className="taiji-core-vortex">
              <div className="taiji-swirl-left" />
              <div className="taiji-swirl-right" />
              <div className="taiji-jewel-gem">🔮</div>
            </div>

            <div className="celestial-action-podium">
              <div className="podium-halo-ring" />
              <button
                id="login-submit"
                type="submit"
                className="btn-celestial-enter"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                    <span>Đang Vận Chuyển...</span>
                  </>
                ) : (
                  <>
                    <span>🔱</span>
                    <span>NHẬP CẢNH TIÊN MÔN</span>
                    <span>🔱</span>
                  </>
                )}
              </button>

              <div className="podium-axiom-quote">
                Hài hòa song tu - Thiếu một bất thành
              </div>
            </div>
          </div>

          <div className="celestial-portal-sphere sphere-fire">
            <div className="portal-crest-icon">🔥</div>
            <h2 className="portal-heading fire">TÂM TÍNH</h2>
            <div className="portal-subheading fire">Khẩu Quyết</div>
            <div className="portal-field-label">Mật Khẩu Tâm Pháp</div>

            <div className="celestial-input-tablet tablet-fire">
              <span className="tablet-icon-left">🔑</span>
              <input
                id="login-password"
                className="celestial-raw-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="tablet-icon-right"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>

            <button
              type="button"
              className="forgot-pw-button"
              onClick={() => {
                setForgotForm((prev) => ({ ...prev, username: form.username }))
                setShowForgot(true)
              }}
            >
              Quên tâm pháp?
            </button>
          </div>
        </div>

        <div className="celestial-footer-link">
          Chưa thức tỉnh Võ Hồn? <Link to="/register">Gia nhập ngay</Link>
        </div>
      </form>

      {showForgot && (
        <div className="modal-backdrop" onClick={() => setShowForgot(false)}>
          <div
            className="modal card"
            style={{ maxWidth: 440, width: '100%', margin: 20, zIndex: 99999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">🔑 Tìm Lại Tâm Pháp</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForgot(false)}>
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
              Xác minh tên Hồn Sư và thư tín đã đăng ký để tự lập lại tâm pháp mới.
            </p>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Tên đăng nhập</label>
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
