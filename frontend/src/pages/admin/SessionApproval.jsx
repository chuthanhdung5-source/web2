import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { useDouluo } from '../../context/DouluoContext'
import toast from 'react-hot-toast'

const DAY_NAMES = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' }

export default function SessionApproval() {
  const { spendDiamonds } = useDouluo()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminAPI.getPendingSessions()
      .then(r => setSessions(r.data))
      .catch(() => toast.error('Lỗi tải danh sách tràng thí luyện chờ phê'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleApproveMember = async (sessionId, memberId, memberName) => {
    try {
      spendDiamonds(100, `Hạ sắc lệnh ban quyền hộ đạo cho ${memberName}`)
      await adminAPI.approveSession(sessionId, true, memberId)
      toast.success(`✅ Đã ban sắc lệnh hộ đạo cho ${memberName}!`)
      load()
    } catch {
      toast.error('Lỗi khi chuẩn phê tràng thí luyện')
    }
  }

  const handleRejectAll = async (sessionId) => {
    try {
      await adminAPI.approveSession(sessionId, false)
      toast.success('❌ Đã bác bỏ tất cả thỉnh mệnh')
      load()
    } catch {
      toast.error('Lỗi khi bác bỏ')
    }
  }

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>✅ Chuẩn Phê Thí Luyện & Phụ Trách Hộ Đạo</h1>
        <p>{sessions.length} tràng đang có đệ tử thỉnh mệnh chờ Giáo Hoàng chuẩn phê</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎉</div>
          <h3>Không có tràng thí luyện nào đang chờ chuẩn phê</h3>
          <p>Tất cả thỉnh mệnh của môn hạ đã được sắc phong xử lý viên mãn</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sessions.map(s => {
            const applicants = s.registrations || []

            return (
              <div key={s.id} className="card card-elevated" style={{ padding: 20 }}>
                <div className="flex flex-between align-center" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      🎓 {s.schedule_slot?.subject?.name} ({s.schedule_slot?.subject?.code})
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      🗓️ {DAY_NAMES[s.schedule_slot?.day_of_week]}, Ngày: <strong>{new Date(s.session_date).toLocaleDateString('vi-VN')}</strong> &nbsp;|&nbsp;
                      ⏰ Khắc {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period} ({s.schedule_slot?.start_time}–{s.schedule_slot?.end_time}) &nbsp;|&nbsp;
                      🏰 Đạo Trường: <strong>{s.schedule_slot?.classroom}</strong>
                    </div>
                  </div>

                  <div className="flex align-center gap-2">
                    <span className="badge badge-registered" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                      📋 {applicants.length > 0 ? `${applicants.length} đệ tử thỉnh mệnh` : 'Đang chờ chuẩn phê'}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRejectAll(s.id)}
                    >
                      ❌ Bác Bỏ Toàn Bộ
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-hover)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--primary-light)' }}>
                    👥 Danh sách đệ tử theo thứ tự dâng sớ thỉnh mệnh:
                  </div>

                  {applicants.length === 0 ? (
                    <div className="flex flex-between align-center" style={{ padding: 8, background: 'var(--surface)', borderRadius: 6 }}>
                      <div className="flex align-center gap-3">
                        <div className="avatar" style={{ width: 32, height: 32 }}>
                          {s.assigned_member?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.assigned_member?.full_name || 'Đệ tử'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Thỉnh mệnh lúc: {s.registered_at ? new Date(s.registered_at).toLocaleString('vi-VN') : '--'}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveMember(s.id, s.assigned_member?.id, s.assigned_member?.full_name)}
                      >
                        ✅ Ban Sắc Lệnh
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {applicants.map((reg, index) => {
                        const m = reg.member || {}
                        const isFirst = index === 0

                        return (
                          <div
                            key={reg.id || index}
                            className="flex flex-between align-center"
                            style={{
                              padding: '10px 14px',
                              background: isFirst ? 'rgba(124,106,245,0.1)' : 'var(--surface)',
                              border: isFirst ? '1px solid rgba(124,106,245,0.3)' : '1px solid var(--border)',
                              borderRadius: 8,
                              flexWrap: 'wrap',
                              gap: 8
                            }}
                          >
                            <div className="flex align-center gap-3">
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: 12,
                                background: isFirst ? 'var(--primary)' : 'var(--border-strong)',
                                color: 'white'
                              }}>
                                #{index + 1} {isFirst && '• Tiên Phong'}
                              </span>

                              <div className="avatar" style={{ width: 34, height: 34 }}>
                                {m.full_name?.charAt(0) || 'U'}
                              </div>

                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                  {m.full_name} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>(@{m.username})</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ⏰ Thỉnh mệnh lúc: {reg.registered_at ? new Date(reg.registered_at).toLocaleString('vi-VN') : '--'}
                                </div>
                              </div>
                            </div>

                            <button
                              id={`approve-${s.id}-${m.id}`}
                              className="btn btn-success btn-sm"
                              onClick={() => handleApproveMember(s.id, m.id, m.full_name)}
                            >
                              ✅ Ban Sắc Lệnh Cho {m.full_name?.split(' ').pop()}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
