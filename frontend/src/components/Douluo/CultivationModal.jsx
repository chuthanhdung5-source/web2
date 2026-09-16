import { useState, useEffect } from 'react'
import { useDouluo } from '../../context/DouluoContext'
import { douluoAPI } from '../../api'

export default function CultivationModal() {
  const {
    isCultivationOpen,
    setIsCultivationOpen,
    level,
    realm,
    exp,
    expNeeded,
    totalCultivateSeconds,
    diamonds,
    customTitle,
    vipTier,
    breakthrough
  } = useDouluo()

  const [activeTab, setActiveTab] = useState('cave')
  const [leaderboard, setLeaderboard] = useState([])
  const [loadingLb, setLoadingLb] = useState(false)
  const [breaking, setBreaking] = useState(false)

  useEffect(() => {
    if (activeTab === 'leaderboard' && isCultivationOpen) {
      setLoadingLb(true)
      douluoAPI.getLeaderboard()
        .then(res => setLeaderboard(res.data))
        .catch(() => {})
        .finally(() => setLoadingLb(false))
    }
  }, [activeTab, isCultivationOpen])

  if (!isCultivationOpen) return null

  const days = Math.floor(totalCultivateSeconds / 86400)
  const hours = Math.floor((totalCultivateSeconds % 86400) / 3600)
  const minutes = Math.floor((totalCultivateSeconds % 3600) / 60)
  const seconds = totalCultivateSeconds % 60

  const expPercent = Math.min(100, Math.floor((exp / Math.max(1, expNeeded)) * 100))
  const canBreakthrough = exp >= expNeeded && level < 100

  const handleBreakthrough = async () => {
    setBreaking(true)
    try {
      await breakthrough()
    } finally {
      setBreaking(false)
    }
  }

  return (
    <div className="modal-overlay flex-center" onClick={() => setIsCultivationOpen(false)}>
      <div
        className="modal-content"
        style={{ maxWidth: 560, width: '92%', border: '1px solid rgba(168, 85, 247, 0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-between align-center" style={{ marginBottom: 16 }}>
          <div className="flex gap-2">
            <button
              className={`btn btn-sm ${activeTab === 'cave' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('cave')}
            >
              🧘 Động Phủ Bế Quan
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              🏆 Phong Thần Bảng
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsCultivationOpen(false)}>✕</button>
        </div>

        {activeTab === 'cave' ? (
          <div className="cultivation-cave">
            <div className="cultivation-orb-container">
              <div className="cultivation-orbit" />
              <div className="cultivation-core">
                <span>{realm.icon}</span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
              {customTitle || realm.name} • Cảnh Giới Cấp {level}
            </h2>
            <p style={{ color: '#c084fc', fontSize: '0.85rem', marginBottom: 14 }}>
              Hồn Hoàn Hộ Thể: <span style={{ fontWeight: 700 }}>{realm.ringName}</span>
            </p>

            <div className="cultivation-timer-box">
              <div className="timer-unit">
                <span className="timer-val">{String(days).padStart(2, '0')}</span>
                <span className="timer-lbl">Ngày</span>
              </div>
              <span style={{ color: '#64748b', fontWeight: 800, alignSelf: 'center' }}>:</span>
              <div className="timer-unit">
                <span className="timer-val">{String(hours).padStart(2, '0')}</span>
                <span className="timer-lbl">Khắc (Giờ)</span>
              </div>
              <span style={{ color: '#64748b', fontWeight: 800, alignSelf: 'center' }}>:</span>
              <div className="timer-unit">
                <span className="timer-val">{String(minutes).padStart(2, '0')}</span>
                <span className="timer-lbl">Phút</span>
              </div>
              <span style={{ color: '#64748b', fontWeight: 800, alignSelf: 'center' }}>:</span>
              <div className="timer-unit">
                <span className="timer-val">{String(seconds).padStart(2, '0')}</span>
                <span className="timer-lbl">Giây</span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>
              Tốc độ ngưng tụ linh lực: <span style={{ color: '#38bdf8', fontWeight: 700 }}>+{1 + (vipTier * 0.5)} Tu Vi/giây</span>
              {vipTier > 0 && <span style={{ color: '#fbbf24', marginLeft: 6 }}>(Chí Tôn VIP {vipTier} x{1 + vipTier * 0.5})</span>}
            </div>

            <div className="cultivation-exp-bar">
              <div className="cultivation-exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
            <div className="flex-between" style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 18 }}>
              <span>Tiến độ Hồn Lực Đan Điền: {expPercent}%</span>
              <span>{exp.toLocaleString()} / {expNeeded >= 99999999 ? 'VÔ CỰC' : expNeeded.toLocaleString()} Tu Vi</span>
            </div>

            <button
              className={`btn btn-block ${canBreakthrough ? 'btn-primary' : 'btn-secondary'}`}
              disabled={!canBreakthrough || breaking}
              onClick={handleBreakthrough}
              style={{
                background: canBreakthrough
                  ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                  : undefined,
                boxShadow: canBreakthrough ? '0 0 20px rgba(168, 85, 247, 0.6)' : undefined,
                fontWeight: 700,
                padding: '12px',
              }}
            >
              {breaking
                ? 'Đang dung hợp Hồn Hoàn vạn năm...'
                : canBreakthrough
                ? '⚡ Đột Phá Cảnh Giới Tiếp Theo!'
                : level >= 100
                ? '👑 Đạt Thần Cấp Tối Thượng'
                : `Cần thêm ${(expNeeded - exp).toLocaleString()} Tu Vi để đột phá`}
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
              👑 Phong Thần Bảng Chư Vị Tu Giả Toàn Đại Lục
            </h3>
            {loadingLb ? (
              <div className="flex-center" style={{ height: 180 }}>
                <div className="spinner" style={{ width: 28, height: 28 }} />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>Chưa có danh tính tu giả trên bảng</div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45 }}>Thứ Vị</th>
                      <th>Tu Giả / Đạo Hiệu</th>
                      <th>Cảnh Giới</th>
                      <th style={{ textAlign: 'right' }}>Thời Gian Bế Quan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(item => {
                      const h = Math.floor(item.total_cultivate_seconds / 3600)
                      const m = Math.floor((item.total_cultivate_seconds % 3600) / 60)
                      return (
                        <tr key={item.user_id}>
                          <td>
                            <span className={`leaderboard-rank-badge ${item.rank <= 3 ? `rank-${item.rank}` : ''}`}>
                              {item.rank <= 3 ? (item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉') : item.rank}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.user_name}</div>
                            {item.custom_title && (
                              <div style={{ fontSize: '0.72rem', color: '#c084fc' }}>{item.custom_title}</div>
                            )}
                          </td>
                          <td>
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Cấp {item.level}</span> {item.realm_name}
                          </td>
                          <td style={{ textAlign: 'right', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {h}h {m}p
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
