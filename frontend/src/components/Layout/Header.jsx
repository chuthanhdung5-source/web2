import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDouluo } from '../../context/DouluoContext'
import NotificationBell from '../Common/NotificationBell'
import './Header.css'

const PAGE_TITLES = {
  '/admin': 'Tông Môn Điện • Tổng Bảng Điều Hành',
  '/admin/schedule': 'Lịch Khảo Thí Trực Trận',
  '/admin/sessions': 'Chuẩn Phê Thí Luyện Hộ Đạo',
  '/admin/checkins': 'Linh Ảnh Khảo Thí Điểm Danh',
  '/admin/notifications/send': 'Truyền Hịch Tông Môn',
  '/admin/feedbacks': 'Thần Niệm Đệ Tử Góp Ý',
  '/admin/activity-logs': 'Tông Môn Linh Ký Vạn Tượng',
  '/admin/members': 'Quản Trị Chư Vị Tu Giả',
  '/admin/payments': 'Bổng Lộc Linh Thạch Ngân Khố',
  '/admin/profile': 'Ngọc Giản Thân Phận Tiên Môn',
  '/member': 'Động Phủ Tu Vi Hồn Sư',
  '/member/slots': 'Lĩnh Nhận Khảo Nghiệm Hộ Đạo',
  '/member/schedule': 'Lịch Trình Hộ Đạo Bản Thân',
  '/member/earnings': 'Bổng Lộc Linh Thạch Thu Hoạch',
  '/member/feedback': 'Thượng Thư Giáo Hoàng',
  '/member/admin-info': 'Môn Quy Tiên Tông',
  '/member/profile': 'Đạo Lộ Cá Nhân',
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
    sessionSecondsLeft,
    setIsSettingsOpen,
    setIsRechargeOpen,
    setIsCultivationOpen,
    setIsMineOpen,
    setIsShopOpen,
    setIsThemeModalOpen,
  } = useDouluo()

  const title = Object.entries(PAGE_TITLES).find(([key]) => pathname === key)?.[1] || 'Đấu La Đại Khảo Chi Lưới'

  const now = new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  const isAdmin = user?.role === 'admin'

  const formatDiamonds = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return n
  }

  const formatSessionTime = (totalSecs) => {
    const s = Math.max(0, totalSecs || 0)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`
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
        <div className="header-title-box">
          <h1 className="header-title">{title}</h1>
          <span className="header-date">{dateStr}, {timeStr}</span>
        </div>
      </div>

      <div className="header-right">
        <NotificationBell />

        <div
          className="session-timer-badge"
          onClick={() => setIsShopOpen(true)}
          title="Thời gian canh giờ hộ đạo còn lại"
        >
          <span className="session-icon">⏳</span>
          <span className="session-time">{formatSessionTime(sessionSecondsLeft)}</span>
        </div>

        <button
          className="btn-theme-switcher"
          onClick={() => setIsThemeModalOpen(true)}
          title="Biến Hóa Huyễn Cảnh"
        >
          <span className="theme-btn-icon">🎨</span>
          <span className="theme-btn-label">Huyễn Cảnh</span>
        </button>

        {enabled ? (
          <>
            <button
              className="btn-cultivate-pulse"
              onClick={() => setIsCultivationOpen(true)}
              title="Động Phủ Bế Quan Tu Luyện"
            >
              <span className="cult-icon">🧘</span>
              <span className="cult-text">Bế Quan</span>
            </button>

            <button
              className="btn-shop-trigger"
              onClick={() => setIsShopOpen(true)}
              title="Tàng Bảo Các: Mua Huyễn Cảnh, Đặc Quyền, Gia Hạn Khẩu Quyết Bằng Kim Cương"
            >
              <span className="shop-icon">🔮</span>
              <span className="shop-text">Bảo Các</span>
            </button>

            <div
              className={`douluo-badge ${realm.badge}`}
              onClick={() => (isAdmin ? setIsSettingsOpen(true) : setIsCultivationOpen(true))}
              title={isAdmin ? 'Giáo Hoàng Điện' : 'Xem tu vi và đột phá cảnh giới'}
            >
              <span>{realm.icon}</span>
              <span className="realm-full-title">{customTitle || realm.name}</span>
              <span className="realm-level-text">Lv.{level}</span>
            </div>

            <div
              className="diamond-wallet"
              onClick={() => (isAdmin ? setIsRechargeOpen(true) : setIsMineOpen(true))}
              title={isAdmin ? 'Kho Kim Cương Tiên Tinh' : 'Mỏ Hồn Thạch'}
            >
              <span>💎</span>
              <span>{formatDiamonds(diamonds)}</span>
              <span className="diamond-plus">{isAdmin ? '+' : '⛏️'}</span>
            </div>

            <button
              className="btn btn-ghost btn-sm btn-settings-icon"
              onClick={() => setIsSettingsOpen(true)}
              title={isAdmin ? 'Giáo Hoàng Điện: Sắc phong Hồn Sư toàn Tiên Giới' : 'Thiết lập tâm pháp Đấu La'}
            >
              {isAdmin ? '🔱' : '⚙️'}
            </button>
          </>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsSettingsOpen(true)}
            title="Khai mở cảnh giới Đấu La Đại Lục"
            style={{ opacity: 0.7, fontSize: '0.78rem', padding: '4px 8px' }}
          >
            🔮 Khởi Đạo
          </button>
        )}

        <div className="earnings-pill" title="Tổng bổng lộc linh thạch tích lũy">
          <span>💰</span>
          <span>{(user?.total_earnings || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
    </header>
  )
}
