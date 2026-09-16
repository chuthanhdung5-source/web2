import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setIsMobileOpen(prev => {
        const next = !prev
        if (next) {
          document.body.style.overflow = 'hidden'
        } else {
          document.body.style.overflow = ''
        }
        return next
      })
    } else {
      setIsDesktopCollapsed(prev => !prev)
    }
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
    document.body.style.overflow = ''
  }

  return (
    <div className={`app-layout ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
      )}

      <Sidebar
        isOpen={isMobileOpen}
        isCollapsed={isDesktopCollapsed}
        onClose={closeMobileSidebar}
      />

      <div className="main-content">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="page-content animate-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}


