import { useState } from 'react'

const DAYS = [
  { num: 2, label: 'Thứ 2' },
  { num: 3, label: 'Thứ 3' },
  { num: 4, label: 'Thứ 4' },
  { num: 5, label: 'Thứ 5' },
  { num: 6, label: 'Thứ 6' },
  { num: 7, label: 'Thứ 7' },
  { num: 8, label: 'Chủ Nhật' },
]

const PERIODS = [
  { num: 1, label: 'Tiết 1', time: '07:00–07:50', session: 'morning' },
  { num: 2, label: 'Tiết 2', time: '07:55–08:45', session: 'morning' },
  { num: 3, label: 'Tiết 3', time: '08:50–09:40', session: 'morning' },
  { num: 4, label: 'Tiết 4', time: '09:50–10:40', session: 'morning' },
  { num: 5, label: 'Tiết 5', time: '10:45–11:35', session: 'morning' },
  { num: 6, label: 'Tiết 6', time: '11:40–12:30', session: 'morning' },
  { num: 7, label: 'Tiết 7', time: '13:00–13:50', session: 'afternoon' },
  { num: 8, label: 'Tiết 8', time: '13:55–14:45', session: 'afternoon' },
  { num: 9, label: 'Tiết 9', time: '14:50–15:40', session: 'afternoon' },
  { num: 10, label: 'Tiết 10', time: '15:50–16:40', session: 'afternoon' },
  { num: 11, label: 'Tiết 11', time: '16:45–17:35', session: 'afternoon' },
  { num: 12, label: 'Tiết 12', time: '17:40–18:30', session: 'afternoon' },
]

export default function TimetableGrid({
  weeklySessions = [],
  isAdmin = false,
  members = [],
  onRegister,
  onCancelRegister,
  onAssign,
  onApprove,
  currentUserId,
}) {
  const [selectedMember, setSelectedMember] = useState({})
  const [isCompact, setIsCompact] = useState(true)

  // Index sessions by day and start_period
  const sessionMap = {}
  const coveredCells = new Set() // Set of `${day}_${period}` that are covered by rowSpan

  weeklySessions.forEach(s => {
    const slot = s.schedule_slot
    if (!slot) return
    const day = slot.day_of_week
    const startP = slot.start_period
    const endP = slot.end_period

    sessionMap[`${day}_${startP}`] = s

    for (let p = startP + 1; p <= endP; p++) {
      coveredCells.add(`${day}_${p}`)
    }
  })

  // Dynamic values based on view mode
  const cellHeightMultiplier = isCompact ? 34 : 50
  const thPadding = isCompact ? '6px 4px' : '12px 8px'
  const cardPadding = isCompact ? '4px 6px' : '8px'
  const subjectFontSize = isCompact ? '0.75rem' : '0.85rem'
  const detailsFontSize = isCompact ? '0.64rem' : '0.72rem'
  const badgeFontSize = isCompact ? '0.6rem' : '0.65rem'
  const memberFontSize = isCompact ? '0.68rem' : '0.75rem'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* View Mode Bar */}
      <div className="flex flex-between align-center" style={{ padding: '0 4px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🔍 Chế độ hiển thị: <strong style={{ color: 'var(--text-primary)' }}>{isCompact ? 'Thu nhỏ (Tổng quan)' : 'Tiêu chuẩn'}</strong>
        </span>
        <button
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          onClick={() => setIsCompact(prev => !prev)}
        >
          {isCompact ? '🔍 Xem Phóng to' : '🔎 Xem Thu nhỏ'}
        </button>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isCompact ? 760 : 900, textAlign: 'center' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: thPadding, width: isCompact ? 75 : 100, fontSize: isCompact ? '0.75rem' : '0.85rem' }}>Tiết / Giờ</th>
              {DAYS.map(d => (
                <th key={d.num} style={{ padding: thPadding, fontSize: isCompact ? '0.8rem' : '0.9rem', width: '13%' }}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => {
              return (
                <tr key={p.num} style={{
                  borderBottom: p.num === 6 ? '3px solid var(--primary)' : '1px solid var(--border)',
                  background: p.num % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                }}>
                  {/* Period Column Header */}
                  <td style={{
                    padding: isCompact ? '4px 2px' : '8px 4px',
                    background: 'var(--surface-hover)',
                    borderRight: '1px solid var(--border)',
                    fontSize: isCompact ? '0.7rem' : '0.75rem',
                    fontWeight: 600,
                  }}>
                    <div style={{ color: 'var(--text-muted)' }}>{p.label}</div>
                    <div style={{ fontSize: isCompact ? '0.62rem' : '0.7rem', color: 'var(--primary-light)' }}>{p.time}</div>
                  </td>

                  {/* Day Columns */}
                  {DAYS.map(d => {
                    const key = `${d.num}_${p.num}`
                    if (coveredCells.has(key)) return null // Skip spanned cell

                    const session = sessionMap[key]
                    if (!session) {
                      return (
                        <td key={d.num} style={{ borderRight: '1px solid var(--border)', padding: isCompact ? 2 : 4, background: 'rgba(0,0,0,0.05)' }}>
                          <div style={{ height: isCompact ? 24 : 40, opacity: 0.15, fontSize: '0.7rem' }}>—</div>
                        </td>
                      )
                    }

                    const slot = session.schedule_slot
                    const rowSpan = slot.end_period - slot.start_period + 1
                    const member = session.assigned_member
                    const isMine = currentUserId && member?.id === currentUserId

                    // Card styling based on status
                    let borderClr = 'var(--border)'
                    let bgClr = 'var(--surface-hover)'
                    let statusBadge = { label: 'Trống', cls: 'badge-open', icon: '🔵' }

                    if (session.status === 'approved') {
                      borderClr = 'var(--accent-green)'
                      bgClr = 'rgba(16,185,129,0.1)'
                      statusBadge = { label: 'Đã giao', cls: 'badge-verified', icon: '🟢' }
                    } else if (session.status === 'registered') {
                      borderClr = 'var(--accent)'
                      bgClr = 'rgba(245,158,11,0.1)'
                      statusBadge = { label: 'Chờ duyệt', cls: 'badge-registered', icon: '🟠' }
                    }

                    if (isMine) {
                      borderClr = 'var(--primary)'
                      bgClr = 'rgba(99,102,241,0.15)'
                    }

                    return (
                      <td
                        key={d.num}
                        rowSpan={rowSpan}
                        style={{
                          verticalAlign: 'top',
                          padding: isCompact ? 3 : 6,
                          borderRight: '1px solid var(--border)',
                          height: cellHeightMultiplier * rowSpan,
                        }}
                      >
                        <div
                          className="card"
                          style={{
                            height: '100%',
                            padding: cardPadding,
                            margin: 0,
                            textAlign: 'left',
                            background: bgClr,
                            borderLeft: `3px solid ${borderClr}`,
                            fontSize: detailsFontSize,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div>
                            <div className="flex flex-between align-center" style={{ marginBottom: 2, gap: 2 }}>
                              <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: subjectFontSize, lineHeight: 1.2 }}>
                                {slot.subject?.name}
                              </span>
                              <span className={`badge ${statusBadge.cls}`} style={{ fontSize: badgeFontSize, padding: '1px 5px', flexShrink: 0 }}>
                                {statusBadge.icon} {statusBadge.label}
                              </span>
                            </div>

                            <div style={{ fontSize: detailsFontSize, color: 'var(--text-muted)', marginBottom: 2 }}>
                              📌 {slot.subject?.code} | 🏫 {slot.classroom}
                            </div>

                            {/* Member assignment info */}
                            {member ? (
                              <div style={{
                                background: 'var(--surface)',
                                borderRadius: 4,
                                padding: isCompact ? '2px 4px' : '4px 6px',
                                marginTop: 2,
                                fontWeight: 700,
                                color: isMine ? 'var(--primary-light)' : 'var(--accent-green)',
                                fontSize: memberFontSize,
                              }}>
                                👤 {member.full_name} {isMine && '(Tôi)'}
                              </div>
                            ) : (
                              <div style={{ fontSize: detailsFontSize, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                                ⚪ Chưa giao
                              </div>
                            )}
                          </div>

                          {/* Actions for Admin / Member */}
                          <div style={{ marginTop: isCompact ? 3 : 6 }}>
                            {isAdmin ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {session.status === 'registered' && (
                                  <div className="flex gap-1">
                                    <button className="btn btn-success btn-sm" style={{ padding: '2px 4px', fontSize: '0.65rem', flex: 1 }}
                                      onClick={() => onApprove && onApprove(session.id, true)}>
                                      ✅ Duyệt
                                    </button>
                                    <button className="btn btn-danger btn-sm" style={{ padding: '2px 4px', fontSize: '0.65rem', flex: 1 }}
                                      onClick={() => onApprove && onApprove(session.id, false)}>
                                      ❌ Hủy
                                    </button>
                                  </div>
                                )}

                                {/* Admin Direct Assign Select */}
                                <div style={{ marginTop: 2 }}>
                                  <select
                                    style={{
                                      width: '100%',
                                      fontSize: '0.65rem',
                                      padding: '2px 3px',
                                      borderRadius: 4,
                                      background: 'var(--surface)',
                                      color: 'var(--text)',
                                      border: '1px solid var(--border)',
                                    }}
                                    value={selectedMember[session.id] || member?.id || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setSelectedMember(sm => ({ ...sm, [session.id]: val }))
                                      if (val && onAssign) onAssign(session.id, val)
                                    }}
                                  >
                                    <option value="">-- Giao người --</option>
                                    {members.map(m => (
                                      <option key={m.id} value={m.id}>
                                        👤 {m.full_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const myReg = session.registrations?.find(r => r.member_id === currentUserId)
                                  if (myReg) {
                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span className="badge badge-registered" style={{ fontSize: '0.62rem', width: '100%', justifyContent: 'center' }}>
                                          🟠 Đã đăng ký
                                        </span>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          style={{ width: '100%', padding: '1px 4px', fontSize: '0.62rem', justifyContent: 'center' }}
                                          onClick={() => onCancelRegister && onCancelRegister(session.id)}
                                        >
                                          ❌ Hủy đăng ký
                                        </button>
                                      </div>
                                    )
                                  }
                                  if (session.status === 'open' || session.status === 'registered') {
                                    const applicantCount = session.registrations?.length || 0
                                    return (
                                      <button
                                        className="btn btn-primary btn-sm"
                                        style={{ width: '100%', padding: '2px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
                                        onClick={() => onRegister && onRegister(session.id)}
                                      >
                                        📝 Đăng ký {applicantCount > 0 ? `(${applicantCount})` : ''}
                                      </button>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            )}

                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

