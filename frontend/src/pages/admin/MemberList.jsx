import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { useDouluo, getRealmInfo } from '../../context/DouluoContext'
import toast from 'react-hot-toast'

export default function MemberList() {
  const { adminPromote } = useDouluo()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [resetModalMember, setResetModalMember] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  // Sắc phong Hồn Sư state
  const [promoteMember, setPromoteMember] = useState(null)
  const [promoteLevel, setPromoteLevel] = useState(60)
  const [promoteDiamonds, setPromoteDiamonds] = useState(100000)
  const [promoteTitle, setPromoteTitle] = useState('Học Hộ Đấu La')
  const [promoting, setPromoting] = useState(false)

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

  const openPromoteModal = (member) => {
    setPromoteMember(member)
    setPromoteLevel(60)
    setPromoteDiamonds(100000)
    setPromoteTitle('Học Hộ Đấu La')
  }

  const handlePromoteSubmit = async (e) => {
    e.preventDefault()
    if (!promoteMember) return
    setPromoting(true)
    try {
      await adminPromote({
        target_type: 'user',
        user_id: promoteMember.id,
        level: Number(promoteLevel),
        diamonds_add: Number(promoteDiamonds),
        custom_title: promoteTitle
      })
      setPromoteMember(null)
    } finally {
      setPromoting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>👥 Quản lý thành viên</h1>
        <p>Danh sách tất cả thành viên trong hệ thống và thông tin chi trả</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : members.length === 0 ? (
        <div className="empty-state">Chưa có thành viên nào</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Liên hệ</th>
                <th>Thông tin ngân hàng</th>
                <th>Tổng thu nhập</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{m.username}</div>
                  </td>
                  <td>
                    <div>{m.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.phone || '—'}</div>
                  </td>
                  <td>
                    {m.bank_name ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{m.bank_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.bank_account_no} • {m.bank_account_name}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Chưa cập nhật</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                      {(m.total_earnings || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${m.is_active ? 'badge-verified' : 'badge-rejected'}`}>
                      {m.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="Sắc phong Hồn Sư Đấu La"
                        onClick={() => openPromoteModal(m)}
                        style={{ border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc', padding: '4px 8px' }}
                      >
                        🔱 Sắc phong
                      </button>
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

      {/* Modal Sắc phong Hồn Sư */}
      {promoteMember && (
        <div className="modal-backdrop" onClick={() => setPromoteMember(null)}>
          <div className="modal card" style={{ maxWidth: 460, width: '100%', margin: 20 }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">🔱 Sắc phong Hồn Sư</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPromoteMember(null)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
              Sắc phong cho thành viên <strong>{promoteMember.full_name}</strong> (<code>@{promoteMember.username}</code>).
            </p>

            <form onSubmit={handlePromoteSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Cấp độ Hồn Sư</label>
                <input
                  type="number"
                  className="form-input"
                  value={promoteLevel}
                  onChange={e => setPromoteLevel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kim cương thưởng (+)</label>
                <input
                  type="number"
                  className="form-input"
                  value={promoteDiamonds}
                  onChange={e => setPromoteDiamonds(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Danh hiệu</label>
                <input
                  type="text"
                  className="form-input"
                  value={promoteTitle}
                  onChange={e => setPromoteTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPromoteMember(null)}
                  disabled={promoting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={promoting}
                >
                  {promoting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Đang xử lý...</> : '✓ Xác nhận sắc phong'}
                </button>
              </div>
            </form>
          </div>
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
