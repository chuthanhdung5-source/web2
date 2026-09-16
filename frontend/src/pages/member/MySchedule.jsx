import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { memberAPI } from '../../api'
import toast from 'react-hot-toast'

const STATUS_INFO = {
  open: { label: 'Bỏ Ngỏ', cls: 'badge-open' },
  registered: { label: 'Chờ Phê', cls: 'badge-registered' },
  approved: { label: 'Đã Ban Lệnh', cls: 'badge-approved' },
  completed: { label: 'Viên Mãn', cls: 'badge-completed' },
  cancelled: { label: 'Thu Hồi', cls: 'badge-cancelled' },
  in_progress: { label: 'Đang Nhập Trận', cls: 'badge-approved' },
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
    if (!confirm('Đạo hữu có chắc muốn thu hồi thỉnh mệnh tràng hộ đạo này?')) return
    setCancelling(id)
    try {
      await memberAPI.cancelRegistration(id)
      toast.success('Đã thu hồi thỉnh mệnh tràng hộ đạo')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi thu hồi') }
    finally { setCancelling(null) }
  }

  const upcoming = sessions.filter(s => ['approved', 'registered', 'in_progress'].includes(s.status))
  const past = sessions.filter(s => ['completed', 'cancelled'].includes(s.status))

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>📅 Lịch Trình Hộ Đạo Bản Thân</h1>
        <p>Tổng {sessions.length} tràng hộ đạo, {upcoming.length} tràng sắp khai mở</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Chưa có đạo tràng nào</h3>
          <p><Link to="/member/slots" style={{ color: 'var(--primary-light)' }}>Lĩnh nhận khảo nghiệm ngay →</Link></p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 className="h3" style={{ marginBottom: 16 }}>⏳ Sắp Khai Mở Khảo Kỳ</h2>
              <div className="grid grid-2">
                {upcoming.map(s => <SessionCard key={s.id} session={s} onCancel={cancel} cancelling={cancelling} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="h3" style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>✅ Đã Viên Mãn</h2>
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
          {isToday && <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>🔥 HÔM NAY NHẬP TRẬN</span>}
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        <div>📅 {new Date(s.session_date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div>⏰ Khắc {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period} ({s.schedule_slot?.start_time} – {s.schedule_slot?.end_time})</div>
        <div>🏰 Đạo Trường: {s.schedule_slot?.classroom}</div>
      </div>

      <div className="flex gap-2">
        {s.status === 'approved' && (
          <Link to={`/member/checkin/${s.id}`} className="btn btn-primary btn-sm">
            📸 Điểm Danh Nhập Trận
          </Link>
        )}
        {s.status === 'registered' && (
          <button className="btn btn-danger btn-sm"
            disabled={cancelling === s.id}
            onClick={() => onCancel(s.id)}>
            {cancelling === s.id ? '⏳' : '❌ Thu Hồi Thỉnh Mệnh'}
          </button>
        )}
        {s.status === 'completed' && (
          <Link to={`/member/checkin/${s.id}`} className="btn btn-secondary btn-sm">
            👁 Chiêm Nghiệm Thần Ảnh
          </Link>
        )}
      </div>
    </div>
  )
}
