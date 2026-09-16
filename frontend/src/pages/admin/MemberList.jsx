import { useEffect, useState } from 'react'
import { adminAPI, douluoAPI } from '../../api'
import { useDouluo, getRealmInfo, SHOP_ITEMS } from '../../context/DouluoContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const VIP_TIERS = [
  { value: 0, label: 'VIP 0 - Phổ Thông Hộ Đạo' },
  { value: 1, label: 'VIP 1 - Đồng Cấp Hộ Đạo' },
  { value: 2, label: 'VIP 2 - Ngân Cấp Hộ Đạo' },
  { value: 3, label: 'VIP 3 - Kim Cấp Hộ Đạo' },
  { value: 4, label: 'VIP 4 - Chí Tôn Vô Thượng' }
]

export default function MemberList() {
  const { user } = useAuth()
  const { loadStatus } = useDouluo()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const [resetModalMember, setResetModalMember] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [editMember, setEditMember] = useState(null)
  const [loadingCultivation, setLoadingCultivation] = useState(false)
  const [savingCultivation, setSavingCultivation] = useState(false)

  const [editLevel, setEditLevel] = useState(1)
  const [editDiamonds, setEditDiamonds] = useState(0)
  const [editVipTier, setEditVipTier] = useState(0)
  const [editTitle, setEditTitle] = useState('')
  const [editPurchasedItems, setEditPurchasedItems] = useState([])
  const [editExp, setEditExp] = useState(0)
  const [editTotalSeconds, setEditTotalSeconds] = useState(0)
  const [editIsEnabled, setEditIsEnabled] = useState(true)

  const load = () => {
    adminAPI.getMembers().then(r => setMembers(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (id) => {
    try {
      await adminAPI.toggleMember(id)
      toast.success('Đã cập nhật đạo tịch trạng thái')
      load()
    } catch {
      toast.error('Có lỗi linh lực xảy ra')
    }
  }

  const openResetModal = (member) => {
    setResetModalMember(member)
    setNewPassword('123456')
  }

  const handleForceReset = async (e) => {
    e.preventDefault()
    if (!resetModalMember) return
    if (newPassword && newPassword.length < 6) {
      toast.error('Khẩu quyết phải có ít nhất 6 ấn ký')
      return
    }

    setResetting(true)
    try {
      const res = await adminAPI.forceResetPassword(resetModalMember.id, {
        new_password: newPassword.trim() || undefined
      })
      toast.success(`✅ Đã ban cố khẩu quyết cho đệ tử @${resetModalMember.username} thành: ${res.data.new_password}`, {
        duration: 8000
      })
      setResetModalMember(null)
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi ban cố khẩu quyết')
    } finally {
      setResetting(false)
    }
  }

  const openCultivationModal = async (member) => {
    setEditMember(member)
    setLoadingCultivation(true)
    try {
      const res = await douluoAPI.adminGetMemberCultivation(member.id)
      const data = res.data
      setEditLevel(data.level || 1)
      setEditDiamonds(data.diamonds || 0)
      setEditVipTier(data.vip_tier || 0)
      setEditTitle(data.custom_title || '')
      setEditPurchasedItems(Array.isArray(data.purchased_items) ? data.purchased_items : [])
      setEditExp(data.exp || 0)
      setEditTotalSeconds(data.total_cultivate_seconds || 0)
      setEditIsEnabled(data.is_enabled !== false)
    } catch {
      setEditLevel(1)
      setEditDiamonds(88888)
      setEditVipTier(0)
      setEditTitle('')
      setEditPurchasedItems([])
      setEditExp(0)
      setEditTotalSeconds(0)
      setEditIsEnabled(true)
    } finally {
      setLoadingCultivation(false)
    }
  }

  const handleToggleItem = (itemId) => {
    setEditPurchasedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  const handleSelectAllItems = () => {
    const allIds = SHOP_ITEMS.map(item => item.id)
    setEditPurchasedItems(allIds)
  }

  const handleClearAllItems = () => {
    setEditPurchasedItems([])
  }

  const handleSaveCultivation = async (e) => {
    e.preventDefault()
    if (!editMember) return
    setSavingCultivation(true)
    try {
      const payload = {
        level: Number(editLevel),
        diamonds: Number(editDiamonds),
        vip_tier: Number(editVipTier),
        custom_title: editTitle,
        purchased_items: editPurchasedItems,
        exp: Number(editExp),
        total_cultivate_seconds: Number(editTotalSeconds),
        is_enabled: editIsEnabled
      }
      await douluoAPI.adminUpdateMemberCultivation(editMember.id, payload)
      toast.success(`✅ Đã ban sắc toàn bộ quyền hạn & tu vi cho ${editMember.full_name}!`, {
        duration: 5000,
        icon: '👑'
      })
      if (user && user.id === editMember.id) {
        loadStatus()
      }
      setEditMember(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi ban bố tu vi đệ tử')
    } finally {
      setSavingCultivation(false)
    }
  }

  const currentRealm = getRealmInfo(editLevel)

  return (
    <div>
      <div className="page-header">
        <h1>👥 Chư Vị Đồng Môn & Đệ Tử Tiên Tông</h1>
        <p>Danh sách chư vị đệ tử tông môn, tiên trang linh thạch và quyền năng Đấu La tu tiên</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : members.length === 0 ? (
        <div className="empty-state">Chưa có đệ tử nào nhập môn</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Đệ Tử</th>
                <th>Truyền Tin</th>
                <th>Tiên Trang Thần Phù</th>
                <th>Tổng Bổng Lộc Linh Thạch</th>
                <th>Trạng Thái Đạo Tịch</th>
                <th>Pháp Quyết Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{m.username}</div>
                  </td>
                  <td>
                    <div>{m.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.phone || '—'}</div>
                  </td>
                  <td>
                    {m.bank_name ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{m.bank_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.bank_account_no} • {m.bank_account_name}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Chưa tuyên ấn</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                      {(m.total_earnings || 0).toLocaleString('vi-VN')} Linh Thạch
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${m.is_active ? 'badge-verified' : 'badge-rejected'}`}>
                      {m.is_active ? 'Đang Tu Luyện' : 'Đã Trục Xuất'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="Chấp chưởng toàn diện: Cảnh giới, Tiên tinh, Pháp bảo, VIP, Phong hào"
                        onClick={() => openCultivationModal(m)}
                        style={{
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          color: '#c084fc',
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 600,
                          background: 'rgba(168, 85, 247, 0.08)'
                        }}
                      >
                        🔱 Tu Vi & Bảo Khố
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        title="Ban cố đổi khẩu quyết"
                        onClick={() => openResetModal(m)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        🔑 Khẩu Quyết
                      </button>
                      <button
                        id={`toggle-${m.id}`}
                        className={`btn btn-sm ${m.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(m.id)}
                      >
                        {m.is_active ? '🔒 Phong Ấn' : '🔓 Giải Ấn'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editMember && (
        <div className="modal-backdrop" onClick={() => setEditMember(null)} style={{ overflowY: 'auto', padding: '20px 10px' }}>
          <div
            className="modal card"
            style={{
              maxWidth: 620,
              width: '100%',
              margin: 'auto',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div className="flex align-center gap-2">
                <span style={{ fontSize: '1.4rem' }}>👑</span>
                <div>
                  <h2 className="h3" style={{ margin: 0, fontSize: '1.1rem' }}>
                    Chấp Chưởng Toàn Diện Quyền Năng & Tu Vi Đệ Tử
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {editMember.full_name} (@{editMember.username}) • Đạo Tịch #{editMember.id}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMember(null)}>✕</button>
            </div>

            {loadingCultivation ? (
              <div className="flex-center" style={{ height: 260 }}>
                <div className="spinner" />
              </div>
            ) : (
              <form onSubmit={handleSaveCultivation} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div className="flex align-center gap-3">
                      <span style={{ fontSize: '2rem' }}>{currentRealm.icon}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {editTitle ? `${editTitle} • ` : ''}{currentRealm.name} (Cảnh Giới Cấp {editLevel})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600 }}>
                          {currentRealm.ringName}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                        💎 {Number(editDiamonds || 0).toLocaleString('vi-VN')} Tiên Tinh
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {VIP_TIERS.find(v => v.value === Number(editVipTier))?.label || 'VIP 0'}
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span>🥋 Cảnh Giới Tu Vi & Hồn Hoàn:</span>
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>Cấp {editLevel} / 100 • {currentRealm.name}</span>
                    </div>
                    <div className="flex gap-3 align-center">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={editLevel}
                        onChange={e => setEditLevel(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#a855f7' }}
                      />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-input"
                        style={{ width: 80, textAlign: 'center', fontWeight: 700 }}
                        value={editLevel}
                        onChange={e => setEditLevel(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                      />
                    </div>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                      {[10, 30, 50, 70, 90, 99, 100].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '2px 6px', border: '1px solid var(--border)' }}
                          onClick={() => setEditLevel(lvl)}
                        >
                          Cấp {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>
                      💎 Kim Cương Sở Hữu:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }}
                        value={editDiamonds}
                        onChange={e => setEditDiamonds(Math.max(0, Number(e.target.value) || 0))}
                        required
                      />
                    </div>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--border)' }}
                        onClick={() => setEditDiamonds(prev => prev + 10000)}
                      >
                        +10.000
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--border)' }}
                        onClick={() => setEditDiamonds(prev => prev + 50000)}
                      >
                        +50.000
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--border)' }}
                        onClick={() => setEditDiamonds(prev => prev + 100000)}
                      >
                        +100.000
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--border)' }}
                        onClick={() => setEditDiamonds(prev => prev + 500000)}
                      >
                        +500.000
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid #38bdf8', color: '#38bdf8' }}
                        onClick={() => setEditDiamonds(999999)}
                      >
                        Set 999.999 💎
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid #ef4444', color: '#ef4444' }}
                        onClick={() => setEditDiamonds(0)}
                      >
                        Về 0 💎
                      </button>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                    <div className="flex flex-between align-center" style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        🎁 Tất Cả Pháp Bảo & Đặc Quyền Đã Ban Sắc ({editPurchasedItems.length}/{SHOP_ITEMS.length}):
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', color: '#38bdf8', padding: '2px 8px' }}
                          onClick={handleSelectAllItems}
                        >
                          ✨ Khai mở toàn bộ
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', color: '#ef4444', padding: '2px 8px' }}
                          onClick={handleClearAllItems}
                        >
                          🧹 Thu hồi tất cả
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                      {SHOP_ITEMS.map(item => {
                        const isOwned = editPurchasedItems.includes(item.id)
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleItem(item.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: isOwned ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-secondary)',
                              border: `1px solid ${isOwned ? '#a855f7' : 'var(--border)'}`,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isOwned}
                              onChange={() => {}}
                              style={{ width: 16, height: 16, accentColor: '#a855f7', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isOwned ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {item.price.toLocaleString('vi-VN')} 💎 {isOwned ? '• ĐÃ ĐẮC ĐẠO' : ''}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
                        👑 Cấp Bậc Tôn Quý Tông Môn:
                      </label>
                      <select
                        className="form-control"
                        value={editVipTier}
                        onChange={e => setEditVipTier(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}
                      >
                        {VIP_TIERS.map(v => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
                        📜 Phong Hào Đạo Hiệu Thần Tông:
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Cao Thủ Núp Lùm, Vạn Ca Đấu La..."
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                      />
                      <div className="flex gap-2" style={{ marginTop: 6, flexWrap: 'wrap' }}>
                        {['Bàn Cuối Chân Nhân', 'Cao Thủ Núp Lùm', 'Vạn Ca Đấu La', 'Núp Lùm Chi Thần'].map(t => (
                          <button
                            key={t}
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                            onClick={() => setEditTitle(t)}
                          >
                            {t}
                          </button>
                        ))}
                        {editTitle && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.7rem', padding: '2px 6px', color: '#ef4444' }}
                            onClick={() => setEditTitle('')}
                          >
                            Hủy Bỏ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                    <div className="flex-between align-center">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          ⚡ Khai Thông Linh Mạch Tu Tiên Đấu La
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Ban phát đại đạo tu luyện, hồn hoàn dị tượng và tiên tinh cho đệ tử này
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editIsEnabled}
                        onChange={e => setEditIsEnabled(e.target.checked)}
                        style={{ width: 20, height: 20, accentColor: '#a855f7', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>
                        Tu Luyện Tu Vi (EXP):
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={editExp}
                        onChange={e => setEditExp(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                    <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>
                        Thời Khắc Nhập Định Bế Quan (Giây):
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={editTotalSeconds}
                        onChange={e => setEditTotalSeconds(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                  </div>

                </div>

                <div
                  style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditMember(null)}
                    disabled={savingCultivation}
                  >
                    Thu Hồi Ý Định
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingCultivation}
                    style={{
                      background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                      fontWeight: 700,
                      padding: '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {savingCultivation ? (
                      <>
                        <div className="spinner" style={{ width: 14, height: 14 }} />
                        Đang ban sắc quyền hạn...
                      </>
                    ) : (
                      '✓ Ban Sắc Lệnh Tu Vi & Bảo Khố'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {resetModalMember && (
        <div className="modal-backdrop" onClick={() => setResetModalMember(null)}>
          <div className="modal card" style={{ maxWidth: 460, width: '100%', margin: 20 }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16 }}>
              <h2 className="h3">🔑 Cưỡng Chế Ban Cố Khẩu Quyết</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setResetModalMember(null)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
              Tái định khẩu quyết tâm pháp trực tiếp cho đệ tử <strong>{resetModalMember.full_name}</strong> (<code>@{resetModalMember.username}</code>).
            </p>

            <form onSubmit={handleForceReset} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Khẩu Quyết Tâm Pháp Mới</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập khẩu quyết mới tối thiểu 6 ấn ký"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setNewPassword('123456')}
                >
                  ⚡ Đặt: 123456
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setNewPassword('webhocho123')}
                >
                  ⚡ Đặt: webhocho123
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setNewPassword(`hoc${Math.floor(100000 + Math.random() * 900000)}`)}
                >
                  🎲 Khẩu Quyết Ngẫu Nhiên
                </button>
              </div>

              <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResetModalMember(null)}
                  disabled={resetting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetting}
                >
                  {resetting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Đang ban lệnh...</> : '✓ Xác Nhận Ban Lệnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
