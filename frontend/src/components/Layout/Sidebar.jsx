import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDouluo } from '../../context/DouluoContext'
import './Sidebar.css'

const ADMIN_NAV = [
  { to: '/admin', icon: '⊞', label: 'Dashboard', end: true },
  { to: '/admin/schedule', icon: '📅', label: 'Thời khóa biểu' },
  { to: '/admin/sessions', icon: '✅', label: 'Duyệt ca học' },
  { to: '/admin/checkins', icon: '📸', label: 'Xem ảnh check-in' },
  { to: '/admin/notifications/send', icon: '📢', label: 'Gửi thông báo' },
  { to: '/admin/feedbacks', icon: '💬', label: 'Góp ý & Feedback' },
  { to: '/admin/activity-logs', icon: '📜', label: 'Lịch sử hoạt động' },
  { to: '/admin/members', icon: '👥', label: 'Thành viên' },
  { to: '/admin/payments', icon: '💰', label: 'Thanh toán' },
  { to: '/admin/profile', icon: '👤', label: 'Hồ sơ SV' },
]


const MEMBER_NAV = [
  { to: '/member', icon: '⊞', label: 'Dashboard', end: true },
  { to: '/member/slots', icon: '📋', label: 'Đăng ký ca học' },
  { to: '/member/schedule', icon: '📅', label: 'Lịch của tôi' },
  { to: '/member/earnings', icon: '💰', label: 'Thu nhập' },
  { to: '/member/feedback', icon: '💬', label: 'Gửi góp ý Admin' },
  { to: '/member/admin-info', icon: '🎓', label: 'Thông tin SV' },
  { to: '/member/profile', icon: '👤', label: 'Hồ sơ' },
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
      {/* Logo & Mobile Close */}
      <div className="sidebar-logo flex-between">
        <div className="flex align-center gap-3">
          <div className="logo-icon">🎓</div>
          <div>
            <div className="logo-title">Web Học Hộ</div>
            <div className="logo-badge">{user?.role === 'admin' ? 'Admin' : 'Thành viên'}</div>
          </div>
        </div>
        {onClose && (
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close Sidebar">
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => onClose && onClose()}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          {/* Avatar với Vòng Hồn Hoàn Đấu La */}
          <div
            className="soul-ring-wrapper"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsSettingsOpen(true)}
            title="Bấm để Tự Phong Cảnh Giới Đấu La"
          >
            {enabled && <div className={`soul-ring ${realm.ring}`} />}
            <div className="avatar" style={{ position: 'relative', zIndex: 1 }}>
              {initials}
            </div>
          </div>

          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {enabled ? (
                <span style={{ color: '#c084fc', fontWeight: 600, fontSize: '0.75rem' }}>
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

