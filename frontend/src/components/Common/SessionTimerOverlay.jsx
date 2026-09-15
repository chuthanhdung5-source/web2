import React from 'react'
import { useDouluo } from '../../context/DouluoContext'

export default function SessionTimerOverlay() {
  const {
    isSessionExpired,
    diamonds,
    extendSession,
    dismissSessionWarning,
  } = useDouluo()

  if (!isSessionExpired) return null

  const handleExtend = async () => {
    await extendSession(120, 1000)
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 99999 }} onClick={dismissSessionWarning}>
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '28px',
          textAlign: 'center',
          background: 'linear-gradient(165deg, rgba(30, 27, 75, 0.96), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.25)',
          borderRadius: '20px',
          animation: 'shopSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
          }}
        >
          ⏳
        </div>

        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '1.3rem',
            fontWeight: '800',
            color: '#fbbf24',
          }}
        >
          Phiên Khảo Thí Đã Đầy (2 Giờ)
        </h3>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '0.9rem',
            color: '#cbd5e1',
            lineHeight: '1.55',
          }}
        >
          Ngài đã tập trung làm việc liên tục suốt 2 giờ đồng hồ. Kinh mạch cần được nghỉ ngơi điều tiết, hoặc dùng <strong>1.000 💎</strong> để gia hạn thêm 120 phút tiếp tục tu hành!
        </p>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Kim Cương hiện có:</span>
          <span style={{ fontWeight: '800', color: '#38bdf8', fontSize: '1rem' }}>
            💎 {diamonds.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn btn-primary"
            style={{
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderColor: '#f59e0b',
              color: '#000000',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
            }}
            onClick={handleExtend}
          >
            ⚡ Gia Hạn 120 Phút (-1.000 💎)
          </button>

          <button
            className="btn btn-secondary"
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
            }}
            onClick={dismissSessionWarning}
          >
            Bỏ qua / Vẫn tiếp tục
          </button>
        </div>
      </div>
    </div>
  )
}
