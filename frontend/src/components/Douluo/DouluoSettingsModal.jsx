import { useState } from 'react'
import { useDouluo, DOULUO_REALMS, getRealmInfo } from '../../context/DouluoContext'

export default function DouluoSettingsModal() {
  const {
    enabled,
    level,
    diamonds,
    customTitle,
    toggleEnabled,
    selfPromote,
    isSettingsOpen,
    setIsSettingsOpen,
    setIsRechargeOpen
  } = useDouluo()

  const [formLevel, setFormLevel] = useState(level)
  const [formDiamonds, setFormDiamonds] = useState(diamonds)
  const [formTitle, setFormTitle] = useState(customTitle)

  if (!isSettingsOpen) return null

  const previewRealm = getRealmInfo(formLevel)

  const handleSave = (e) => {
    e.preventDefault()
    selfPromote({
      level: Number(formLevel),
      diamonds: Number(formDiamonds),
      customTitle: formTitle
    })
    setIsSettingsOpen(false)
  }

  const QUICK_TITLES = [
    'Học Hộ Đấu La',
    'Trùm Cúp Tiết',
    'Điểm Danh Chí Tôn',
    'Võ Hồn Bút Bi',
    'Hải Thần Học Hộ',
    'Tu La Thần Vương',
    'Bậc Thầy Bàn Cuối'
  ]

  return (
    <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
      <div
        className="modal card"
        style={{
          maxWidth: 520,
          width: '100%',
          margin: 20,
          background: 'linear-gradient(135deg, rgba(30, 30, 42, 0.95), rgba(15, 15, 25, 0.98))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 0 35px rgba(168, 85, 247, 0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
          <div className="flex align-center gap-2">
            <span style={{ fontSize: '1.75rem' }}>🔮</span>
            <div>
              <h2 className="h3" style={{ margin: 0, color: '#e2e8f0' }}>Tự Phong Cảnh Giới Đấu La</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cài đặt chế độ VIP / Troll Hồn Sư</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsSettingsOpen(false)}>✕</button>
        </div>

        {/* Công tắc Bật/Tắt chế độ */}
        <div
          className="flex flex-between align-center"
          style={{
            background: enabled ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${enabled ? 'rgba(168, 85, 247, 0.4)' : 'var(--border)'}`,
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 20
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {enabled ? '⚡ Chế độ Đấu La: ĐANG BẬT' : '🛡️ Chế độ Đấu La: ĐÃ TẮT'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {enabled ? 'Hiển thị vòng hồn hoàn, kim cương và danh hiệu' : 'Giao diện trở về web làm việc bình thường'}
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${enabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={toggleEnabled}
          >
            {enabled ? 'Tắt chế độ' : 'Bật chế độ'}
          </button>
        </div>

        {/* Xem trước Hồn Hoàn & Cảnh Giới */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            marginBottom: 20,
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Xem trước Hồn Hoàn & Cảnh Giới</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <div className="soul-ring-wrapper" style={{ width: 64, height: 64 }}>
              <div className={`soul-ring ${previewRealm.ring}`} />
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}
              >
                {previewRealm.icon}
              </div>
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>
            {formTitle || previewRealm.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#c084fc', marginTop: 2 }}>
            Cấp {formLevel} • {previewRealm.name} • {previewRealm.ringName}
          </div>
        </div>

        {/* Form Tự Phong */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Cấp độ Hồn Lực */}
          <div className="form-group">
            <div className="flex flex-between" style={{ marginBottom: 4 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Cấp độ Hồn Lực (Lv. 1 - 100+)</label>
              <span style={{ fontWeight: 800, color: '#f59e0b' }}>Lv. {formLevel}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={Math.min(100, formLevel)}
              onChange={e => setFormLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
            />
            <div className="flex gap-2" style={{ marginTop: 6, flexWrap: 'wrap' }}>
              {[
                { lvl: 10, label: 'Lv.10 Hồn Sĩ' },
                { lvl: 45, label: 'Lv.45 Hồn Tông' },
                { lvl: 75, label: 'Lv.75 Hồn Thánh' },
                { lvl: 95, label: 'Lv.95 Phong Hào' },
                { lvl: 100, label: 'Lv.100 Thần Cấp' }
              ].map(item => (
                <button
                  key={item.lvl}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  onClick={() => setFormLevel(item.lvl)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Số lượng Kim Cương */}
          <div className="form-group">
            <label className="form-label">Kho Kim Cương 💎 (Tự do nhập số bất kỳ)</label>
            <input
              type="number"
              className="form-input"
              value={formDiamonds}
              onChange={e => setFormDiamonds(Math.max(0, Number(e.target.value)))}
              placeholder="Nhập số kim cương muốn có..."
            />
          </div>

          {/* Phong Hào Tự Đặt */}
          <div className="form-group">
            <label className="form-label">Phong Hào / Danh Hiệu Tự Phong</label>
            <input
              type="text"
              className="form-input"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Ví dụ: Học Hộ Đấu La"
            />
            {/* Gợi ý danh hiệu */}
            <div className="flex gap-2" style={{ marginTop: 6, flexWrap: 'wrap' }}>
              {QUICK_TITLES.map(title => (
                <button
                  key={title}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '2px 6px', color: '#94a3b8' }}
                  onClick={() => setFormTitle(title)}
                >
                  + {title}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-between align-center" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#38bdf8' }}
              onClick={() => {
                setIsSettingsOpen(false)
                setIsRechargeOpen(true)
              }}
            >
              💎 Nạp VIP 0đ →
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsSettingsOpen(false)}
              >
                Đóng
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #9333ea, #db2777)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(219, 39, 119, 0.4)'
                }}
              >
                ✨ Sắc Phong Ngay
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
