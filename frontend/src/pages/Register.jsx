import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', full_name: '', phone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.register(form)
      toast.success('Đăng ký thành công! Đăng nhập ngay nhé 🎉')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1>Tạo tài khoản</h1>
          <p>Đăng ký tài khoản người học hộ</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input id="reg-name" className="form-input" type="text" placeholder="Nguyễn Văn A"
              value={form.full_name} onChange={set('full_name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input id="reg-username" className="form-input" type="text" placeholder="username"
              value={form.username} onChange={set('username')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="reg-email" className="form-input" type="email" placeholder="email@gmail.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input id="reg-phone" className="form-input" type="tel" placeholder="0912345678"
              value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input id="reg-password" className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Đang tạo tài khoản...</> : '✨ Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
