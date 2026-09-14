import { useDouluo } from '../../context/DouluoContext'

export default function RechargeVipModal() {
  const { isRechargeOpen, setIsRechargeOpen, recharge, diamonds } = useDouluo()

  if (!isRechargeOpen) return null

  const PACKAGES = [
    {
      id: 'pkg-1',
      title: 'Tân Thủ Đường Môn',
      diamonds: 50000,
      icon: '🥋',
      bonus: 'Tặng Hồn Hoàn 100 năm',
      color: '#38bdf8'
    },
    {
      id: 'pkg-2',
      title: 'Sử Lai Khắc Thất Quái',
      diamonds: 1000000,
      icon: '🐯',
      bonus: 'Tặng Hồn Hoàn Vạn Năm',
      color: '#a855f7'
    },
    {
      id: 'pkg-3',
      title: 'Phong Hào Đấu La',
      diamonds: 50000000,
      icon: '🐉',
      bonus: 'Tặng Hồn Hoàn 100.000 Năm',
      featured: true,
      color: '#ef4444'
    },
    {
      id: 'pkg-4',
      title: 'Tu La Thần Vương',
      diamonds: 999999999,
      icon: '🔱',
      bonus: 'Hồn Hoàn Triệu Năm Hoàng Kim',
      color: '#fbbf24'
    }
  ]

  const handleBuy = (pkg) => {
    recharge(pkg.diamonds, pkg.title)
    setIsRechargeOpen(false)
  }

  return (
    <div className="modal-backdrop" onClick={() => setIsRechargeOpen(false)}>
      <div
        className="modal card"
        style={{
          maxWidth: 600,
          width: '100%',
          margin: 20,
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.98), rgba(10, 10, 20, 0.99))',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          boxShadow: '0 0 40px rgba(251, 191, 36, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
          <div className="flex align-center gap-2">
            <span style={{ fontSize: '1.75rem' }}>💎</span>
            <div>
              <h2 className="h3" style={{ margin: 0, color: '#fde047' }}>Cửa Hàng Kim Cương VIP Đại Lục</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Số dư hiện tại: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{diamonds.toLocaleString()} 💎</span> (Khuyến mãi đặc biệt: Giá 0đ)
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
