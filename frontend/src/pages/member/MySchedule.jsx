import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { memberAPI } from '../../api'
import toast from 'react-hot-toast'

const STATUS_INFO = {
  open: { label: 'Trống', cls: 'badge-open' },
  registered: { label: 'Chờ duyệt', cls: 'badge-registered' },
  approved: { label: 'Đã duyệt', cls: 'badge-approved' },
  completed: { label: 'Hoàn thành', cls: 'badge-completed' },
  cancelled: { label: 'Đã hủy', cls: 'badge-cancelled' },
  in_progress: { label: 'Đang học', cls: 'badge-approved' },
}

export default function MySchedule() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const load = () => {
    memberAPI.getMySessions().then(r => setSessions(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const cancel = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy đăng ký ca này?')) return
    setCancelling(id)
    try {
      await memberAPI.cancelRegistration(id)
      toast.success('Đã hủy đăng ký')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi') }
    finally { setCancelling(null) }
  }

  const upcoming = sessions.filter(s => ['approved', 'registered', 'in_progress'].includes(s.status))
  const past = sessions.filter(s => ['completed', 'cancelled'].includes(s.status))

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>📅 Lịch của tôi</h1>
        <p>Tổng {sessions.length} ca học, {upcoming.length} sắp diễn ra</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Chưa có ca học nào</h3>
          <p><Link to="/member/slots" style={{ color: 'var(--primary-light)' }}>Đăng ký ca học ngay →</Link></p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 className="h3" style={{ marginBottom: 16 }}>⏳ Sắp diễn ra</h2>
              <div className="grid grid-2">
                {upcoming.map(s => <SessionCard key={s.id} session={s} onCancel={cancel} cancelling={cancelling} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="h3" style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>✅ Đã qua</h2>
              <div className="grid grid-2">
                {past.map(s => <SessionCard key={s.id} session={s} onCancel={cancel} cancelling={cancelling} past />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SessionCard({ session: s, onCancel, cancelling, past }) {
  const info = STATUS_INFO[s.status] || { label: s.status, cls: 'badge-pending' }
  const isToday = new Date(s.session_date).toDateString() === new Date().toDateString()

  return (
    <div className="card card-elevated" style={{
      borderLeft: `3px solid ${s.status === 'approved' ? 'var(--accent-green)' : s.status === 'registered' ? 'var(--accent)' : 'var(--border-strong)'}`,
      opacity: past ? 0.75 : 1,
    }}>
      <div className="flex flex-between" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{s.schedule_slot?.subject?.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.schedule_slot?.subject?.code}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`badge ${info.cls}`}>{info.label}</span>
          {isToday && <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>🔥 HÔM NAY</span>}
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        <div>📅 {new Date(s.session_date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div>⏰ Tiết {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period} ({s.schedule_slot?.start_time} – {s.schedule_slot?.end_time})</div>
        <div>🏫 {s.schedule_slot?.classroom}</div>
      </div>

      <div className="flex gap-2">
        {s.status === 'approved' && (
          <Link to={`/member/checkin/${s.id}`} className="btn btn-primary btn-sm">
            📸 Check-in
          </Link>
        )}
        {s.status === 'registered' && (
          <button className="btn btn-danger btn-sm"
            disabled={cancelling === s.id}
            onClick={() => onCancel(s.id)}>
            {cancelling === s.id ? '⏳' : '❌ Hủy'}
          </button>
        )}
        {s.status === 'completed' && (
          <Link to={`/member/checkin/${s.id}`} className="btn btn-secondary btn-sm">
            👁 Xem ảnh
          </Link>
        )}
      </div>
    </div>
  )
}
