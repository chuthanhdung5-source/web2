import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { memberAPI } from '../../api'
import toast from 'react-hot-toast'

const PERIOD_TIMES = {
  1: '07:00–07:50', 2: '07:55–08:45', 3: '08:50–09:40',
  4: '09:50–10:40', 5: '10:45–11:35', 6: '11:40–12:30',
  7: '13:00–13:50', 8: '13:55–14:45', 9: '14:50–15:40',
  10: '15:50–16:40', 11: '16:45–17:35', 12: '17:40–18:30',
}

const STATUS_ICON = { pending: '⏳', verified: '✅', rejected: '❌', missed: '🚫' }
const STATUS_CLS = { pending: 'badge-pending', verified: 'badge-verified', rejected: 'badge-rejected', missed: 'badge-missed' }

export default function CheckinPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const [preview, setPreview] = useState({})
  const fileRefs = useRef({})

  const load = () => {
    memberAPI.getCheckins(sessionId)
      .then(r => setCheckins(r.data))
      .catch(() => navigate('/member/schedule'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [sessionId])

  const handleUpload = async (checkinId, file) => {
    if (!file) return
    setUploading(checkinId)
    try {
      await memberAPI.uploadCheckin(checkinId, file)
      toast.success(`📸 Đã nộp ảnh tiết ${checkins.find(c => c.id === checkinId)?.period_number}!`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi upload ảnh')
    } finally {
      setUploading(null)
    }
  }

  const onFileSelect = (checkinId, e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(p => ({ ...p, [checkinId]: URL.createObjectURL(file) }))
    handleUpload(checkinId, file)
  }

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  const verified = checkins.filter(c => c.status === 'verified').length
  const total = checkins.length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>📸 Check-in ca học</h1>
          <p>Nộp ảnh xác nhận cho từng tiết — {verified}/{total} tiết đã xác nhận</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/member/schedule')}>← Quay lại</button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem' }}>
          <span>Tiến độ check-in</span>
          <span style={{ fontWeight: 600 }}>{verified}/{total} tiết</span>
        </div>
        <div style={{ height: 8, background: 'var(--surface-hover)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${total > 0 ? (verified / total) * 100 : 0}%`,
            background: 'linear-gradient(90deg, var(--accent-green), var(--primary))',
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div className="grid grid-2">
        {checkins.map(c => {
          const isActive = isCurrentPeriod(c.period_number)
          const canUpload = ['pending'].includes(c.status) && c.status !== 'missed'

          return (
            <div key={c.id} className={`card ${isActive ? '' : ''}`} style={{
              border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
              boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
            }}>
              <div className="flex flex-between" style={{ marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>Tiết {c.period_number}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{PERIOD_TIMES[c.period_number]}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`badge ${STATUS_CLS[c.status]}`}>
                    {STATUS_ICON[c.status]} {
                      { pending: 'Chưa nộp', verified: 'Đã xác nhận', rejected: 'Bị từ chối', missed: 'Bỏ tiết' }[c.status]
                    }
                  </span>
                  {isActive && <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 600 }}>🔴 ĐANG HỌC</span>}
                </div>
              </div>

              {/* Photo preview */}
              {(c.photo_url || preview[c.id]) && (
                <img
                  src={preview[c.id] || c.photo_url}
                  alt="checkin photo"
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                />
              )}

              {c.reject_reason && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                  ❌ Lý do từ chối: {c.reject_reason}
                </div>
              )}

              {c.deadline && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  ⏱ Deadline: {new Date(c.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {canUpload && (
                <label
                  id={`upload-period-${c.period_number}`}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {uploading === c.id ? (
                    <><span className="spinner" /> Đang upload...</>
                  ) : (
                    <>{c.photo_url ? '🔄 Nộp lại ảnh' : '📷 Chụp/Chọn ảnh'}</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => onFileSelect(c.id, e)}
                    disabled={uploading === c.id}
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>

      {checkins.length === 0 && (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Không có tiết nào để check-in</h3>
        </div>
      )}
    </div>
  )
}

function isCurrentPeriod(periodNum) {
  const now = new Date()
  const times = {
    1: [7,0,7,50], 2: [7,55,8,45], 3: [8,50,9,40],
    4: [9,50,10,40], 5: [10,45,11,35], 6: [11,40,12,30],
    7: [13,0,13,50], 8: [13,55,14,45], 9: [14,50,15,40],
    10: [15,50,16,40], 11: [16,45,17,35], 12: [17,40,18,30],
  }
  const t = times[periodNum]
  if (!t) return false
  const start = new Date(); start.setHours(t[0], t[1], 0)
  const end = new Date(); end.setHours(t[2], t[3], 59)
  return now >= start && now <= end
}
