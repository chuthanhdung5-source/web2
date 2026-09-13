import { useEffect, useState } from 'react'
import { scheduleAPI, memberAPI } from '../../api'
import TimetableGrid from '../../components/Schedule/TimetableGrid'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'

const DAY_NAMES = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' }

export default function AvailableSlots() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [allWeeklySessions, setAllWeeklySessions] = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'cards'

  const load = () => {
    setLoading(true)
    const formattedWeek = format(weekStart, 'yyyy-MM-dd')
    Promise.all([
      scheduleAPI.getAvailableSessions(formattedWeek),
      scheduleAPI.getWeeklySessions(formattedWeek),
    ]).then(([availRes, allRes]) => {
      setSessions(availRes.data)
      setAllWeeklySessions(allRes.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [weekStart])

  const register = async (sessionId) => {
    setRegistering(sessionId)
    try {
      await memberAPI.registerSession(sessionId)
      toast.success('✅ Đã đăng ký! Chờ admin duyệt nhé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Đăng ký thất bại')
    } finally {
      setRegistering(null)
    }
  }

  const cancelRegister = async (sessionId) => {
    if (!confirm('Bạn có chắc muốn hủy đăng ký ca học này?')) return
    setRegistering(sessionId)
    try {
      await memberAPI.cancelRegistration(sessionId)
      toast.success('Đã hủy đăng ký ca học')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hủy thất bại')
    } finally {
      setRegistering(null)
    }
  }

  const weekLabel = `${format(weekStart, 'dd/MM')} – ${format(addWeeks(weekStart, 1), 'dd/MM/yyyy')}`

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>📋 Đăng ký ca học</h1>
          <p>Xem Bảng Thời khóa biểu ma trận tuần và bấm Đăng ký ca phù hợp</p>
        </div>

        <div className="flex gap-2">
          <button
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewMode('grid')}
          >
            🗓️ Bảng TKB Ma trận
          </button>
          <button
            className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewMode('cards')}
          >
            📋 Ca học Trống ({sessions.length})
          </button>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex gap-3" style={{ marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>← Tuần trước</button>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tuần {weekLabel}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>Tuần sau →</button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : viewMode === 'grid' ? (
        <TimetableGrid
          weeklySessions={allWeeklySessions}
          isAdmin={false}
          currentUserId={user?.id}
          onRegister={register}
          onCancelRegister={cancelRegister}
        />
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏖️</div>
          <h3>Không có ca học trống trong tuần này</h3>
          <p>Thử xem tuần khác hoặc chuyển sang dạng Bảng TKB Ma trận</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {sessions.map(s => (
            <div key={s.id} className="card card-elevated" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="flex flex-between" style={{ marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{s.schedule_slot?.subject?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>
                    {s.schedule_slot?.subject?.code} — {s.schedule_slot?.subject?.class_code}
                  </div>
                </div>
                <span className="badge badge-open">Trống</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>📅 Ngày: </span>
                  <strong>{new Date(s.session_date).toLocaleDateString('vi-VN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>📆 Thứ: </span>
                  <strong>{DAY_NAMES[s.schedule_slot?.day_of_week]}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>📚 Tiết: </span>
                  <strong>Tiết {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>⏰ Giờ: </span>
                  <strong>{s.schedule_slot?.start_time} – {s.schedule_slot?.end_time}</strong>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🏫 Phòng: </span>
                  <strong>{s.schedule_slot?.classroom}</strong>
                </div>
              </div>

              {/* Tiền tính được */}
              <div style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: '0.875rem',
              }}>
                💰 Dự kiến nhận:{' '}
                <strong style={{ color: 'var(--accent-green)' }}>
                  {((s.schedule_slot?.end_period - s.schedule_slot?.start_period + 1) * 35000).toLocaleString('vi-VN')}đ
                </strong>
                {' '}({s.schedule_slot?.end_period - s.schedule_slot?.start_period + 1} tiết × 35,000đ)
              </div>

              <button
                id={`register-${s.id}`}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => register(s.id)}
                disabled={registering === s.id}
              >
                {registering === s.id ? '⏳ Đang đăng ký...' : '📝 Đăng ký ca này'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
