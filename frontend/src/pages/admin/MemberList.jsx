import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function MemberList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [resetModalMember, setResetModalMember] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

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

  const openResetModal = (member) => {
    setResetModalMember(member)
    setNewPassword('123456') // Mặc định gợi ý 123456 cho nhanh
  }

  const handleForceReset = async (e) => {
    e.preventDefault()
    if (!resetModalMember) return
    if (newPassword && newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setResetting(true)
    try {
      const res = await adminAPI.forceResetPassword(resetModalMember.id, {
        new_password: newPassword.trim() || undefined
      })
      toast.success(`✅ Đã đổi mật khẩu cho @${resetModalMember.username} thành: ${res.data.new_password}`, {
        duration: 8000
      })
      setResetModalMember(null)
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi đổi mật khẩu')
    } finally {
      setResetting(false)
    }
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
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        title="Cưỡng chế đổi mật khẩu"
                        onClick={() => openResetModal(m)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        🔑 Đổi MK
                      </button>
                      <button
                        id={`toggle-${m.id}`}
                        className={`btn btn-sm ${m.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(m.id)}
                      >
                        {m.is_active ? '🔒 Khóa' : '🔓 Mở khóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Admin cưỡng chế đổi mật khẩu */}
      {resetModalMember && (
        <div className="modal-backdrop" onClick={() => setResetModalMember(null)}>
          <div className="modal card" style={{ maxWidth: 460, width: '100%', margin: 20 }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">🔑 Cưỡng chế đổi mật khẩu</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setResetModalMember(null)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
              Đặt lại mật khẩu trực tiếp cho thành viên <strong>{resetModalMember.full_name}</strong> (<code>@{resetModalMember.username}</code>).
            </p>

            <form onSubmit={handleForceReset} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Gợi ý nhanh */}
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setNewPassword('123456')}
                >
                  ⚡ Đặt: 123456
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setNewPassword('webhocho123')}
                >
                  ⚡ Đặt: webhocho123
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setNewPassword(`hoc${Math.floor(100000 + Math.random() * 900000)}`)}
                >
                  🎲 Ngẫu nhiên
                </button>
              </div>

              <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResetModalMember(null)}
                  disabled={resetting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetting}
                >
                  {resetting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Đang lưu...</> : '✓ Xác nhận đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
