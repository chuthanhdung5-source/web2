import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { memberAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function MemberDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    memberAPI.getStats().then(r => setStats(r.data)).catch(() => {})
    memberAPI.getNotifications().then(r => setNotifs(r.data.slice(0, 5))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>👋 Xin chào, {user?.full_name}!</h1>
        <p>Theo dõi lịch học và thu nhập của bạn</p>
      </div>

      {/* Earnings highlight */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(124,106,245,0.15), rgba(98,84,212,0.08))',
        border: '1px solid rgba(124,106,245,0.2)',
        marginBottom: 24
      }}>
        <div className="flex flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>💰 Tổng thu nhập</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              {(stats?.total_earnings || 0).toLocaleString('vi-VN')}đ
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Chờ nhận: <span style={{ color: 'var(--accent)' }}>{(stats?.pending_payment || 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.total_periods || 0}</div>
              <div className="label">Tiết đã học</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.total_sessions || 0}</div>
              <div className="label">Tổng ca</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.completed_sessions || 0}</div>
              <div className="label">Ca hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Link to="/member/slots" className="card card-interactive" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
          <h3 className="h3">Đăng ký ca học</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.875rem' }}>
            Xem và đăng ký các ca học trống trong tuần
          </p>
        </Link>
        <Link to="/member/schedule" className="card card-interactive" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📅</div>
          <h3 className="h3">Lịch của tôi</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.875rem' }}>
            Xem lịch và nộp ảnh check-in
          </p>
        </Link>
      </div>

      {/* Recent notifications */}
      {notifs.length > 0 && (
        <div className="card">
          <h3 className="h3" style={{ marginBottom: 16 }}>🔔 Thông báo mới nhất</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifs.map(n => (
              <div key={n.id} className="flex gap-3" style={{
                padding: '12px',
                background: n.is_read ? 'transparent' : 'rgba(124,106,245,0.08)',
                borderRadius: 8,
                border: '1px solid var(--border)',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.25rem' }}>
                  {{ reminder: '🔔', approval: '✅', rejection: '❌', payment: '💰', warning: '⚠️', info: 'ℹ️' }[n.type] || '📢'}
                </span>
                <div>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: '0.875rem' }}>{n.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
