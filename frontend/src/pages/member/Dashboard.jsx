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
      <div className="imperial-banner" style={{ marginBottom: 14 }}>
        <div className="dragon-ornament dragon-left">🐉</div>
        <div className="banner-content">
          <h1 className="imperial-title">
            <span className="sparkle">✨</span> Đạo Huynh {user?.full_name || 'Đồng Môn'} Vạn Sự Cát Tường! <span className="sparkle">✨</span>
          </h1>
          <p className="imperial-subtitle">
            Động Phủ Tu Vi: Theo dõi đạo vụ hộ đạo và tích lũy bổng lộc linh thạch
          </p>
        </div>
        <div className="dragon-ornament dragon-right">🐉</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          className="talisman-refresh-btn"
          onClick={() => loadData(true)}
          disabled={loading}
        >
          {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '📜'}
          <span>Truyền Thông Linh Ký</span>
        </button>
      </div>

      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(20, 14, 38, 0.75), rgba(32, 18, 56, 0.75))',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(234, 179, 8, 0.08)',
        marginBottom: 14,
        padding: '14px 18px',
        borderRadius: 14
      }}>
        <div className="flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 2, color: '#facc15', fontWeight: 700 }}>💰 TỔNG BỔNG LỘC LINH THẠCH</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#34d399', textShadow: '0 0 12px rgba(52, 211, 153, 0.45)' }}>
              {(stats?.total_earnings || 0).toLocaleString('vi-VN')}đ
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 2 }}>
              Đang chờ giải ngân: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{(stats?.pending_payment || 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <div className="flex gap-3 member-stats-row" style={{ flexWrap: 'wrap' }}>
            <div className="member-mini-stat" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="member-mini-val" style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.2rem' }}>{stats?.total_periods || 0}</div>
              <div className="label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Canh Giờ Hộ Đạo</div>
            </div>
            <div className="member-mini-stat" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="member-mini-val" style={{ color: '#c084fc', fontWeight: 800, fontSize: '1.2rem' }}>{stats?.total_sessions || 0}</div>
              <div className="label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tràng Đã Lĩnh Nhận</div>
            </div>
            <div className="member-mini-stat" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="member-mini-val" style={{ color: '#4ade80', fontWeight: 800, fontSize: '1.2rem' }}>{stats?.completed_sessions || 0}</div>
              <div className="label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tràng Đã Viên Mãn</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <Link to="/member/slots" className="card card-interactive quick-action-card" style={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, rgba(14, 24, 40, 0.75), rgba(18, 34, 58, 0.75))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)'
        }}>
          <div className="quick-action-icon" style={{ filter: 'drop-shadow(0 0 8px #38bdf8)' }}>📜</div>
          <h3 className="h4" style={{ color: '#7dd3fc', fontWeight: 800 }}>Lĩnh Nhận Khảo Nghiệm</h3>
          <p className="body-xs" style={{ color: '#94a3b8', marginTop: 2 }}>
            Xem bảng thông cáo và tiếp nhận đạo tràng thí luyện trống trong tuần
          </p>
        </Link>
        <Link to="/member/schedule" className="card card-interactive quick-action-card" style={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, rgba(30, 16, 44, 0.75), rgba(42, 20, 60, 0.75))',
          border: '1px solid rgba(192, 132, 252, 0.35)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)'
        }}>
          <div className="quick-action-icon" style={{ filter: 'drop-shadow(0 0 8px #c084fc)' }}>🔮</div>
          <h3 className="h4" style={{ color: '#e9d5ff', fontWeight: 800 }}>Lịch Trình Hộ Đạo Bản Thân</h3>
          <p className="body-xs" style={{ color: '#94a3b8', marginTop: 2 }}>
            Xem lịch trực trận và tế xuất thần ảnh điểm danh nhập trận
          </p>
        </Link>
      </div>

      {notifs.length > 0 && (
        <div className="card">
          <h3 className="h3" style={{ marginBottom: 14 }}>🔔 Thần Niệm Truyền Âm Mới Nhất</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifs.map(n => (
              <div key={n.id} className="flex gap-3" style={{
                padding: '10px 12px',
                background: n.is_read ? 'transparent' : 'rgba(124,106,245,0.08)',
                borderRadius: 8,
                border: '1px solid var(--border)',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {{ reminder: '🔔', approval: '✅', rejection: '❌', payment: '💰', warning: '⚠️', info: 'ℹ️' }[n.type] || '📢'}
                </span>
                <div>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: '0.85rem' }}>{n.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
