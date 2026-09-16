import { useState, useEffect } from 'react'
import { useDouluo, getRealmInfo } from '../../context/DouluoContext'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../api'

export default function DouluoSettingsModal() {
  const { user } = useAuth()
  const {
    enabled,
    level,
    diamonds,
    customTitle,
    realm,
    totalCultivateSeconds,
    toggleEnabled,
    adminPromote,
    isSettingsOpen,
    setIsSettingsOpen,
    setIsCultivationOpen,
    setIsRechargeOpen,
    setIsMineOpen
  } = useDouluo()

  const isAdmin = user?.role === 'admin'

  // Admin form state
  const [targetType, setTargetType] = useState('all') // 'all' | 'user'
  const [selectedUserId, setSelectedUserId] = useState('')
  const [members, setMembers] = useState([])
  const [promoteLevel, setPromoteLevel] = useState(level || 50)
  const [promoteDiamonds, setPromoteDiamonds] = useState(100000)
  const [promoteTitle, setPromoteTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load danh sách members nếu là admin
  useEffect(() => {
    if (isAdmin && isSettingsOpen) {
      adminAPI.getMembers()
        .then(res => setMembers(res.data))
        .catch(() => {})
    }
  }, [isAdmin, isSettingsOpen])

  if (!isSettingsOpen) return null

  const previewRealm = getRealmInfo(promoteLevel)

  const handleAdminPromote = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const ok = await adminPromote({
        target_type: targetType,
        user_id: targetType === 'user' ? Number(selectedUserId) : null,
        level: Number(promoteLevel),
        diamonds_add: Number(promoteDiamonds),
        custom_title: promoteTitle
      })
      if (ok) {
        setIsSettingsOpen(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const days = Math.floor(totalCultivateSeconds / 86400)
  const hours = Math.floor((totalCultivateSeconds % 86400) / 3600)
  const minutes = Math.floor((totalCultivateSeconds % 3600) / 60)

  return (
    <div className="modal-overlay flex-center" onClick={() => setIsSettingsOpen(false)}>
      <div
        className="modal-content"
        style={{
          maxWidth: 520,
          width: '92%',
          background: 'linear-gradient(135deg, rgba(30, 30, 42, 0.98), rgba(15, 15, 25, 0.99))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 0 35px rgba(168, 85, 247, 0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex-between align-center" style={{ marginBottom: 16 }}>
          <div className="flex align-center gap-2">
            <span style={{ fontSize: '1.6rem' }}>{isAdmin ? '🔱' : '🔮'}</span>
            <div>
              <h2 className="h3" style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>
                {isAdmin ? 'Giáo Hoàng Điện • Sắc Phong Hồn Sư' : 'Cảnh Giới & Tu Vi Hồn Sư'}
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isAdmin ? 'Quyền năng tối thượng của Admin toàn server' : 'Thông tin tu vi & thiết lập cá nhân'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsSettingsOpen(false)}>✕</button>
        </div>

        {/* Công tắc Bật/Tắt chế độ */}
        <div
          className="flex-between align-center"
          style={{
            background: enabled ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${enabled ? 'rgba(168, 85, 247, 0.4)' : 'var(--border)'}`,
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 16
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {enabled ? '⚡ Chế độ Đấu La: ĐANG BẬT' : '🛡️ Chế độ Đấu La: ĐÃ TẮT'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {enabled ? 'Hiển thị vòng hồn hoàn, kim cương và danh hiệu' : 'Ẩn toàn bộ hiệu ứng, về giao diện nghiêm túc'}
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${enabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={toggleEnabled}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            {enabled ? 'Tắt chế độ' : 'Bật chế độ'}
          </button>
        </div>

        {isAdmin ? (
          /* ================= GIAO DIỆN ADMIN SẮC PHONG ================= */
          <form onSubmit={handleAdminPromote} className="flex flex-col gap-3">
            {/* Đối tượng sắc phong */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 6 }}>
                👑 Đối tượng ban sắc lệnh:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${targetType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetType('all')}
                >
                  🌐 Toàn Bộ Server (All Members)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${targetType === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetType('user')}
                >
                  👤 Thành Viên Cụ Thể
                </button>
              </div>
            </div>

            {targetType === 'user' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Chọn thành viên:
                </label>
                <select
                  className="form-control"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn thành viên cần sắc phong --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} (@{m.username})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cấp độ phong */}
            <div>
              <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                <span style={{ color: '#e2e8f0' }}>Phong tặng Cấp Độ:</span>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>
                  Cấp {promoteLevel} • {previewRealm.name}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={promoteLevel}
                onChange={e => setPromoteLevel(e.target.value)}
                style={{ width: '100%', accentColor: '#a855f7' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#e2e8f0', display: 'block', marginBottom: 4 }}>
                💎 Ban thưởng thêm Kim Cương:
              </label>
              <input
                type="number"
                className="form-control"
                value={promoteDiamonds}
                onChange={e => setPromoteDiamonds(e.target.value)}
                min="0"
                step="10000"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#e2e8f0', display: 'block', marginBottom: 4 }}>
                📜 Ban tặng Phong Hào:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ví dụ: Học Hộ Đấu La, Tu La Thần Vương..."
                value={promoteTitle}
                onChange={e => setPromoteTitle(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
              style={{
                marginTop: 6,
                background: 'linear-gradient(135deg, #a855f7, #f59e0b)',
                fontWeight: 700,
                padding: '10px'
              }}
            >
              {submitting ? 'Đang hạ sắc chỉ...' : '🔱 Hạ Sắc Lệnh Sắc Phong Hồn Sư'}
            </button>
          </form>
        ) : (
          /* ================= GIAO DIỆN MEMBER ================= */
          <div className="flex flex-col gap-3">
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: 14,
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {customTitle || realm.name} • Cấp {level}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#c084fc', marginTop: 2 }}>
                {realm.ringName}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: 8 }}>
                Đã bế quan tu luyện: {days} ngày {hours} giờ {minutes} phút
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              💡 <b style={{ color: '#fbbf24' }}>Quy tắc Đấu La</b>: Thành viên không thể tự sửa cấp độ. Hồn Lực tăng tự động theo thời gian thực (1 giây = 1 EXP). Hãy vào <b>Động Phủ Bế Quan</b> để đột phá cảnh giới hoặc tích cực cống hiến để được Giáo Hoàng Admin ban sắc phong!
            </div>

            <div className="flex gap-2" style={{ marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => {
                  setIsSettingsOpen(false)
                  setIsCultivationOpen(true)
                }}
              >
                🧘 Vào Động Phủ Bế Quan
              </button>
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => {
                  setIsSettingsOpen(false)
                  setIsMineOpen(true)
                }}
              >
                ⛏️ Gõ Mỏ Kim Cương
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
