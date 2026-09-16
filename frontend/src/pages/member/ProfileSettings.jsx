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
      toast.success('✅ Đã khắc ghi căn cốt & danh xưng!')
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi lưu thông tin') }
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
      toast.success('💳 Đã cập nhật Tiên Trang thụ hưởng bổng lộc!')
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi cập nhật Tiên Trang') }
    finally { setSavingBank(false) }
  }

  const handleQRUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingQR(true)
    try {
      await memberAPI.uploadQR(file)
      await refreshUser()
      toast.success('🖼️ Đã lưu Thần Phù QR tiếp nhận linh thạch!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi upload Thần Phù QR')
    } finally {
      setUploadingQR(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Mật khẩu xác nhận không trùng khớp')
    setChangingPw(true)
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('🔒 Trọng luyện khẩu quyết thành công!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.detail || 'Khẩu quyết hiện tại không chính xác') }
    finally { setChangingPw(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>👤 Đạo Lộ Tu Tiên & Thần Phù Bản Thân</h1>
        <p>Khắc ghi danh xưng đệ tử và ngọc phù tiên trang tiếp nhận bổng lộc</p>
      </div>

      <div className="grid grid-2">
        <form onSubmit={saveProfile} className="card">
          <h3 className="h3" style={{ marginBottom: 16 }}>📋 Căn Cốt & Danh Xưng</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Đạo Hiệu / Họ và Tên</label>
              <input id="profile-name" className="form-input" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Linh Thư Hộp Thư (Email)</label>
              <input id="profile-email" className="form-input" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Truyền Âm Thần Lạc (SĐT)</label>
              <input id="profile-phone" className="form-input" type="tel" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Danh Xưng Tông Môn (Username)</label>
              <input className="form-input" value={user?.username} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>

          <button id="save-profile" type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? '⏳ Đang khắc ghi...' : '💾 Khắc Lên Ngọc Giản'}
          </button>
        </form>

        <form onSubmit={saveBankInfo} className="card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <h3 className="h3" style={{ marginBottom: 16, color: 'var(--accent-green)' }}>💳 Tiên Trang Thần Phù Nhận Bổng Lộc</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Tiên Trang (Ngân hàng / Ví)</label>
              <select className="form-input" value={form.bank_name} onChange={set('bank_name')}>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Số Tài Khoản Tiên Trang (STK)</label>
              <input id="bank-acc-no" className="form-input" placeholder="Ví dụ: 0987654321" value={form.bank_account_no} onChange={set('bank_account_no')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Danh Xưng Thụ Hưởng Bổng Lộc</label>
              <input id="bank-acc-name" className="form-input" placeholder="Ví dụ: NGUYEN VAN A" value={form.bank_account_name} onChange={set('bank_account_name')} required />
            </div>

            <div className="form-group" style={{ background: 'var(--surface-hover)', padding: 12, borderRadius: 8 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>🖼️ Thần Phù QR Tiếp Nhận Linh Thạch</label>
              {user?.qr_code_url ? (
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                  <img src={getImageUrl(user.qr_code_url)} alt="QR Code" style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: 4 }}>✅ Đã tế xuất Thần Phù QR</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>⚠️ Chưa có Thần Phù QR. Hãy tải ảnh lên để Ngân Khố giải ngân bổng lộc thuận tiện hơn.</div>
              )}

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                {uploadingQR ? '⏳ Đang truyền tống ảnh...' : '📷 Tế Xuất Thần Phù QR'}
                <input type="file" accept="image/*" onChange={handleQRUpload} style={{ display: 'none' }} disabled={uploadingQR} />
              </label>
            </div>
          </div>

          <button id="save-bank" type="submit" className="btn btn-success" style={{ marginTop: 16, width: '100%' }} disabled={savingBank}>
            {savingBank ? '⏳ Đang lưu...' : '💾 Lưu Tiên Trang Tiếp Nhận'}
          </button>
        </form>

        <form onSubmit={changePassword} className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="h3" style={{ marginBottom: 16 }}>🔒 Trọng Luyện Mật Khẩu Tâm Pháp</h3>

          <div className="grid grid-3" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Khẩu quyết hiện tại</label>
              <input id="current-pw" className="form-input" type="password" value={pwForm.current_password}
                onChange={setPw('current_password')} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Khẩu quyết mới</label>
              <input id="new-pw" className="form-input" type="password" value={pwForm.new_password}
                onChange={setPw('new_password')} required minLength={6} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Tái niệm khẩu quyết mới</label>
              <input id="confirm-pw" className="form-input" type="password" value={pwForm.confirm}
                onChange={setPw('confirm')} required minLength={6} placeholder="••••••••" />
            </div>
          </div>

          <button id="change-password" type="submit" className="btn btn-secondary" style={{ marginTop: 16 }} disabled={changingPw}>
            {changingPw ? '⏳ Đang trọng luyện...' : '🔑 Khắc Lại Khẩu Quyết'}
          </button>
        </form>
      </div>
    </div>
  )
}
