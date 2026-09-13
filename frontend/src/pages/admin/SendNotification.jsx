import { useState, useEffect } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function SendNotification() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notifType, setNotifType] = useState('info')
  const [targetUserId, setTargetUserId] = useState('')
  const [members, setMembers] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    adminAPI.getMembers().then(r => setMembers(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!')
      return
    }

    setSending(true)
    try {
      const target = targetUserId ? parseInt(targetUserId) : null
      const res = await adminAPI.broadcastNotification(title.trim(), message.trim(), notifType, target)
      toast.success(res.data.message || 'Đã gửi thông báo thành công!')
      setTitle('')
      setMessage('')
      setTargetUserId('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gửi thông báo thất bại!')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h1>📢 Gửi Thông Báo Hệ Thống</h1>
        <p>Phát thông báo tới tất cả thành viên hoặc gửi trực tiếp cho một thành viên cụ thể</p>
      </div>

      <div className="card card-elevated" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>📌 Tiêu đề thông báo:</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Nhắc nhở nộp ảnh check-in tiết 5..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>🔔 Loại thông báo:</label>
              <select
                className="form-control"
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
              >
                <option value="info">ℹ️ Thông tin chung (Info)</option>
                <option value="reminder">⏰ Nhắc nhở (Reminder)</option>
                <option value="warning">⚠️ Cảnh báo (Warning)</option>
                <option value="payment">💰 Thanh toán (Payment)</option>
                <option value="approval">✅ Duyệt ca (Approval)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>👥 Đối tượng nhận:</label>
              <select
                className="form-control"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">📢 Tất cả Thành viên (Broadcast)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    👤 {m.full_name} (@{m.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>💬 Nội dung chi tiết:</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Nhập nội dung chi tiết thông báo gửi tới thành viên..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: '1rem' }}
            disabled={sending}
          >
            {sending ? '⏳ Đang gửi thông báo...' : '🚀 Gửi Thông Báo Ngay'}
          </button>
        </form>
      </div>
    </div>
  )
}
