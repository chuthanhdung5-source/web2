import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDouluo } from '../../context/DouluoContext'
import './Sidebar.css'

const ADMIN_NAV = [
  { to: '/admin', icon: '⊞', label: 'Dashboard', end: true, badgeIcon: '📜' },
  { to: '/admin/schedule', icon: '📅', label: 'Thời khóa biểu', badgeIcon: '🟢' },
  { to: '/admin/sessions', icon: '✅', label: 'Duyệt ca học', badgeIcon: '🗡️' },
  { to: '/admin/checkins', icon: '📸', label: 'Xem ảnh check-in', badgeIcon: '🐉' },
  { to: '/admin/notifications/send', icon: '📢', label: 'Gửi thông báo', badgeIcon: '🐉' },
  { to: '/admin/feedbacks', icon: '💬', label: 'Góp ý & Feedback', badgeIcon: '🐉' },
  { to: '/admin/activity-logs', icon: '📜', label: 'Lịch sử hoạt động', badgeIcon: '🐉' },
  { to: '/admin/members', icon: '👥', label: 'Thành viên', badgeIcon: '🐉' },
  { to: '/admin/payments', icon: '💰', label: 'Thanh toán', badgeIcon: '🐉' },
  { to: '/admin/profile', icon: '👤', label: 'Hồ sơ SV', badgeIcon: '🐉' },
]

const MEMBER_NAV = [
  { to: '/member', icon: '⊞', label: 'Dashboard', end: true, badgeIcon: '📜' },
  { to: '/member/slots', icon: '📋', label: 'Đăng ký ca học', badgeIcon: '🗡️' },
  { to: '/member/schedule', icon: '📅', label: 'Lịch của tôi', badgeIcon: '🟢' },
  { to: '/member/earnings', icon: '💰', label: 'Thu nhập', badgeIcon: '🪙' },
  { to: '/member/feedback', icon: '💬', label: 'Gửi góp ý Admin', badgeIcon: '🐉' },
  { to: '/member/admin-info', icon: '🎓', label: 'Thông tin SV', badgeIcon: '🐉' },
  { to: '/member/profile', icon: '👤', label: 'Hồ sơ', badgeIcon: '🐉' },
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
            <div className="logo-badge">{user?.role === 'admin' ? 'GIÁO HOÀNG' : 'HỒN SƯ'}</div>
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
                <span>{user?.role === 'admin' ? '👑 Admin' : '🎒 Thành viên'}</span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} id="logout-btn">
          ⏻ Đăng xuất
        </button>
      </div>
    </aside>
  )
}
