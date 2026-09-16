import React, { useState } from 'react'
import { useDouluo } from '../../context/DouluoContext'
import { useTheme, AVAILABLE_SKINS } from '../../context/ThemeContext'
import toast from 'react-hot-toast'
import './ThemeModal.css'

export default function ThemeModal() {
  const {
    isThemeModalOpen,
    setIsThemeModalOpen,
    diamonds,
    hasPrivilege,
    purchasePrivilege,
    setIsMineOpen,
  } = useDouluo()

  const { activeSkin, setSkin } = useTheme()
  const [unlockingId, setUnlockingId] = useState(null)

  if (!isThemeModalOpen) return null

  const handleApply = (skinId) => {
    setSkin(skinId)
    toast.success('🎨 Đã kích hoạt giao diện thành công!', { icon: '✨' })
  }

  const handleUnlock = async (skin) => {
    if (diamonds < skin.price) {
      toast.error(`Cần ${skin.price.toLocaleString()} 💎 Kim Cương để mở khóa!`, {
        icon: '💎',
        duration: 4000
      })
      return
    }

    setUnlockingId(skin.id)
    try {
      const success = await purchasePrivilege({
        id: skin.privilegeId,
        name: skin.name,
        price: skin.price,
      })
      if (success) {
        setSkin(skin.id)
      }
    } finally {
      setUnlockingId(null)
    }
  }

  return (
    <div className="modal-backdrop theme-modal-backdrop" onClick={() => setIsThemeModalOpen(false)}>
      <div className="theme-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="theme-modal-header">
          <div className="theme-header-left">
            <span className="theme-modal-badge-icon">🎨</span>
            <div>
              <h2 className="theme-modal-title">Kho Giao Diện Tông Môn</h2>
              <p className="theme-modal-subtitle">Đổi màu nền đơn sắc siêu nét, mở khóa bằng Kim Cương</p>
            </div>
          </div>

          <div className="theme-balance-pill">
            <span className="balance-gem">💎</span>
            <span className="balance-val">{diamonds.toLocaleString()}</span>
            <span className="balance-unit">Kim Cương</span>
          </div>

          <button
            className="theme-modal-close"
            onClick={() => setIsThemeModalOpen(false)}
            title="Đóng bảng giao diện"
          >
            ✕
          </button>
        </div>

        <div className="theme-cards-grid">
          {AVAILABLE_SKINS.map((skin) => {
            const isFree = !skin.privilegeId || skin.price === 0
            const isOwned = isFree || hasPrivilege(skin.privilegeId)
            const isActive = activeSkin === skin.id
            const isUnlocking = unlockingId === skin.id

            return (
              <div
                key={skin.id}
                className={`theme-card ${isActive ? 'active' : ''} ${isOwned ? 'owned' : 'locked'}`}
              >
                <div className="theme-preview-box" style={{ backgroundColor: skin.bg }}>
                  <div className="preview-surface" style={{ backgroundColor: skin.surface, borderColor: skin.primaryColor }}>
                    <span className="preview-indicator" style={{ backgroundColor: skin.primaryColor }} />
                    <span className="preview-text" style={{ color: skin.textColor }}>Aa 123</span>
                  </div>
                </div>

                <div className="theme-card-body">
                  <div className="theme-card-top-row">
                    <span className="theme-card-icon">{skin.icon}</span>
                    <h3 className="theme-card-name">{skin.name}</h3>
                    {isActive && <span className="tag-active">ĐANG DÙNG</span>}
                  </div>

                  <p className="theme-card-desc">{skin.description}</p>

                  <div className="theme-card-action-row">
                    <div className="theme-price-tag">
                      {isFree ? (
                        <span className="price-free">Miễn phí</span>
                      ) : isOwned ? (
                        <span className="price-owned">✓ Đã sở hữu</span>
                      ) : (
                        <span className="price-cost">💎 {skin.price.toLocaleString()} KC</span>
                      )}
                    </div>

                    {isActive ? (
                      <button className="btn-theme-action current-btn" disabled>
                        ✓ Đang dùng
                      </button>
                    ) : isOwned ? (
                      <button
                        className="btn-theme-action apply-btn"
                        onClick={() => handleApply(skin.id)}
                      >
                        Áp dụng
                      </button>
                    ) : (
                      <button
                        className="btn-theme-action unlock-btn"
                        onClick={() => handleUnlock(skin)}
                        disabled={isUnlocking}
                      >
                        {isUnlocking ? (
                          <div className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <span>Mở khóa 💎</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="theme-modal-footer">
          <span className="footer-tip">💡 Mẹo: Hết Kim Cương? Hãy vào Mỏ Hồn Thạch gõ đá hoặc Nạp VIP 0đ để nhận thêm Kim Cương miễn phí.</span>
          <button
            className="btn-go-mine"
            onClick={() => {
              setIsThemeModalOpen(false)
              setIsMineOpen(true)
            }}
          >
            ⛏️ Đào Kim Cương
          </button>
        </div>
      </div>
    </div>
  )
}
