import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/schedule': 'Thời khóa biểu',
  '/admin/sessions': 'Duyệt ca học',
  '/admin/checkins': 'Xem ảnh Check-in',
  '/admin/members': 'Quản lý thành viên',
  '/admin/payments': 'Quản lý thanh toán',
  '/admin/profile': 'Hồ sơ sinh viên',
  '/member': 'Dashboard',
  '/member/slots': 'Đăng ký ca học',
  '/member/schedule': 'Lịch của tôi',
  '/member/earnings': 'Thu nhập',
  '/member/admin-info': 'Thông tin sinh viên',
  '/member/profile': 'Hồ sơ',
}

export default function Header({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = Object.entries(PAGE_TITLES).find(([key]) => pathname === key)?.[1] || 'Web Học Hộ'

  const now = new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="top-header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Menu"
            id="sidebar-toggle-btn"
          >
            ☰
          </button>
        )}
        <div>
          <h1 className="header-title">{title}</h1>
          <span className="header-date">{dateStr}, {timeStr}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="earnings-pill">
          <span>💰</span>
          <span>{(user?.total_earnings || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
    </header>
  )
}

