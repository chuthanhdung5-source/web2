import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI, memberAPI } from '../../api'
import { getImageUrl } from '../../api/client'
import toast from 'react-hot-toast'

const BANKS = [
  'MBBank (Ngân hàng Quân Đội)',
  'Vietcombank (VCB)',
  'Techcombank (TCB)',
  'ACB (Ngân hàng Á Châu)',
  'VPBank',
  'TPBank',
  'BIDV',
  'Agribank',
  'VietinBank',
  'Sacombank',
  'MoMo (Ví điện tử)',
  'ZaloPay (Ví điện tử)',
  'Khác (Ghi rõ ở STK)',
]

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bank_name: user?.bank_name || 'MBBank (Ngân hàng Quân Đội)',
    bank_account_no: user?.bank_account_no || '',
    bank_account_name: user?.bank_account_name || user?.full_name || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingBank, setSavingBank] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.updateProfile({ full_name: form.full_name, email: form.email, phone: form.phone })
      await refreshUser()
      toast.success('✅ Đã cập nhật thông tin cá nhân!')
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi') }
    finally { setSaving(false) }
  }

  const saveBankInfo = async (e) => {
    e.preventDefault()
    setSavingBank(true)
    try {
      await authAPI.updateProfile({
        bank_name: form.bank_name,
        bank_account_no: form.bank_account_no,
        bank_account_name: form.bank_account_name,
      })
      await refreshUser()
      toast.success('💳 Đã cập nhật tài khoản nhận tiền!')
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi cập nhật ngân hàng') }
    finally { setSavingBank(false) }
  }

  const handleQRUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingQR(true)
    try {
      await memberAPI.uploadQR(file)
      await refreshUser()
      toast.success('🖼️ Đã lưu ảnh Mã QR chuyển khoản!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi upload ảnh QR')
    } finally {
      setUploadingQR(false)
    }
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
        <p>Cập nhật thông tin tài khoản & tài khoản nhận thanh toán</p>
      </div>

      <div className="grid grid-2">
        {/* Profile form */}
        <form onSubmit={saveProfile} className="card">
          <h3 className="h3" style={{ marginBottom: 16 }}>📋 Thông tin cơ bản</h3>

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
            {saving ? '⏳ Đang lưu...' : '💾 Lưu thông tin cơ bản'}
          </button>
        </form>

        {/* Bank & Payment Info */}
        <form onSubmit={saveBankInfo} className="card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <h3 className="h3" style={{ marginBottom: 16, color: 'var(--accent-green)' }}>💳 Tài khoản nhận tiền học hộ</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Tên Ngân hàng / Ví điện tử</label>
              <select className="form-input" value={form.bank_name} onChange={set('bank_name')}>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Số tài khoản / Số ví MoMo</label>
              <input id="bank-acc-no" className="form-input" placeholder="Ví dụ: 0987654321" value={form.bank_account_no} onChange={set('bank_account_no')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Tên chủ tài khoản (Viết hoa không dấu)</label>
              <input id="bank-acc-name" className="form-input" placeholder="Ví dụ: NGUYEN VAN A" value={form.bank_account_name} onChange={set('bank_account_name')} required />
            </div>

            {/* QR Code Upload */}
            <div className="form-group" style={{ background: 'var(--surface-hover)', padding: 12, borderRadius: 8 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>🖼️ Ảnh Mã QR chuyển khoản (VietQR / Momo)</label>
              {user?.qr_code_url ? (
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                  <img src={getImageUrl(user.qr_code_url)} alt="QR Code" style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: 4 }}>✅ Đã có mã QR</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>⚠️ Chưa có ảnh QR. Hãy tải ảnh QR lên để Admin quét tiền chuyển khoản nhanh chóng hơn.</div>
              )}

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                {uploadingQR ? '⏳ Đang tải ảnh...' : '📷 Tải lên ảnh Mã QR'}
                <input type="file" accept="image/*" onChange={handleQRUpload} style={{ display: 'none' }} disabled={uploadingQR} />
              </label>
            </div>
          </div>

          <button id="save-bank" type="submit" className="btn btn-success" style={{ marginTop: 16, width: '100%' }} disabled={savingBank}>
            {savingBank ? '⏳ Đang lưu...' : '💾 Lưu thông tin nhận tiền'}
          </button>
        </form>

        {/* Password change */}
        <form onSubmit={changePassword} className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="h3" style={{ marginBottom: 16 }}>🔒 Đổi mật khẩu</h3>

          <div className="grid grid-3" style={{ gap: 16 }}>
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
