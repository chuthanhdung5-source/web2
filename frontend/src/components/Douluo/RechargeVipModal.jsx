import { useDouluo } from '../../context/DouluoContext'
import { useAuth } from '../../context/AuthContext'

export default function RechargeVipModal() {
  const { user } = useAuth()
  const { isRechargeOpen, setIsRechargeOpen, recharge, diamonds } = useDouluo()

  // Chỉ Admin mới được mở modal nạp VIP
  if (!isRechargeOpen || user?.role !== 'admin') return null

  const PACKAGES = [
    {
      id: 'pkg-1',
      tier: 1,
      title: 'Tân Thủ Đường Môn',
      diamonds: 100000,
      icon: '🥋',
      bonus: 'Tốc độ tu luyện x1.5',
      color: '#38bdf8'
    },
    {
      id: 'pkg-2',
      tier: 2,
      title: 'Sử Lai Khắc Thất Quái',
      diamonds: 1000000,
      icon: '🐯',
      bonus: 'Tốc độ tu luyện x2.0',
      color: '#a855f7'
    },
    {
      id: 'pkg-3',
      tier: 3,
      title: 'Phong Hào Đấu La',
      diamonds: 10000000,
      icon: '🐉',
      bonus: 'Tốc độ tu luyện x2.5',
      featured: true,
      color: '#ef4444'
    },
    {
      id: 'pkg-4',
      tier: 4,
      title: 'Tu La Thần Vương',
      diamonds: 100000000,
      icon: '🔱',
      bonus: 'Tốc độ tu luyện x3.0 Thần Cấp',
      color: '#fbbf24'
    }
  ]

  const handleBuy = (pkg) => {
    recharge(pkg.tier, pkg.diamonds, pkg.title)
  }

  return (
    <div className="modal-backdrop" onClick={() => setIsRechargeOpen(false)}>
      <div
        className="modal card"
        style={{
          maxWidth: 600,
          width: '92%',
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.98), rgba(10, 10, 20, 0.99))',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-between align-center" style={{ marginBottom: 20 }}>
          <div className="flex align-center gap-3">
            <span style={{ fontSize: '2rem' }}>👑</span>
            <div>
              <h2 className="h3" style={{ margin: 0, color: '#fbbf24' }}>Kho Kim Cương VIP (Admin)</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Đặc quyền cấp phát Kim Cương giả lập dành riêng cho Giáo Hoàng Admin
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsRechargeOpen(false)}>✕</button>
        </div>

        {/* Banner Đùa Đùa */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(236,72,153,0.15))',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.85rem',
            color: '#fef08a',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📢</span>
          <div>
            <strong>Thông Báo Tông Môn:</strong> Hôm nay toàn bộ gói nạp Kim Cương được tài trợ 100% bởi Sử Lai Khắc Học Viện. Bấm nạp nhận ngay lập tức không tốn 1 xu!
          </div>
        </div>

        {/* Danh sách gói nạp */}
        <div className="grid grid-2" style={{ gap: 14, marginBottom: 20 }}>
          {PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`vip-tier-card ${pkg.featured ? 'featured' : ''}`}
              onClick={() => handleBuy(pkg)}
            >
              {pkg.featured && <div className="vip-badge-ribbon">HOT NHẤT</div>}
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{pkg.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc', marginBottom: 4 }}>
                {pkg.title}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: pkg.color, marginBottom: 4 }}>
                +{pkg.diamonds.toLocaleString()} 💎
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                {pkg.bonus}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{
                  width: '100%',
                  background: pkg.featured ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : 'var(--primary)',
                  border: 'none',
                  fontWeight: 700
                }}
              >
                Nhận Miễn Phí (0đ) →
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-between align-center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            * Chế độ giải trí đùa đùa, không mất tiền thật và không chặn chức năng web.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsRechargeOpen(false)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
