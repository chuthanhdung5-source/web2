import { useState, useEffect, useRef } from 'react'
import { memberAPI } from '../../api'
import './NotificationBell.css'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Tải danh sách thông báo
  const fetchNotifications = async () => {
    try {
      const res = await memberAPI.getNotifications()
      setNotifications(res.data || [])
    } catch (err) {
      console.error('Lỗi tải thông báo:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Polling tự động quét thông báo mới mỗi 30 giây
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Đánh dấu 1 thông báo đã đọc
  const handleMarkRead = async (notif) => {
    if (notif.is_read) return
    try {
      await memberAPI.markNotifRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('Lỗi cập nhật đã đọc:', err)
    }
  }

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await memberAPI.markAllNotifsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả:', err)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Icon theo phân loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return '✅'
      case 'rejection':
        return '❌'
      case 'payment':
        return '💰'
      case 'reminder':
        return '⏰'
      case 'warning':
        return '⚠️'
      default:
        return '📜'
    }
  }

  // Format thời gian hiển thị
  const formatTime = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    const now = new Date()
    const diffSec = Math.floor((now - d) / 1000)
    if (diffSec < 60) return 'Vừa xong'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      {/* Icon Chuông */}
      <button
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={unreadCount > 0 ? `Có ${unreadCount} thông báo chưa đọc` : 'Thông báo tông môn'}
        id="btn-notif-bell"
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="notif-dropdown animate-pop-in">
          <div className="notif-header">
            <div className="notif-title-wrap">
              <span className="notif-header-title">Thông Báo Tông Môn</span>
              {unreadCount > 0 && (
                <span className="notif-unread-tag">{unreadCount} mới</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
                disabled={loading}
                title="Đánh dấu tất cả đã đọc"
              >
                ✓ Đọc tất cả
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔕</span>
                <p>Không có thông báo mới nào</p>
                <span className="notif-empty-sub">Các truyền tin từ Tông Môn sẽ hiển thị tại đây</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item ${item.is_read ? 'read' : 'unread'}`}
                  onClick={() => handleMarkRead(item)}
                >
                  <div className="notif-item-icon">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{item.title}</div>
                    <div className="notif-item-message">{item.message}</div>
                    <div className="notif-item-time">{formatTime(item.created_at)}</div>
                  </div>
                  {!item.is_read && <span className="notif-unread-dot" title="Chưa đọc" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-footer">
              <span>Hiển thị tối đa {notifications.length} thông báo gần nhất</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
