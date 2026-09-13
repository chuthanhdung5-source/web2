import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function MemberList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminAPI.getMembers().then(r => setMembers(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (id) => {
    try {
      await adminAPI.toggleMember(id)
      toast.success('Đã cập nhật trạng thái')
      load()
    } catch { toast.error('Có lỗi xảy ra') }
  }

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>👥 Quản lý thành viên</h1>
        <p>{members.length} thành viên trong hệ thống</p>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👤</div>
          <h3>Chưa có thành viên nào</h3>
          <p>Thành viên tự đăng ký tài khoản</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Thành viên</th><th>Username</th><th>Số điện thoại</th><th>Thu nhập</th><th>Trạng thái</th><th>Ngày tham gia</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="flex gap-3" style={{ alignItems: 'center' }}>
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                        {m.full_name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>@{m.username}</td>
                  <td>{m.phone || '—'}</td>
                  <td className="money">{(m.total_earnings || 0).toLocaleString('vi-VN')}đ</td>
                  <td>
                    <span className={`badge ${m.is_active ? 'badge-verified' : 'badge-missed'}`}>
                      {m.is_active ? '✓ Hoạt động' : '✗ Bị khóa'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <button id={`toggle-${m.id}`}
                      className={`btn btn-sm ${m.is_active ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleActive(m.id)}>
                      {m.is_active ? '🔒 Khóa' : '🔓 Mở khóa'}
                    </button>
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
