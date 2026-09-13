import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function CheckinReview() {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  const load = () => {
    adminAPI.getPendingCheckins()
      .then(r => setCheckins(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handle = async (id, approve, reason = null) => {
    try {
      await adminAPI.verifyCheckin(id, approve, reason)
      toast.success(approve ? '✅ Đã xác nhận ảnh!' : '❌ Đã từ chối')
      setPreview(null)
      load()
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>📸 Xem ảnh Check-in</h1>
        <p>{checkins.length} ảnh đang chờ xác nhận</p>
      </div>

      {checkins.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Không có ảnh nào chờ xét duyệt</h3>
        </div>
      ) : (
        <div className="grid grid-3">
          {checkins.map(c => (
            <div key={c.id} className="card card-interactive" onClick={() => setPreview(c)}>
              <div style={{ position: 'relative' }}>
                {c.photo_url ? (
                  <img src={c.photo_url} alt="check-in"
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                ) : (
                  <div style={{ width: '100%', height: 180, background: 'var(--surface-hover)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '2rem' }}>📷</span>
                  </div>
                )}
                <span className="badge badge-pending" style={{ position: 'absolute', top: 8, right: 8 }}>Chờ duyệt</span>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Tiết {c.period_number}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Nộp lúc: {c.submitted_at ? new Date(c.submitted_at).toLocaleString('vi-VN') : '--'}
              </div>
              <div className="flex gap-2" style={{ marginTop: 12 }}>
                <button id={`verify-${c.id}`} className="btn btn-success btn-sm"
                  onClick={e => { e.stopPropagation(); handle(c.id, true) }}>✅ OK</button>
                <button id={`reject-${c.id}`} className="btn btn-danger btn-sm"
                  onClick={e => { e.stopPropagation(); handle(c.id, false, 'Ảnh không hợp lệ') }}>❌ Từ chối</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 style={{ marginBottom: 16 }}>📸 Ảnh Check-in — Tiết {preview.period_number}</h3>
            {preview.photo_url && (
              <img src={preview.photo_url} alt="preview"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, marginBottom: 16 }} />
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Nộp lúc: {preview.submitted_at ? new Date(preview.submitted_at).toLocaleString('vi-VN') : '--'}
              &nbsp;|&nbsp; Deadline: {preview.deadline ? new Date(preview.deadline).toLocaleString('vi-VN') : '--'}
            </div>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>Đóng</button>
              <button className="btn btn-danger" onClick={() => handle(preview.id, false, 'Ảnh không hợp lệ')}>❌ Từ chối</button>
              <button className="btn btn-success" onClick={() => handle(preview.id, true)}>✅ Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
