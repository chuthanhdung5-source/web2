import { useState, useEffect } from 'react'
import { memberAPI } from '../../api'
import toast from 'react-hot-toast'

const TYPE_MAP = {
  general: { label: '💬 Thần niệm vấn đáp', cls: 'badge-open' },
  bug: { label: '🐛 Dị biến trận pháp', cls: 'badge-rejected' },
  suggestion: { label: '💡 Hiến kế tu chân', cls: 'badge-registered' },
  payment_issue: { label: '💰 Dị nghị bổng lộc', cls: 'badge-warning' },
  schedule_issue: { label: '📅 Dị nghị khảo kỳ', cls: 'badge-verified' },
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
      toast.error('Vui lòng nhập tiêu đề và nội dung biểu sớ!')
      return
    }

    setSending(true)
    try {
      await memberAPI.createFeedback(title.trim(), content.trim(), feedbackType)
      toast.success('🎉 Đã dâng sớ lên Giáo Hoàng thành công!')
      setTitle('')
      setContent('')
      loadFeedbacks()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Dâng sớ thất bại!')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>💬 Thượng Thư Dâng Sớ Lên Giáo Hoàng</h1>
        <p>Đạo hữu gặp dị biến pháp trận, thắc mắc bổng lộc hay có diệu kế tu chân, hãy dâng sớ lên Giáo Hoàng</p>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        <div className="card card-elevated" style={{ padding: 24 }}>
          <h2 className="h3" style={{ marginBottom: 16 }}>✍️ Soạn Thảo Biểu Sớ</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Thuộc tính biểu sớ:</label>
              <select
                className="form-control"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option value="general">💬 Thần niệm vấn đáp</option>
                <option value="bug">🐛 Báo cáo dị biến trận pháp</option>
                <option value="payment_issue">💰 Thắc mắc Bổng Lộc</option>
                <option value="schedule_issue">📅 Thắc mắc Khảo Kỳ</option>
                <option value="suggestion">💡 Hiến kế diệu pháp mới</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề thỉnh nguyện:</label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: Không thấy pháp ảnh điểm danh khắc 3..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Lời tấu trình tường tận:</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Mô tả chi tiết khúc mắc đạo hữu đang gặp phải hoặc hiến kế tâm đắc..."
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
              {sending ? '⏳ Đang truyền tống sớ...' : '🚀 Dâng Sớ Lên Giáo Hoàng'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="h3" style={{ marginBottom: 16 }}>📋 Linh Ký Thư Thỉnh Nguyện Bản Thân ({myFeedbacks.length})</h2>

          {loading ? (
            <div className="flex-center" style={{ height: 200 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : myFeedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>Đạo hữu chưa từng dâng biểu sớ nào</h3>
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
                        {isPending ? '⏳ Đang chờ Giáo Hoàng khai thị' : f.status === 'resolved' ? '✅ Viên mãn' : '💬 Đã có lời chỉ bảo'}
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
                          👑 Khẩu dụ từ Giáo Hoàng:
                        </div>
                        <div>{f.admin_reply}</div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                      ⏱ Dâng sớ lúc: {f.created_at ? new Date(f.created_at).toLocaleString('vi-VN') : '--'}
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
