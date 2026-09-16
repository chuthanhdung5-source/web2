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
      toast.success('Đã thức tỉnh Võ Hồn! Mau mau nhập cảnh Tiên Môn 🎉')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Thức tỉnh thất bại, linh lực bất túc')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <span>🔮</span>
            <span>ĐẤU LA TÔNG MÔN v2.0</span>
          </div>
          <div className="auth-logo">🔮</div>
          <h1>Gia Nhập Hồn Sư</h1>
          <p>Thức tỉnh Võ Hồn & Bắt đầu khảo thí tu luyện</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Đạo Hiệu / Chân Tên</label>
            <input id="reg-name" className="form-input" type="text" placeholder="Đường Tam / Tiêu Viêm"
              value={form.full_name} onChange={set('full_name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Đạo Tịch Đăng Nhập</label>
            <input id="reg-username" className="form-input" type="text" placeholder="username"
              value={form.username} onChange={set('username')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Linh Hạc Truyền Thư</label>
            <input id="reg-email" className="form-input" type="email" placeholder="email@gmail.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Thần Thức Cảm Ứng</label>
            <input id="reg-phone" className="form-input" type="tel" placeholder="0912345678"
              value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <label className="form-label">Khẩu Quyết Tâm Pháp</label>
            <input id="reg-password" className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <button id="reg-submit" type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Đang thức tỉnh Võ Hồn...</> : '⚡ Thức Tỉnh & Khai Môn Nhập Đạo'}
          </button>
        </form>

        <div className="auth-footer">
          Đã thức tỉnh Võ Hồn?{' '}
          <Link to="/login" style={{ color: '#c084fc', fontWeight: 700 }}>
            Nhập cảnh Tiên Môn
          </Link>
        </div>
      </div>
    </div>
  )
}
