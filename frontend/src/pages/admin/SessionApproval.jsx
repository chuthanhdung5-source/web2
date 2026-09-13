import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  open: { label: 'Trống', cls: 'badge-open' },
  registered: { label: 'Chờ duyệt', cls: 'badge-registered' },
  approved: { label: 'Đã duyệt', cls: 'badge-approved' },
  completed: { label: 'Hoàn thành', cls: 'badge-completed' },
  cancelled: { label: 'Đã hủy', cls: 'badge-cancelled' },
}

const DAY_NAMES = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' }

export default function SessionApproval() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminAPI.getPendingSessions()
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAction = async (id, approve) => {
    try {
      await adminAPI.approveSession(id, approve)
      toast.success(approve ? '✅ Đã duyệt ca học!' : '❌ Đã từ chối')
      load()
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>✅ Duyệt ca học</h1>
        <p>{sessions.length} ca đang chờ duyệt</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎉</div>
          <h3>Không có ca nào chờ duyệt</h3>
          <p>Tất cả yêu cầu đã được xử lý</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Ngày</th>
                <th>Tiết</th>
                <th>Phòng</th>
                <th>Thành viên</th>
                <th>Đăng ký lúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.schedule_slot?.subject?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.schedule_slot?.subject?.code}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{DAY_NAMES[s.schedule_slot?.day_of_week]}</div>
                  </td>
                  <td>
                    Tiết {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.schedule_slot?.start_time} – {s.schedule_slot?.end_time}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.schedule_slot?.classroom}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                        {s.assigned_member?.full_name?.charAt(0)}
                      </div>
                      {s.assigned_member?.full_name}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {s.registered_at ? new Date(s.registered_at).toLocaleString('vi-VN') : '--'}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button id={`approve-${s.id}`} className="btn btn-success btn-sm"
                        onClick={() => handleAction(s.id, true)}>✅ Duyệt</button>
                      <button id={`reject-${s.id}`} className="btn btn-danger btn-sm"
                        onClick={() => handleAction(s.id, false)}>❌ Từ chối</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
