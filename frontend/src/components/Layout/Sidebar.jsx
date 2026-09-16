import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDouluo } from '../../context/DouluoContext'
import './Sidebar.css'

const ADMIN_NAV = [
  { to: '/admin', icon: '🏛️', label: 'Tông Môn Điện', end: true, badgeIcon: '📜' },
  { to: '/admin/schedule', icon: '📅', label: 'Lịch Khảo Thí Trực Trận', badgeIcon: '🟢' },
  { to: '/admin/sessions', icon: '✅', label: 'Chuẩn Phê Thí Luyện', badgeIcon: '🗡️' },
  { to: '/admin/checkins', icon: '📸', label: 'Linh Ảnh Khảo Thí', badgeIcon: '🐉' },
  { to: '/admin/notifications/send', icon: '📢', label: 'Truyền Hịch Tông Môn', badgeIcon: '🐉' },
  { to: '/admin/feedbacks', icon: '💬', label: 'Thần Niệm Đệ Tử', badgeIcon: '🐉' },
  { to: '/admin/activity-logs', icon: '📜', label: 'Tông Môn Linh Ký', badgeIcon: '🐉' },
  { to: '/admin/members', icon: '👥', label: 'Chư Vị Tu Giả', badgeIcon: '🐉' },
  { to: '/admin/payments', icon: '💰', label: 'Bổng Lộc Linh Thạch', badgeIcon: '🐉' },
  { to: '/admin/profile', icon: '👤', label: 'Ngọc Giản Thân Phận', badgeIcon: '🐉' },
]

const MEMBER_NAV = [
  { to: '/member', icon: '🏛️', label: 'Động Phủ Tu Luyện', end: true, badgeIcon: '📜' },
  { to: '/member/slots', icon: '📋', label: 'Lĩnh Nhận Khảo Nghiệm', badgeIcon: '🗡️' },
  { to: '/member/schedule', icon: '📅', label: 'Lịch Trình Hộ Đạo', badgeIcon: '🟢' },
  { to: '/member/earnings', icon: '💰', label: 'Linh Thạch Thu Hoạch', badgeIcon: '🪙' },
  { to: '/member/feedback', icon: '💬', label: 'Thượng Thư Giáo Hoàng', badgeIcon: '🐉' },
  { to: '/member/admin-info', icon: '🎓', label: 'Môn Quy Tiên Tông', badgeIcon: '🐉' },
  { to: '/member/profile', icon: '👤', label: 'Đạo Lộ Cá Nhân', badgeIcon: '🐉' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? ADMIN_NAV : MEMBER_NAV

  const handleLogout = () => {
    if (onClose) onClose()
    logout()
    navigate('/login')
  }

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(-2).join('') || 'U'
  const { enabled, realm, customTitle, setIsSettingsOpen } = useDouluo()

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo flex-between">
        <div className="flex align-center gap-3">
          <div className="logo-icon">🔮</div>
          <div>
            <div className="logo-title">Đấu La Khảo Lưới</div>
            <div className="logo-badge">{user?.role === 'admin' ? 'GIÁO HOÀNG TÔNG CHỦ' : 'ĐỆ TỬ CHÂN TRUYỀN'}</div>
          </div>
        </div>
        {onClose && (
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close Sidebar">
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => onClose && onClose()}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <div className="flex align-center gap-2">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
            <span className="nav-dragon-wing">{item.badgeIcon}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div
            className="soul-ring-wrapper"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsSettingsOpen(true)}
            title="Bấm để Tự Phong Cảnh Giới Đấu La"
          >
            <div className="blazing-sun-ring" />
            {enabled && <div className={`soul-ring ${realm.ring}`} />}
            <div className="avatar" style={{ position: 'relative', zIndex: 2 }}>
              {initials}
            </div>
          </div>

          <div className="user-info">
            <div className="user-name">{user?.full_name || 'Quản Trị Viên'}</div>
            <div className="user-role">
              {enabled ? (
                <span className="user-realm-tag">
                  {realm.icon} {customTitle || realm.name}
                </span>
              ) : (
                <span>{user?.role === 'admin' ? '👑 Giáo Hoàng' : '🎒 Đệ Tử'}</span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} id="logout-btn">
          ⏻ Rời Khỏi Tiên Môn
        </button>
      </div>
    </aside>
  )
}
