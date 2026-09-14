import { useState, useRef } from 'react'
import { useDouluo } from '../../context/DouluoContext'

export default function DiamondMineModal() {
  const { isMineOpen, setIsMineOpen, diamonds, mineDiamonds, realm, customTitle } = useDouluo()
  const [floatingTexts, setFloatingTexts] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [combo, setCombo] = useState(0)
  const comboTimerRef = useRef(null)

  if (!isMineOpen) return null

  const handleTap = (e) => {
    // Tọa độ click
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2

    const earned = mineDiamonds(1)
    setClickCount(prev => prev + 1)

    // Combo streak
    const newCombo = combo + 1
    setCombo(newCombo)
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => setCombo(0), 1500)

    // Thêm hiệu ứng bay số
    const id = Date.now() + Math.random()
    const text = newCombo >= 10 && newCombo % 5 === 0 ? `🔥 +${earned * 2} 💎 (Combo x${newCombo})` : `+${earned} 💎`

    setFloatingTexts(prev => [...prev.slice(-10), { id, x, y, text }])

    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id))
    }, 1000)
  }

  return (
    <div className="modal-overlay flex-center" onClick={() => setIsMineOpen(false)}>
      <div
        className="modal-content"
        style={{
          maxWidth: 440,
          width: '92%',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(6, 18, 38, 0.99))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.25)',
          textAlign: 'center',
          userSelect: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex-between align-center" style={{ marginBottom: 16 }}>
          <div className="flex align-center gap-2">
            <span style={{ fontSize: '1.5rem' }}>⛏️</span>
            <div style={{ textAlign: 'left' }}>
              <h2 className="h3" style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>
                Mỏ Hồn Thạch • Gõ Nhặt Kim Cương
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Cần cù gõ mỏ, tích tiểu thành đại!
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsMineOpen(false)}>✕</button>
        </div>

        {/* Số dư hiện tại */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>💎</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
            {diamonds.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Kim Cương</span>
        </div>

        {/* Khu vực Viên Kim Cương Khổng Lồ để bấm */}
        <div
          onClick={handleTap}
          style={{
            position: 'relative',
            width: 170,
            height: 170,
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.8) 70%)',
            border: '2px dashed rgba(56, 189, 248, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(56, 189, 248, 0.3)',
            transition: 'transform 0.08s ease',
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
          title="Bấm liên tục để khai thác Kim Cương!"
        >
          <span style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 0 15px #38bdf8)' }}>
            💎
          </span>

          {/* Floating numbers */}
          {floatingTexts.map(f => (
            <div
              key={f.id}
              style={{
                position: 'absolute',
                left: f.x,
                top: f.y,
                transform: 'translate(-50%, -50%)',
                color: '#38bdf8',
                fontWeight: 800,
                fontSize: '1.1rem',
                textShadow: '0 0 8px #0284c7',
                pointerEvents: 'none',
                animation: 'floatUp 1s ease forwards',
              }}
            >
              {f.text}
            </div>
          ))}
        </div>

        {/* Hiển thị Combo Streak */}
        {combo > 2 && (
          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.9rem', marginBottom: 12 }}>
            ⚡ Combo x{combo}! Bấm nhanh lên Hồn Sư!
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleTap}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            fontWeight: 700,
            padding: '12px',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)',
          }}
        >
          ⛏️ Gõ Mỏ Khai Thác (+10 💎 / click)
        </button>

        <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 14, lineHeight: 1.4 }}>
          💡 <b>Mẹo Đấu La</b>: Member tích cóp kim cương bằng cách gõ mỏ để có lộ phí khi đăng nhập và giữ chỗ ca học. Gói nạp VIP triệu kim cương chỉ dành riêng cho Giáo Hoàng Admin!
        </p>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -60px) scale(1.3); }
        }
      `}</style>
    </div>
  )
}
