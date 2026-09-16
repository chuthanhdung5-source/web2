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
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung hịch văn!')
      return
    }

    setSending(true)
    try {
      const target = targetUserId ? parseInt(targetUserId) : null
      const res = await adminAPI.broadcastNotification(title.trim(), message.trim(), notifType, target)
      toast.success(res.data.message || 'Đã truyền hịch thành công!')
      setTitle('')
      setMessage('')
      setTargetUserId('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Truyền hịch thất bại!')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h1>📢 Truyền Hịch Tông Môn & Vạn Dặm Phi Kiếm</h1>
        <p>Phát thần niệm tới toàn thể chư vị đệ tử hoặc truyền âm mật thất cho một tu giả cụ thể</p>
      </div>

      <div className="card card-elevated" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>📌 Tiêu đề hịch văn / thần niệm:</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Chiếu chỉ điểm danh hộ đạo đúng thời khắc..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>🔔 Thuộc tính thần niệm:</label>
              <select
                className="form-control"
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
              >
                <option value="info">ℹ️ Thông cáo môn quy (Info)</option>
                <option value="reminder">⏰ Thúc giục khảo kỳ (Reminder)</option>
                <option value="warning">⚠️ Cảnh cáo tông môn (Warning)</option>
                <option value="payment">💰 Quyết toán bổng lộc (Payment)</option>
                <option value="approval">✅ Sắc chỉ chuẩn phê (Approval)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>👥 Môn hạ tiếp nhận:</label>
              <select
                className="form-control"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">📢 Toàn Thể Chư Vị Tu Giả (Vạn Dặm Phi Kiếm)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    👤 {m.full_name} (@{m.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>💬 Nội dung hịch văn:</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Khắc ghi lời huấn thị gửi tới chư vị đệ tử tông môn..."
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
            {sending ? '⏳ Đang truyền tống hịch văn...' : '🚀 Truyền Hịch Ngay Lập Tức'}
          </button>
        </form>
      </div>
    </div>
  )
}
