import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { chatAPI } from '../../api'
import '../../styles/AiChat.css'

export default function AiChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const isRoleAdmin = user?.role === 'admin'

  // Tải danh sách câu hỏi gợi ý
  useEffect(() => {
    if (!user) return
    let isMounted = true
    chatAPI.getSuggestions()
      .then((res) => {
        if (isMounted && res.data?.suggestions) {
          setSuggestions(res.data.suggestions)
        }
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [user?.role])

  // Tự cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Focus ô nhập liệu khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  // Chỉ hiển thị khi người dùng đã đăng nhập (phải đặt SAU toàn bộ React Hooks)
  if (!user) return null

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query || isLoading) return

    setInput('')

    // Định dạng history gửi lên backend
    const userMsg = { role: 'user', content: query }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setIsLoading(true)

    // Chuẩn bị history cho backend (chỉ lấy 6 tin nhắn gần nhất)
    const historyPayload = newMessages.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

    try {
      const res = await chatAPI.ask(query, historyPayload)
      const data = res.data || {}

      const aiMsg = {
        role: 'assistant',
        content: data.answer || 'Không nhận được câu trả lời từ AI.',
        sources: data.sources || [],
        suggestions: data.suggestions || []
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Không thể xử lý câu hỏi:** ${err.response?.data?.detail || err.message || 'Lỗi mạng hoặc server không phản hồi.'}`,
        sources: ['Lỗi kết nối']
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Đạo hữu có muốn tẩy tủy linh thức (làm mới cuộc trò chuyện với Thiên Cơ Khí Linh)?')) {
      setMessages([])
    }
  }

  // Chuyển đổi văn bản Markdown cơ bản sang HTML an toàn
  const renderMessageContent = (content) => {
    if (!content) return null

    const lines = content.split('\n')
    return lines.map((line, idx) => {
      // Bold text: **text**
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s+/, '') }} />
        )
      }
      return (
        <p key={idx} dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />
      )
    })
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="ai-chat-launcher"
          onClick={() => setIsOpen(true)}
          title="Mở Thiên Cơ Các · Vấn Đạo Thần Thú"
          id="btn-open-ai-chat"
        >
          <span className="ai-chat-launcher-icon">🔮</span>
          <span className="ai-chat-launcher-text">Thiên Cơ Các</span>
          <span className="ai-chat-pulse-badge" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window" id="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">🔮</div>
              <div className="ai-chat-title-wrap">
                <h4>
                  Thiên Cơ Các · Khí Linh
                  <span className={`ai-chat-role-badge ${isRoleAdmin ? 'admin' : 'member'}`}>
                    {isRoleAdmin ? '👑 Giáo Hoàng' : '⚔️ Hồn Sư'}
                  </span>
                </h4>
                <div className="ai-chat-subtitle">Vấn đạo tầm cơ · Thấu thị càn khôn</div>
              </div>
            </div>
            <div className="ai-chat-header-actions">
              <button
                className="ai-chat-btn-icon"
                onClick={handleClearHistory}
                title="Tẩy tủy linh thức (Làm mới đoạn thoại)"
              >
                🔄
              </button>
              <button
                className="ai-chat-btn-icon"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                id="btn-close-ai-chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="ai-chat-body">
            {/* Welcome Box when no messages */}
            {messages.length === 0 && (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">✨</div>
                <h5>Kính chào {user.full_name || user.username} đạo hữu!</h5>
                <p>
                  Bản Khí Linh trấn thủ Thiên Cơ Các của Đấu La Tiên Giới. Tại hạ thấu triệt toàn bộ thiên thư:
                  lịch trình thí luyện (ca học), khảo hạch ấn chứng (check-in), linh thạch bổng lộc (lương học hộ),
                  cùng chân truyền ngọc giản của Tông Chủ...
                </p>

                {suggestions.length > 0 && (
                  <div>
                    <div className="ai-chat-suggestions-title">📜 Bí tịch thỉnh vấn nhanh:</div>
                    <div className="ai-chat-chips-list">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          className="ai-chat-chip-btn"
                          onClick={() => handleSendMessage(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message History */}
            {messages.map((msg, index) => (
              <div key={index} className={`ai-chat-message-row ${msg.role}`}>
                <div className={`ai-chat-msg-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                  {msg.role === 'assistant' ? '🔮' : '🧙‍♂️'}
                </div>
                <div className={`ai-chat-bubble ${msg.role}`}>
                  {renderMessageContent(msg.content)}

                  {/* Sources info */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ai-chat-sources">
                      <span className="ai-chat-sources-label">Càn khôn ngọc giản:</span>
                      {msg.sources.map((src, sIdx) => (
                        <span key={sIdx} className="ai-chat-source-tag">{src}</span>
                      ))}
                    </div>
                  )}

                  {/* Inline Followup suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="ai-chat-inline-suggestions">
                      {msg.suggestions.map((f, fIdx) => (
                        <button
                          key={fIdx}
                          className="ai-chat-mini-chip"
                          onClick={() => handleSendMessage(f)}
                        >
                          👉 {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="ai-chat-typing-row">
                <div className="ai-chat-msg-avatar ai">🔮</div>
                <div className="ai-chat-typing-indicator">
                  <span className="ai-chat-typing-dot" />
                  <span className="ai-chat-typing-dot" />
                  <span className="ai-chat-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="ai-chat-footer">
            <form
              className="ai-chat-input-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
            >
              <textarea
                ref={inputRef}
                className="ai-chat-input-field"
                rows="1"
                placeholder={
                  isRoleAdmin
                    ? "Thỉnh vấn về ca thí luyện, ấn chứng check-in, bổng lộc đệ tử..."
                    : "Thỉnh vấn về ca của ta, linh thạch tích lũy, chân truyền Tông Chủ..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="ai-chat-send-btn"
                disabled={!input.trim() || isLoading}
                title="Truyền niệm thỉnh vấn"
              >
                ⚡
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
