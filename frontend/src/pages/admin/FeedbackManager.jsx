import { useState, useEffect } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

const TYPE_MAP = {
  general: { label: '💬 Góp ý chung', cls: 'badge-open' },
  bug: { label: '🐛 Báo lỗi hệ thống', cls: 'badge-rejected' },
  suggestion: { label: '💡 Đề xuất tính năng', cls: 'badge-registered' },
  payment_issue: { label: '💰 Vấn đề thanh toán', cls: 'badge-warning' },
  schedule_issue: { label: '📅 Vấn đề lịch học', cls: 'badge-verified' },
}

export default function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [replyModal, setReplyModal] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyStatus, setReplyStatus] = useState('replied')
  const [submitting, setSubmitting] = useState(false)

  const loadFeedbacks = () => {
    setLoading(true)
    adminAPI.getFeedbacks(statusFilter)
      .then(r => setFeedbacks(r.data))
      .catch(() => toast.error('Lỗi tải danh sách góp ý'))
      .finally(() => setLoading(false))
  }

  useEffect(loadFeedbacks, [statusFilter])

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi!')
      return
    }

    setSubmitting(true)
    try {
      await adminAPI.replyFeedback(replyModal.id, replyText.trim(), replyStatus)
      toast.success('✅ Đã gửi phản hồi cho thành viên!')
      setReplyModal(null)
      setReplyText('')
      loadFeedbacks()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi gửi phản hồi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>💬 Phản Hồi & Góp Ý Từ Thành Viên</h1>
          <p>Xem danh sách thắc mắc, báo lỗi và ý kiến đóng góp từ các thành viên trong hệ thống</p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: '📋 Tất cả' },
            { key: 'pending', label: '⏳ Chờ trả lời' },
            { key: 'replied', label: '💬 Đã trả lời' },
            { key: 'resolved', label: '✅ Đã xử lý xong' },
          ].map(f => (
            <button
              key={f.key}
              className={`btn ${statusFilter === f.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Chưa có góp ý nào</h3>
          <p>Ý kiến từ thành viên gửi tới sẽ xuất hiện tại đây</p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: 16 }}>
          {feedbacks.map(f => {
            const typeInfo = TYPE_MAP[f.type] || { label: f.type, cls: 'badge-open' }
            const isPending = f.status === 'pending'

            return (
              <div key={f.id} className="card card-elevated" style={{
                borderLeft: `3px solid ${isPending ? 'var(--accent)' : f.status === 'resolved' ? 'var(--accent-green)' : 'var(--primary)'}`
              }}>
                <div className="flex flex-between align-center" style={{ marginBottom: 10 }}>
                  <span className={`badge ${typeInfo.cls}`}>{typeInfo.label}</span>
                  <span className={`badge ${isPending ? 'badge-registered' : f.status === 'resolved' ? 'badge-verified' : 'badge-approved'}`}>
                    {isPending ? '⏳ Chờ trả lời' : f.status === 'resolved' ? '✅ Đã xong' : '💬 Đã phản hồi'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 4 }}>{f.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  👤 <strong>{f.user_name}</strong> (@{f.user_username}) • ⏱ {f.created_at ? new Date(f.created_at).toLocaleString('vi-VN') : '--'}
                </div>

                <div style={{
                  background: 'var(--surface-hover)',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: '0.88rem',
                  marginBottom: 12,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}>
                  {f.content}
                </div>

                {f.admin_reply && (
                  <div style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: '0.85rem',
                    marginBottom: 12
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)', marginBottom: 4 }}>
                      👑 Phản hồi từ Admin ({f.replied_at ? new Date(f.replied_at).toLocaleString('vi-VN') : ''}):
                    </div>
                    <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{f.admin_reply}</div>
                  </div>
                )}

                <button
                  className={`btn ${isPending ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setReplyModal(f)
                    setReplyText(f.admin_reply || '')
                    setReplyStatus(f.status === 'resolved' ? 'resolved' : 'replied')
                  }}
                >
                  {isPending ? '💬 Phản hồi ngay' : '✏️ Chỉnh sửa phản hồi'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="card card-elevated" style={{ width: '100%', maxWidth: 550, padding: 24 }}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">💬 Phản hồi cho: {replyModal.user_name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setReplyModal(null)}>✕</button>
            </div>

            <div style={{ background: 'var(--surface-hover)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.85rem' }}>
              <strong>Vấn đề ({replyModal.title}):</strong> {replyModal.content}
            </div>

            <form onSubmit={handleReplySubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái xử lý:</label>
                <select
                  className="form-control"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                >
                  <option value="replied">💬 Đã phản hồi (Replied)</option>
                  <option value="resolved">✅ Đã giải quyết xong (Resolved)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Nội dung phản hồi từ Admin:</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Nhập nội dung phản hồi tới thành viên..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setReplyModal(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? '⏳ Đang gửi...' : '🚀 Gửi Phản Hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
