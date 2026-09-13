import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.updateProfile({ full_name: form.full_name, email: form.email, phone: form.phone })
      await refreshUser()
      toast.success('✅ Đã cập nhật hồ sơ!')
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi') }
    finally { setSaving(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Mật khẩu xác nhận không khớp')
    setChangingPw(true)
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('🔒 Đổi mật khẩu thành công!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.detail || 'Mật khẩu hiện tại không đúng') }
    finally { setChangingPw(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>👤 Hồ sơ cá nhân</h1>
        <p>Cập nhật thông tin tài khoản</p>
      </div>

      <div className="grid grid-2">
        {/* Profile form */}
        <form onSubmit={saveProfile} className="card">
          <h3 className="h3" style={{ marginBottom: 16 }}>Thông tin cơ bản</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input id="profile-name" className="form-input" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input id="profile-email" className="form-input" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input id="profile-phone" className="form-input" type="tel" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input className="form-input" value={user?.username} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>

          <button id="save-profile" type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </form>

        {/* Password change */}
        <form onSubmit={changePassword} className="card">
          <h3 className="h3" style={{ marginBottom: 16 }}>🔒 Đổi mật khẩu</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input id="current-pw" className="form-input" type="password" value={pwForm.current_password}
                onChange={setPw('current_password')} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input id="new-pw" className="form-input" type="password" value={pwForm.new_password}
                onChange={setPw('new_password')} required minLength={6} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input id="confirm-pw" className="form-input" type="password" value={pwForm.confirm}
                onChange={setPw('confirm')} required minLength={6} placeholder="••••••••" />
            </div>
          </div>

          <button id="change-password" type="submit" className="btn btn-secondary" style={{ marginTop: 16 }} disabled={changingPw}>
            {changingPw ? '⏳ Đang đổi...' : '🔑 Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}
