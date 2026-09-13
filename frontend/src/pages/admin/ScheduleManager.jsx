import { useEffect, useState } from 'react'
import { scheduleAPI } from '../../api'
import toast from 'react-hot-toast'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { vi } from 'date-fns/locale'

const DAY_NAMES = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' }

export default function ScheduleManager() {
  const [sessions, setSessions] = useState([])
  const [semesters, setSemesters] = useState([])
  const [activeSemester, setActiveSemester] = useState(null)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    scheduleAPI.getSemesters().then(r => {
      setSemesters(r.data)
      const active = r.data.find(s => s.is_active) || r.data[0]
      setActiveSemester(active?.id)
    })
  }, [])

  useEffect(() => {
    if (!weekStart) return
    setLoading(true)
    scheduleAPI.getWeeklySessions(format(weekStart, 'yyyy-MM-dd'))
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false))
  }, [weekStart])

  const generateWeek = async () => {
    if (!activeSemester) return toast.error('Chưa chọn học kỳ')
    setGenerating(true)
    try {
      const res = await scheduleAPI.generateWeeklySessions(format(weekStart, 'yyyy-MM-dd'), activeSemester)
      toast.success(res.data.message)
      scheduleAPI.getWeeklySessions(format(weekStart, 'yyyy-MM-dd')).then(r => setSessions(r.data))
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi tạo lịch') }
    finally { setGenerating(false) }
  }

  const weekLabel = `${format(weekStart, 'dd/MM')} – ${format(addWeeks(weekStart, 1), 'dd/MM/yyyy')}`

  return (
    <div>
      <div className="page-header">
        <h1>📅 Thời khóa biểu</h1>
        <p>Quản lý lịch học và tạo ca học theo tuần</p>
      </div>

      {/* Controls */}
      <div className="flex flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex gap-3 align-center">
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>← Tuần trước</button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 160, textAlign: 'center' }}>{weekLabel}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>Tuần sau →</button>
        </div>
        <button id="generate-week" className="btn btn-primary" onClick={generateWeek} disabled={generating}>
          {generating ? '⏳ Đang tạo...' : '⚡ Tạo ca tuần này'}
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Chưa có ca học nào trong tuần này</h3>
          <p>Bấm "Tạo ca tuần này" để tự động tạo từ thời khóa biểu</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ngày</th><th>Thứ</th><th>Môn học</th><th>Tiết</th><th>Giờ</th><th>Phòng</th><th>Trạng thái</th><th>Thành viên</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                  <td>{DAY_NAMES[s.schedule_slot?.day_of_week]}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.schedule_slot?.subject?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.schedule_slot?.subject?.code}</div>
                  </td>
                  <td>Tiết {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period}</td>
                  <td style={{ fontSize: '0.85rem' }}>{s.schedule_slot?.start_time} – {s.schedule_slot?.end_time}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.schedule_slot?.classroom}</td>
                  <td><span className={`badge badge-${s.status}`}>
                    {{ open: 'Trống', registered: 'Chờ duyệt', approved: 'Đã duyệt', completed: 'Hoàn thành', cancelled: 'Hủy' }[s.status]}
                  </span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.assigned_member?.full_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
