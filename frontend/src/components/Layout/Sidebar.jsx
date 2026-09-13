import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const ADMIN_NAV = [
  { to: '/admin', icon: '⊞', label: 'Dashboard', end: true },
  { to: '/admin/schedule', icon: '📅', label: 'Thời khóa biểu' },
  { to: '/admin/sessions', icon: '✅', label: 'Duyệt ca học' },
  { to: '/admin/checkins', icon: '📸', label: 'Xem ảnh check-in' },
  { to: '/admin/members', icon: '👥', label: 'Thành viên' },
  { to: '/admin/payments', icon: '💰', label: 'Thanh toán' },
  { to: '/admin/profile', icon: '👤', label: 'Hồ sơ SV' },
]

const MEMBER_NAV = [
  { to: '/member', icon: '⊞', label: 'Dashboard', end: true },
  { to: '/member/slots', icon: '📋', label: 'Đăng ký ca học' },
  { to: '/member/schedule', icon: '📅', label: 'Lịch của tôi' },
  { to: '/member/earnings', icon: '💰', label: 'Thu nhập' },
  { to: '/member/admin-info', icon: '🎓', label: 'Thông tin SV' },
  { to: '/member/profile', icon: '👤', label: 'Hồ sơ' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? ADMIN_NAV : MEMBER_NAV

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(-2).join('') || 'U'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <div>
          <div className="logo-title">Web Học Hộ</div>
          <div className="logo-badge">{user?.role === 'admin' ? 'Admin' : 'Thành viên'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{user?.role === 'admin' ? '👑 Admin' : '🎒 Thành viên'}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} id="logout-btn">
          ⏻ Đăng xuất
        </button>
      </div>
    </aside>
  )
}
