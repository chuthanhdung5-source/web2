import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDouluo } from '../../context/DouluoContext'
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
  const {
    enabled,
    realm,
    level,
    diamonds,
    customTitle,
    setIsSettingsOpen,
    setIsRechargeOpen,
    setIsCultivationOpen,
    setIsMineOpen
  } = useDouluo()

  const title = Object.entries(PAGE_TITLES).find(([key]) => pathname === key)?.[1] || 'Web Học Hộ'

  const now = new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  const isAdmin = user?.role === 'admin'

  // Format kim cương gọn: 888.888 -> 888K
  const formatDiamonds = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return n
  }

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
        {/* Chế độ Đấu La Đại Lục */}
        {enabled ? (
          <>
            {/* Nút Động Phủ Bế Quan Tu Luyện */}
            <button
              className="btn-cultivate-pulse"
              onClick={() => setIsCultivationOpen(true)}
              title="Động Phủ Bế Quan Tu Luyện (Tích lũy Hồn Lực theo thời gian)"
            >
              <span className="cult-icon">🧘</span>
              <span>Bế Quan</span>
            </button>

            {/* Huy hiệu Cảnh giới */}
            <div
              className={`douluo-badge ${realm.badge}`}
              onClick={() => (isAdmin ? setIsSettingsOpen(true) : setIsCultivationOpen(true))}
              title={isAdmin ? 'Giáo Hoàng Điện (Sắc phong Hồn Sư)' : 'Xem tu vi & đột phá cảnh giới'}
            >
              <span>{realm.icon}</span>
              <span className="realm-full-title">{customTitle || realm.name}</span>
              <span>Lv.{level}</span>
            </div>

            {/* Túi Kim Cương */}
            <div
              className="diamond-wallet"
              onClick={() => (isAdmin ? setIsRechargeOpen(true) : setIsMineOpen(true))}
              title={isAdmin ? 'Kho Kim Cương (Bấm để nạp VIP 0đ)' : 'Mỏ Hồn Thạch (Bấm để gõ nhặt kim cương)'}
            >
              <span>💎</span>
              <span>{formatDiamonds(diamonds)}</span>
              <span className="diamond-plus">{isAdmin ? '+' : '⛏️'}</span>
            </div>

            {/* Nút Cài đặt / Sắc phong */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsSettingsOpen(true)}
              title={isAdmin ? 'Giáo Hoàng Điện: Sắc phong Hồn Sư toàn Server' : 'Cài đặt chế độ Đấu La'}
              style={{ padding: '4px 7px', fontSize: '0.95rem' }}
            >
              {isAdmin ? '🔱' : '🔮'}
            </button>
          </>
        ) : (
          /* Nút mở lại chế độ khi đang tắt */
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsSettingsOpen(true)}
            title="Mở lại chế độ Đấu La Đại Lục"
            style={{ opacity: 0.7, fontSize: '0.78rem', padding: '4px 8px' }}
          >
            🔮 Đấu La
          </button>
        )}

        {/* Tiền lương thật */}
        <div className="earnings-pill" title="Tổng thu nhập thực tế">
          <span>💰</span>
          <span>{(user?.total_earnings || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
    </header>
  )
}

