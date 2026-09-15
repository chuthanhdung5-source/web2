import React, { useState } from 'react'
import { useDouluo, SHOP_ITEMS } from '../../context/DouluoContext'
import { useTheme } from '../../context/ThemeContext'
import './DiamondShopModal.css'

export default function DiamondShopModal() {
  const {
    isShopOpen,
    setIsShopOpen,
    diamonds,
    purchasedItems,
    hasPrivilege,
    purchasePrivilege,
    vipTier,
  } = useDouluo()

  const { activeSkin, setSkin } = useTheme()
  const [activeTab, setActiveTab] = useState('all')
  const [buyingId, setBuyingId] = useState(null)

  if (!isShopOpen) return null

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (activeTab === 'all') return true
    if (activeTab === 'skin') return item.category === 'skin'
    if (activeTab === 'privilege') return item.category === 'convenience' || item.category === 'session'
    if (activeTab === 'vip') return item.category === 'vip'
    return true
  })

  const handleBuy = async (item) => {
    setBuyingId(item.id)
    try {
      const success = await purchasePrivilege(item)
      if (success && item.skinId) {
        setSkin(item.skinId)
      }
    } finally {
      setBuyingId(null)
    }
  }

  const handleApplySkin = (skinId) => {
    setSkin(skinId)
  }

  return (
    <div className="modal-backdrop douluo-shop-backdrop" onClick={() => setIsShopOpen(false)}>
      <div className="douluo-shop-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shop-header">
          <div className="shop-title-wrap">
            <span className="shop-icon-badge">🔮</span>
            <div>
              <h2 className="shop-title">Đấu La Tàng Bảo Các</h2>
              <p className="shop-subtitle">Dùng Kim Cương khai mở đặc quyền, skin giao diện & thời gian tu luyện</p>
            </div>
          </div>

          <div className="shop-balance-badge">
            <span className="diamond-glow-icon">💎</span>
            <span className="diamond-number">{diamonds.toLocaleString()}</span>
            <span className="diamond-label">Kim Cương</span>
          </div>

          <button className="shop-close-btn" onClick={() => setIsShopOpen(false)} title="Đóng Tàng Bảo Các">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shop-nav-tabs">
          <button
            className={`shop-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            ✨ Tất Cả Vật Phẩm
          </button>
          <button
            className={`shop-tab-btn ${activeTab === 'skin' ? 'active' : ''}`}
            onClick={() => setActiveTab('skin')}
          >
            🎨 Giao Diện Thần Trang
          </button>
          <button
            className={`shop-tab-btn ${activeTab === 'privilege' ? 'active' : ''}`}
            onClick={() => setActiveTab('privilege')}
          >
            ⚡ Tiện Ích & Phiên Tu Luyện
          </button>
          <button
            className={`shop-tab-btn ${activeTab === 'vip' ? 'active' : ''}`}
            onClick={() => setActiveTab('vip')}
          >
            👑 Tước Vị Chí Tôn
          </button>
        </div>

        {/* Shop Items Grid */}
        <div className="shop-items-grid">
          {filteredItems.map((item) => {
            const isOwned = item.permanent && hasPrivilege(item.id)
            const isSkinActive = item.skinId && activeSkin === item.skinId
            const canAfford = diamonds >= item.price
            const isProcessing = buyingId === item.id

            return (
              <div
                key={item.id}
                className={`shop-item-card ${isOwned ? 'owned' : ''} ${isSkinActive ? 'skin-active' : ''}`}
              >
                <div className="item-card-header">
                  <div className="item-icon-box">{item.icon}</div>
                  <div className="item-tags">
                    {item.permanent ? (
                      <span className="item-badge-perm">Vĩnh viễn</span>
                    ) : (
                      <span className="item-badge-consumable">Dùng 1 lần</span>
                    )}
                    {isOwned && <span className="item-badge-owned">Đã sở hữu</span>}
                  </div>
                </div>

                <div className="item-card-body">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-description">{item.description}</p>
                </div>

                <div className="item-card-footer">
                  <div className="item-price-tag">
                    <span className="price-gem">💎</span>
                    <span className="price-val">{item.price.toLocaleString()}</span>
                  </div>

                  <div className="item-action-wrap">
                    {isOwned ? (
                      item.skinId ? (
                        isSkinActive ? (
                          <button className="btn-shop-action btn-active" disabled>
                            ✓ Đang Dùng
                          </button>
                        ) : (
                          <button
                            className="btn-shop-action btn-apply"
                            onClick={() => handleApplySkin(item.skinId)}
                          >
                            Áp Dụng
                          </button>
                        )
                      ) : (
                        <button className="btn-shop-action btn-owned" disabled>
                          ✓ Đã Mở Khóa
                        </button>
                      )
                    ) : (
                      <button
                        className={`btn-shop-action btn-buy ${!canAfford ? 'btn-disabled' : ''}`}
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford || isProcessing}
                      >
                        {isProcessing ? 'Đang mua...' : canAfford ? 'Khai Mở' : 'Thiếu 💎'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Shop Footer Tip */}
        <div className="shop-footer-bar">
          <span className="footer-tip-icon">💡</span>
          <span className="footer-tip-text">
            Mẹo Hồn Sư: Nhấp vào biểu tượng ⛏️ trên thanh công cụ để đào khoáng nhận thêm 10 💎 mỗi lần nhấp!
          </span>
        </div>
      </div>
    </div>
  )
}
