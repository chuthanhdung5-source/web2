import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { getImageUrl } from '../../api/client'
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
      toast.success('✅ Đã khắc ghi Ngọc Giản Thân Phận!')
    } catch { toast.error('Khắc ghi thất bại!') }
    finally { setSaving(false) }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return
    try {
      const res = await adminAPI.uploadPhoto(photoFile)
      setProfile(p => ({ ...p, photo_url: res.data.photo_url }))
      toast.success('📸 Đã khắc sâu Thần Ảnh!')
    } catch { toast.error('Truyền thâu thất bại!') }
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
        <h1>🎓 Ngọc Giản Thân Phận Đồng Môn Cần Hộ Đạo</h1>
        <p>Thông tức chân thân sẽ hiển thị cho chư vị tu giả hộ đạo quan sát</p>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            {(photoPreview || profile?.photo_url) ? (
              <img src={photoPreview || getImageUrl(profile.photo_url)} alt="avatar"
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            ) : (
              <div className="avatar" style={{ width: 100, height: 100, fontSize: '2rem' }}>
                {form.full_name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ marginBottom: 8 }}>{profile?.full_name || 'Đồng Môn'}</h3>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              📷 Khắc Họa Thần Ảnh <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            </label>
            {photoFile && (
              <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={uploadPhoto}>
                ⬆️ Truyền Thâu Ảnh
              </button>
            )}
          </div>
        </div>

        <form onSubmit={save} style={{ display: 'contents' }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Căn Bản Đạo Tịch</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Đạo Hiệu</label>
                <input className="form-input" value={form.full_name || ''} onChange={set('full_name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Mã Đạo Tịch</label>
                <input className="form-input" value={form.student_id || ''} onChange={set('student_id')} placeholder="23028..." />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày Giáng Thế</label>
                <input className="form-input" type="date" value={form.date_of_birth || ''} onChange={set('date_of_birth')} />
              </div>
              <div className="form-group">
                <label className="form-label">Đạo Phù Định Danh</label>
                <input className="form-input" value={form.id_card || ''} onChange={set('id_card')} placeholder="0123..." />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Tiên Tông & Sơn Môn</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Đạo Pháp Tu Tập</label>
                <input className="form-input" value={form.program || ''} onChange={set('program')} />
              </div>
              <div className="form-group">
                <label className="form-label">Niên Khóa Truyền Thừa</label>
                <input className="form-input" value={form.cohort || ''} onChange={set('cohort')} />
              </div>
              <div className="form-group">
                <label className="form-label">Tiên Viện</label>
                <input className="form-input" value={form.university || ''} onChange={set('university')} />
              </div>
              <div className="form-group">
                <label className="form-label">Đường Khẩu</label>
                <input className="form-input" value={form.faculty || ''} onChange={set('faculty')} />
              </div>
              <div className="form-group">
                <label className="form-label">Pháp Tràng Đạo Lữ</label>
                <input className="form-input" value={form.class_name || ''} onChange={set('class_name')} />
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16 }}>Mật Lệnh Căn Dặn Chư Vị Hộ Đạo</h3>
            <textarea className="form-input" rows={4} value={form.notes || ''} onChange={set('notes')}
              placeholder="Nhập khẩu quyết, pháp chỉ lưu ý khi thay mặt nhập trận hộ đạo..." />
            <button type="submit" id="save-profile" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
              {saving ? '⏳ Đang truyền thức lưu ấn...' : '💾 Khắc Ghi Ngọc Giản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
