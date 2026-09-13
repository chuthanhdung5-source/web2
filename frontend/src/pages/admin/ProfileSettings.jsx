import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    adminAPI.getProfile()
      .then(r => { setProfile(r.data); setForm(r.data) })
      .catch(() => setForm({}))
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminAPI.updateProfile(form)
      setProfile(res.data)
      toast.success('✅ Đã lưu hồ sơ!')
    } catch { toast.error('Lỗi khi lưu') }
    finally { setSaving(false) }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return
    try {
      const res = await adminAPI.uploadPhoto(photoFile)
      setProfile(p => ({ ...p, photo_url: res.data.photo_url }))
      toast.success('📸 Đã cập nhật ảnh!')
    } catch { toast.error('Lỗi upload ảnh') }
  }

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>🎓 Hồ sơ sinh viên</h1>
        <p>Thông tin này sẽ hiển thị cho tất cả thành viên</p>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        {/* Photo upload */}
        <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            {(photoPreview || profile?.photo_url) ? (
              <img src={photoPreview || profile.photo_url} alt="avatar"
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            ) : (
              <div className="avatar" style={{ width: 100, height: 100, fontSize: '2rem' }}>
                {form.full_name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ marginBottom: 8 }}>{profile?.full_name || 'Admin'}</h3>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              📷 Chọn ảnh <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            </label>
            {photoFile && (
              <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={uploadPhoto}>
                ⬆️ Upload
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={save} style={{ display: 'contents' }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Thông tin cơ bản</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" value={form.full_name || ''} onChange={set('full_name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Mã sinh viên</label>
                <input className="form-input" value={form.student_id || ''} onChange={set('student_id')} placeholder="23028..." />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sinh</label>
                <input className="form-input" type="date" value={form.date_of_birth || ''} onChange={set('date_of_birth')} />
              </div>
              <div className="form-group">
                <label className="form-label">CCCD/CMND</label>
                <input className="form-input" value={form.id_card || ''} onChange={set('id_card')} placeholder="0123..." />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Thông tin trường</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Chương trình đào tạo</label>
                <input className="form-input" value={form.program || ''} onChange={set('program')} />
              </div>
              <div className="form-group">
                <label className="form-label">Khóa</label>
                <input className="form-input" value={form.cohort || ''} onChange={set('cohort')} />
              </div>
              <div className="form-group">
                <label className="form-label">Trường</label>
                <input className="form-input" value={form.university || ''} onChange={set('university')} />
              </div>
              <div className="form-group">
                <label className="form-label">Khoa</label>
                <input className="form-input" value={form.faculty || ''} onChange={set('faculty')} />
              </div>
              <div className="form-group">
                <label className="form-label">Lớp</label>
                <input className="form-input" value={form.class_name || ''} onChange={set('class_name')} />
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16 }}>Ghi chú cho thành viên</h3>
            <textarea className="form-input" rows={4} value={form.notes || ''} onChange={set('notes')}
              placeholder="Nhập hướng dẫn, lưu ý cho người học hộ..." />
            <button type="submit" id="save-profile" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
              {saving ? '⏳ Đang lưu...' : '💾 Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
