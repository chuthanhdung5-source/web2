import { useState, useEffect } from 'react'
import { memberAPI } from '../../api'
import toast from 'react-hot-toast'

const TYPE_MAP = {
  general: { label: '💬 Góp ý chung', cls: 'badge-open' },
  bug: { label: '🐛 Báo lỗi hệ thống', cls: 'badge-rejected' },
  suggestion: { label: '💡 Đề xuất tính năng', cls: 'badge-registered' },
  payment_issue: { label: '💰 Vấn đề thanh toán', cls: 'badge-warning' },
  schedule_issue: { label: '📅 Vấn đề lịch học', cls: 'badge-verified' },
}

export default function SendFeedback() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [feedbackType, setFeedbackType] = useState('general')
  const [sending, setSending] = useState(false)
  const [myFeedbacks, setMyFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFeedbacks = () => {
    memberAPI.getMyFeedbacks()
      .then(r => setMyFeedbacks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(loadFeedbacks, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung góp ý!')
      return
    }

    setSending(true)
    try {
      await memberAPI.createFeedback(title.trim(), content.trim(), feedbackType)
      toast.success('🎉 Đã gửi góp ý tới Admin! Cảm ơn bạn.')
      setTitle('')
      setContent('')
      loadFeedbacks()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gửi thất bại!')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>💬 Gửi Góp Ý & Báo Lỗi Cho Admin</h1>
        <p>Nếu bạn gặp sự cố, thắc mắc thanh toán hoặc có ý kiến đóng góp, hãy gửi ngay cho Admin</p>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        {/* Form gửi feedback */}
        <div className="card card-elevated" style={{ padding: 24 }}>
          <h2 className="h3" style={{ marginBottom: 16 }}>✍️ Tạo góp ý / Báo lỗi mới</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Chủ đề góp ý:</label>
              <select
                className="form-control"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option value="general">💬 Góp ý chung</option>
                <option value="bug">🐛 Báo lỗi hệ thống / Giao diện</option>
                <option value="payment_issue">💰 Thắc mắc Thanh toán / Tiền nhận</option>
                <option value="schedule_issue">📅 Thắc mắc Lịch học / Duyệt ca</option>
                <option value="suggestion">💡 Đề xuất tính năng mới</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề ngắn gọn:</label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: Không thấy ảnh điểm danh tiết 3..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Nội dung chi tiết:</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải hoặc đóng góp ý kiến..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={sending}
            >
              {sending ? '⏳ Đang gửi...' : '🚀 Gửi Cho Admin'}
            </button>
          </form>
        </div>

        {/* Danh sách góp ý đã gửi */}
        <div>
          <h2 className="h3" style={{ marginBottom: 16 }}>📋 Lịch sử góp ý của bạn ({myFeedbacks.length})</h2>

          {loading ? (
            <div className="flex-center" style={{ height: 200 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : myFeedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>Bạn chưa gửi góp ý nào</h3>
            </div>
          ) : (
            <div className="flex flex-col gap-3" style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {myFeedbacks.map(f => {
                const typeInfo = TYPE_MAP[f.type] || { label: f.type, cls: 'badge-open' }
                const isPending = f.status === 'pending'

                return (
                  <div key={f.id} className="card" style={{ padding: 16, borderLeft: `3px solid ${isPending ? 'var(--accent)' : 'var(--accent-green)'}` }}>
                    <div className="flex flex-between align-center" style={{ marginBottom: 8 }}>
                      <span className={`badge ${typeInfo.cls}`}>{typeInfo.label}</span>
                      <span className={`badge ${isPending ? 'badge-registered' : f.status === 'resolved' ? 'badge-verified' : 'badge-approved'}`}>
                        {isPending ? '⏳ Đang chờ Admin trả lời' : f.status === 'resolved' ? '✅ Đã xong' : '💬 Admin đã phản hồi'}
                      </span>
                    </div>

                    <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{f.content}</p>

                    {f.admin_reply && (
                      <div style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                        marginTop: 8
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-light)', marginBottom: 2 }}>
                          👑 Phản hồi từ Admin:
                        </div>
                        <div>{f.admin_reply}</div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                      ⏱ Gửi lúc: {f.created_at ? new Date(f.created_at).toLocaleString('vi-VN') : '--'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
