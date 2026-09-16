import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { getImageUrl } from '../../api/client'
import { useDouluo } from '../../context/DouluoContext'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { key: 'pending', label: '⏳ Đang Chờ Giám Định' },
  { key: 'verified', label: '🟢 Đã Thẩm Định Hợp Quy' },
  { key: 'rejected', label: '🔴 Bác Bỏ Bất Toàn' },
  { key: 'all', label: '📋 Toàn Bộ Pháp Ảnh' },
]

export default function CheckinReview() {
  const { spendDiamonds } = useDouluo()
  const [checkins, setCheckins] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  const load = () => {
    setLoading(true)
    adminAPI.getCheckins(activeTab)
      .then(r => setCheckins(r.data))
      .catch(() => toast.error('Lỗi tải danh sách pháp ảnh'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [activeTab])

  const handle = async (id, approve, reason = null) => {
    try {
      spendDiamonds(20, approve ? 'Tử Cực Ma Đồng giám định pháp ảnh chuẩn' : 'Bác bỏ pháp ảnh bất toàn')
      await adminAPI.verifyCheckin(id, approve, reason)
      toast.success(approve ? '✅ Đã thẩm định pháp ảnh hợp quy!' : '❌ Đã bác bỏ pháp ảnh')
      setPreview(null)
      load()
    } catch {
      toast.error('Có lỗi xảy ra khi thẩm định')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="badge badge-verified">🟢 Đã Thẩm Định</span>
      case 'rejected':
        return <span className="badge badge-rejected">🔴 Bác Bỏ</span>
      case 'pending':
      default:
        return <span className="badge badge-pending">⏳ Chờ Giám Định</span>
    }
  }

  return (
    <div>
      <div className="page-header flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>📸 Linh Kính Giám Định Thần Ảnh Khảo Thí</h1>
          <p>Soi chiếu toàn bộ pháp ảnh điểm danh nhập trận của chư vị đệ tử</p>
        </div>

        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : checkins.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Không có pháp ảnh nào trong giới vực này</h3>
          <p>Thử đổi phân loại khác để tra cứu thần ảnh khảo thí</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {checkins.map(c => (
            <div key={c.id} className="card card-interactive" onClick={() => setPreview(c)}>
              <div style={{ position: 'relative' }}>
                {c.photo_url ? (
                  <img
                    src={getImageUrl(c.photo_url)}
                    alt="check-in"
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 180, background: 'var(--surface-hover)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '2rem' }}>📷</span>
                  </div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  {getStatusBadge(c.status)}
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4, color: 'var(--text-primary)' }}>
                {c.subject_name} — Khắc {c.period_number}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: 4 }}>
                👤 {c.member_name} (@{c.member_username})
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                🗓️ Ngày: {c.session_date} | 🏰 Đạo Trường: {c.classroom}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ⏰ Tế xuất lúc: {c.submitted_at ? new Date(c.submitted_at).toLocaleString('vi-VN') : 'Chưa nộp'}
              </div>

              {c.reject_reason && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: 4, fontStyle: 'italic' }}>
                  ⚠️ Cớ do bác bỏ: {c.reject_reason}
                </div>
              )}

              {c.status === 'pending' && (
                <div className="flex gap-2" style={{ marginTop: 12 }}>
                  <button id={`verify-${c.id}`} className="btn btn-success btn-sm flex-1"
                    onClick={e => { e.stopPropagation(); handle(c.id, true) }}>✅ Hợp Quy</button>
                  <button id={`reject-${c.id}`} className="btn btn-danger btn-sm flex-1"
                    onClick={e => { e.stopPropagation(); handle(c.id, false, 'Pháp ảnh bất toàn, mờ nhạt') }}>❌ Bác Bỏ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="flex flex-between align-center" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>📸 Chi Tiết Pháp Ảnh Khảo Thí — Khắc {preview.period_number}</h3>
              {getStatusBadge(preview.status)}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              <strong>Pháp Môn:</strong> {preview.subject_name} ({preview.subject_code}) &nbsp;|&nbsp;
              <strong> Khảo Kỳ:</strong> {preview.session_date} &nbsp;|&nbsp;
              <strong> Đạo Trường:</strong> {preview.classroom}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: 12 }}>
              👤 Đệ tử chấp sự: {preview.member_name} (@{preview.member_username})
            </div>

            {preview.photo_url ? (
              <img
                src={getImageUrl(preview.photo_url)}
                alt="preview"
                style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8, background: '#000', marginBottom: 16 }}
              />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--surface-hover)', borderRadius: 8, marginBottom: 16, color: 'var(--text-muted)' }}>
                Chưa tế xuất pháp ảnh
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>⏰ Tế xuất lúc: {preview.submitted_at ? new Date(preview.submitted_at).toLocaleString('vi-VN') : '--'}</div>
              <div>⏳ Hạn định phong ấn: {preview.deadline ? new Date(preview.deadline).toLocaleString('vi-VN') : '--'}</div>
              {preview.verified_at && (
                <div>✅ Đã xử lý lúc: {new Date(preview.verified_at).toLocaleString('vi-VN')}</div>
              )}
              {preview.reject_reason && (
                <div style={{ color: 'var(--accent-red)', fontWeight: 600 }}>❌ Cớ do bác bỏ: {preview.reject_reason}</div>
              )}
            </div>

            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>Thu Lại</button>
              {preview.status !== 'rejected' && (
                <button className="btn btn-danger" onClick={() => handle(preview.id, false, 'Pháp ảnh bất toàn, mờ nhạt')}>❌ Bác Bỏ Thần Ảnh</button>
              )}
              {preview.status !== 'verified' && (
                <button className="btn btn-success" onClick={() => handle(preview.id, true)}>✅ Chuẩn Định Hợp Quy</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
