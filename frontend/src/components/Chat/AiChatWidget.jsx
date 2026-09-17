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

  // Chỉ hiển thị khi người dùng đã đăng nhập
  if (!user) return null

  const isRoleAdmin = user.role === 'admin'

  // Tải danh sách câu hỏi gợi ý
  useEffect(() => {
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
    if (window.confirm('Bạn có muốn làm mới cuộc trò chuyện với AI?')) {
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
          title="Mở Trợ lý AI Hỏi Đáp"
          id="btn-open-ai-chat"
        >
          <span className="ai-chat-launcher-icon">🤖</span>
          <span className="ai-chat-launcher-text">Hỏi Đáp AI</span>
          <span className="ai-chat-pulse-badge" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window" id="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">🤖</div>
              <div className="ai-chat-title-wrap">
                <h4>
                  Trợ Lý AI
                  <span className={`ai-chat-role-badge ${isRoleAdmin ? 'admin' : 'member'}`}>
                    {isRoleAdmin ? 'Admin' : 'Member'}
                  </span>
                </h4>
                <div className="ai-chat-subtitle">Tra cứu dữ liệu & thông tin nhanh</div>
              </div>
            </div>
            <div className="ai-chat-header-actions">
              <button
                className="ai-chat-btn-icon"
                onClick={handleClearHistory}
                title="Xóa làm mới đoạn chat"
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
                <div className="ai-chat-welcome-icon">⚡</div>
                <h5>Xin chào, {user.full_name || user.username}!</h5>
                <p>
                  Tôi là Trợ lý AI hệ thống, được trang bị khả năng tra cứu trực tiếp dữ liệu ca học,
                  điểm danh check-in, tiền lương và hồ sơ sinh viên học hộ theo đúng quyền hạn của bạn.
                </p>

                {suggestions.length > 0 && (
                  <div>
                    <div className="ai-chat-suggestions-title">💡 Câu hỏi gợi ý cho bạn:</div>
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
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className={`ai-chat-bubble ${msg.role}`}>
                  {renderMessageContent(msg.content)}

                  {/* Sources info */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ai-chat-sources">
                      <span className="ai-chat-sources-label">Nguồn:</span>
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
                <div className="ai-chat-msg-avatar ai">🤖</div>
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
                    ? "Hỏi về ca học, duyệt ảnh, thành viên, lương..."
                    : "Hỏi về ca của tôi, thu nhập, ca đang mở..."
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
                title="Gửi câu hỏi"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
