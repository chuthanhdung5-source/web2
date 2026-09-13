import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

const ROLE_FILTERS = [
  { key: 'all', label: '📋 Tất cả Roles' },
  { key: 'admin', label: '👑 Admin' },
  { key: 'member', label: '🎒 Thành viên' },
]

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const loadLogs = () => {
    setLoading(true)
    adminAPI.getActivityLogs(roleFilter)
      .then(r => setLogs(r.data))
      .catch(() => toast.error('Lỗi tải nhật ký hoạt động'))
      .finally(() => setLoading(false))
  }

  useEffect(loadLogs, [roleFilter])

  const getActionBadge = (type) => {
    switch (type) {
      case 'CHECKIN_VERIFY':
        return <span className="badge badge-verified">✅ Xác nhận ảnh</span>
      case 'CHECKIN_REJECT':
        return <span className="badge badge-rejected">❌ Từ chối ảnh</span>
      case 'SESSION_APPROVE':
        return <span className="badge badge-approved">✅ Duyệt ca học</span>
      case 'SESSION_REJECT':
        return <span className="badge badge-rejected">❌ Từ chối ca học</span>
      case 'SESSION_ASSIGN':
        return <span className="badge badge-completed">👑 Phân công</span>
      case 'SESSION_REGISTER':
        return <span className="badge badge-registered">📝 Đăng ký ca</span>
      case 'PHOTO_UPLOAD':
        return <span className="badge badge-open">📸 Nộp ảnh</span>
      case 'MEMBER_TOGGLE_ACTIVE':
        return <span className="badge badge-pending">⚙️ Đổi trạng thái</span>
      default:
        return <span className="badge badge-pending">📌 {type}</span>
    }
  }

  return (
    <div>
      <div className="page-header flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>📜 Lịch sử Hoạt động (Audit Logs)</h1>
          <p>Theo dõi chi tiết tất cả hành động và thao tác của các Role trong hệ thống</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {ROLE_FILTERS.map(f => (
            <button
              key={f.key}
              className={`btn ${roleFilter === f.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setRoleFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Chưa có nhật ký hoạt động nào</h3>
          <p>Các hành động thực hiện trong hệ thống sẽ được tự động ghi lại tại đây</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Role</th>
                <th>Hành động</th>
                <th>Tiêu đề</th>
                <th>Chi tiết mô tả</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '--'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{log.user_name || 'Hệ thống'}</div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: log.user_role === 'admin' ? 'rgba(124,106,245,0.15)' : 'rgba(59,130,246,0.15)',
                      color: log.user_role === 'admin' ? 'var(--primary-light)' : 'var(--accent-blue)'
                    }}>
                      {log.user_role === 'admin' ? '👑 Admin' : '🎒 Thành viên'}
                    </span>
                  </td>
                  <td>{getActionBadge(log.action_type)}</td>
                  <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.title}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
