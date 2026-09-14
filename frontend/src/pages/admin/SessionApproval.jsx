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
      .catch(() => toast.error('Lỗi tải danh sách ca học chờ duyệt'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleApproveMember = async (sessionId, memberId, memberName) => {
    try {
      spendDiamonds(100, `Hạ sắc lệnh duyệt ca cho ${memberName}`)
      await adminAPI.approveSession(sessionId, true, memberId)
      toast.success(`✅ Đã duyệt ca học cho ${memberName}!`)
      load()
    } catch {
      toast.error('Lỗi khi duyệt ca học')
    }
  }

  const handleRejectAll = async (sessionId) => {
    try {
      await adminAPI.approveSession(sessionId, false)
      toast.success('❌ Đã từ chối tất cả yêu cầu đăng ký')
      load()
    } catch {
      toast.error('Lỗi khi từ chối ca học')
    }
  }

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>✅ Duyệt ca học & Phụ trách</h1>
        <p>{sessions.length} ca đang có thành viên đăng ký chờ duyệt (được sắp xếp theo thứ tự đăng ký trước/sau)</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎉</div>
          <h3>Không có ca nào chờ duyệt</h3>
          <p>Tất cả yêu cầu đăng ký đã được xử lý</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sessions.map(s => {
            const applicants = s.registrations || []

            return (
              <div key={s.id} className="card card-elevated" style={{ padding: 20 }}>
                {/* Header Ca học */}
                <div className="flex flex-between align-center" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      🎓 {s.schedule_slot?.subject?.name} ({s.schedule_slot?.subject?.code})
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      🗓️ {DAY_NAMES[s.schedule_slot?.day_of_week]}, Ngày: <strong>{new Date(s.session_date).toLocaleDateString('vi-VN')}</strong> &nbsp;|&nbsp;
                      ⏰ Tiết {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period} ({s.schedule_slot?.start_time}–{s.schedule_slot?.end_time}) &nbsp;|&nbsp;
                      🏫 Phòng: <strong>{s.schedule_slot?.classroom}</strong>
                    </div>
                  </div>

                  <div className="flex align-center gap-2">
                    <span className="badge badge-registered" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                      📋 {applicants.length > 0 ? `${applicants.length} ứng viên chờ duyệt` : 'Đang chờ duyệt'}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRejectAll(s.id)}
                    >
                      ❌ Từ chối tất cả
                    </button>
                  </div>
                </div>

                {/* Danh sách người đăng ký theo thứ tự */}
                <div style={{ background: 'var(--surface-hover)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--primary-light)' }}>
                    👥 Danh sách ứng viên theo thứ tự đăng ký:
                  </div>

                  {applicants.length === 0 ? (
                    <div className="flex flex-between align-center" style={{ padding: 8, background: 'var(--surface)', borderRadius: 6 }}>
                      <div className="flex align-center gap-3">
                        <div className="avatar" style={{ width: 32, height: 32 }}>
                          {s.assigned_member?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.assigned_member?.full_name || 'Thành viên'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Đăng ký lúc: {s.registered_at ? new Date(s.registered_at).toLocaleString('vi-VN') : '--'}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveMember(s.id, s.assigned_member?.id, s.assigned_member?.full_name)}
                      >
                        ✅ Duyệt người này
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
                              {/* Order Badge */}
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: 12,
                                background: isFirst ? 'var(--primary)' : 'var(--border-strong)',
                                color: 'white'
                              }}>
                                #{index + 1} {isFirst && '(Sớm nhất)'}
                              </span>

                              <div className="avatar" style={{ width: 34, height: 34 }}>
                                {m.full_name?.charAt(0) || 'U'}
                              </div>

                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                  {m.full_name} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>(@{m.username})</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ⏰ Đăng ký lúc: {reg.registered_at ? new Date(reg.registered_at).toLocaleString('vi-VN') : '--'}
                                </div>
                              </div>
                            </div>

                            <button
                              id={`approve-${s.id}-${m.id}`}
                              className="btn btn-success btn-sm"
                              onClick={() => handleApproveMember(s.id, m.id, m.full_name)}
                            >
                              ✅ Duyệt cho {m.full_name?.split(' ').pop()}
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
