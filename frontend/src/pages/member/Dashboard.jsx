import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { memberAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function MemberDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [notifs, setNotifs] = useState([])

  const [loading, setLoading] = useState(false)

  const loadData = (isManual = false) => {
    if (isManual) setLoading(true)
    memberAPI.getStats().then(r => setStats(r.data)).catch(() => {})
    memberAPI.getNotifications()
      .then(r => setNotifs(r.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <div className="imperial-banner" style={{ marginBottom: 16 }}>
        <div className="dragon-ornament dragon-left">🐉</div>
        <div className="banner-content">
          <h1 className="imperial-title">
            <span className="sparkle">✨</span> Xin chào, {user?.full_name || 'Đồng Môn'}! <span className="sparkle">✨</span>
          </h1>
          <p className="imperial-subtitle">
            Hồn Sư Bảng: Theo dõi công vụ lịch học và tích lũy linh thạch thu nhập
          </p>
        </div>
        <div className="dragon-ornament dragon-right">🐉</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          className="talisman-refresh-btn"
          onClick={() => loadData(true)}
          disabled={loading}
        >
          {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '📜'}
          <span>Làm mới số liệu</span>
        </button>
      </div>

      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(22, 16, 38, 0.85), rgba(35, 20, 60, 0.85))',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(234, 179, 8, 0.1)',
        marginBottom: 16,
        padding: '16px 18px',
        borderRadius: 14
      }}>
        <div className="flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 2, color: '#facc15', fontWeight: 700 }}>💰 TỔNG LINH THẠCH THU NHẬP</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34d399', textShadow: '0 0 12px rgba(52, 211, 153, 0.5)' }}>
              {(stats?.total_earnings || 0).toLocaleString('vi-VN')}đ
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: 3 }}>
              Chờ giải ngân: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{(stats?.pending_payment || 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <div className="flex gap-4 member-stats-row" style={{ flexWrap: 'wrap' }}>
            <div className="member-mini-stat" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="member-mini-val" style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.25rem' }}>{stats?.total_periods || 0}</div>
              <div className="label" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tiết đã học</div>
            </div>
            <div className="member-mini-stat" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="member-mini-val" style={{ color: '#c084fc', fontWeight: 800, fontSize: '1.25rem' }}>{stats?.total_sessions || 0}</div>
              <div className="label" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tổng ca nhận</div>
            </div>
            <div className="member-mini-stat" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="member-mini-val" style={{ color: '#4ade80', fontWeight: 800, fontSize: '1.25rem' }}>{stats?.completed_sessions || 0}</div>
              <div className="label" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ca hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Link to="/member/slots" className="card card-interactive quick-action-card" style={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, rgba(16, 28, 45, 0.8), rgba(20, 38, 65, 0.8))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <div className="quick-action-icon" style={{ filter: 'drop-shadow(0 0 8px #38bdf8)' }}>📜</div>
          <h3 className="h4" style={{ color: '#7dd3fc', fontWeight: 800 }}>Đăng Ký Ca Học</h3>
          <p className="body-xs" style={{ color: '#94a3b8', marginTop: 3 }}>
            Xem và tiếp nhận nhiệm vụ ca học trống trong tuần
          </p>
        </Link>
        <Link to="/member/schedule" className="card card-interactive quick-action-card" style={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, rgba(35, 18, 48, 0.8), rgba(48, 22, 68, 0.8))',
          border: '1px solid rgba(192, 132, 252, 0.35)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <div className="quick-action-icon" style={{ filter: 'drop-shadow(0 0 8px #c084fc)' }}>🔮</div>
          <h3 className="h4" style={{ color: '#e9d5ff', fontWeight: 800 }}>Lịch Pháp Đàn Của Tôi</h3>
          <p className="body-xs" style={{ color: '#94a3b8', marginTop: 3 }}>
            Xem lịch trực nhật và nộp ảnh check-in điểm danh
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
