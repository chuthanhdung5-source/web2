import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { getImageUrl } from '../../api/client'
import toast from 'react-hot-toast'

const getBankCode = (bankName) => {
  if (!bankName) return 'mb'
  const str = bankName.toLowerCase()
  if (str.includes('vietcombank') || str.includes('vcb')) return 'vcb'
  if (str.includes('techcombank') || str.includes('tcb')) return 'tcb'
  if (str.includes('acb')) return 'acb'
  if (str.includes('vpbank') || str.includes('vpb')) return 'vpb'
  if (str.includes('tpbank') || str.includes('tpb')) return 'tpb'
  if (str.includes('bidv')) return 'bidv'
  if (str.includes('agribank')) return 'vbag'
  if (str.includes('vietin')) return 'vtb'
  if (str.includes('sacombank')) return 'stb'
  return 'mb'
}

export default function PaymentManager() {
  const [payments, setPayments] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [payModal, setPayModal] = useState(null)
  const [qrImageError, setQrImageError] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = (status) => {
    setLoading(true)
    adminAPI.getPayments(status)
      .then(r => setPayments(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(filter), [filter])

  const markPaid = async (id) => {
    setSubmitting(true)
    try {
      await adminAPI.markPaid(id, notes)
      toast.success('💰 Đã xác nhận xuất ngân khố ban bổng lộc thành công!')
      setPayModal(null)
      setNotes('')
      load(filter)
    } catch { toast.error('Có lỗi xảy ra khi xuất ngân khố') }
    finally { setSubmitting(false) }
  }

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h1>💰 Quản Lý Bổng Lộc Linh Thạch Ngân Khố</h1>
        <p>Tổng quỹ ({filter === 'pending' ? 'Chờ ban bổng lộc' : 'Đã xuất ngân khố'}): <strong style={{ color: 'var(--accent-green)', fontSize: '1.25rem' }}>{totalAmount.toLocaleString('vi-VN')}đ</strong></p>
      </div>

      <div className="flex gap-3" style={{ marginBottom: 24 }}>
        {['pending', 'paid'].map(s => (
          <button key={s} id={`filter-${s}`}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}>
            {s === 'pending' ? '⏳ Chờ Ban Bổng Lộc' : '✅ Đã Xuất Ngân Khố'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : payments.length === 0 ? (
        <div className="empty-state"><div className="icon">💸</div><h3>Không có dữ liệu bổng lộc ngân khố</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Chư Vị Tu Giả</th>
                <th>Tiên Trang Thần Phù</th>
                <th>Tràng Hộ Đạo</th>
                <th>Thời Khắc</th>
                <th>Linh Thạch Quy Đổi</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const member = p.member || p.weekly_session?.assigned_member
                const bankCode = getBankCode(member?.bank_name)
                const vietQRUrl = member?.bank_account_no ?
                  `https://img.vietqr.io/image/${bankCode}-${member.bank_account_no}-compact2.png?amount=${p.amount}&addInfo=HOC%20HO%20CA%20${p.weekly_session_id}&accountName=${encodeURIComponent(member?.bank_account_name || '')}` : null

                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{member?.full_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{member?.username} | {member?.phone}</div>
                    </td>

                    <td>
                      {member?.bank_account_no ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{member.bank_name}</div>
                          <div style={{ fontSize: '0.875rem' }}>STK: <strong>{member.bank_account_no}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.bank_account_name}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>⚠️ Chưa nộp Tiên Trang</span>
                      )}
                    </td>

                    <td>
                      <div>{p.weekly_session?.schedule_slot?.subject?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.weekly_session?.session_date && new Date(p.weekly_session.session_date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    <td style={{ fontWeight: 700, textAlign: 'center' }}>{p.periods_completed} khắc</td>
                    <td className="money" style={{ fontSize: '1rem', fontWeight: 800 }}>{p.amount.toLocaleString('vi-VN')}đ</td>

                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-verified' : 'badge-pending'}`}>
                        {p.status === 'paid' ? '✅ Đã Xuất Khố' : '⏳ Chờ Giải Ngân'}
                      </span>
                    </td>

                    <td>
                      <button
                        id={`pay-${p.id}`}
                        className={`btn ${p.status === 'paid' ? 'btn-secondary btn-sm' : 'btn-success btn-sm'}`}
                        onClick={() => { setQrImageError(false); setPayModal({ payment: p, member, vietQRUrl }); }}
                      >
                        {p.status === 'paid' ? '👁 Xem chi tiết' : '💳 Xuất Ngân Khố Ngay'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ marginBottom: 16 }}>💳 Phát Bổng Lộc Hộ Đạo Tu Chân</h3>

            <div style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                👤 Đệ tử nhận bổng lộc: <strong>{payModal.member?.full_name}</strong> (@{payModal.member?.username})
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                📚 Pháp môn hoàn tất: <strong>{payModal.payment?.weekly_session?.schedule_slot?.subject?.name}</strong> ({payModal.payment?.periods_completed} khắc)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>
                💰 Số lượng linh thạch quy đổi: {payModal.payment?.amount.toLocaleString('vi-VN')}đ
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              {payModal.member?.qr_code_url && !qrImageError ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#333', fontWeight: 700, marginBottom: 8 }}>🖼️ THẦN PHÙ TIÊN TRANG ĐỆ TỬ</div>
                  <img
                    src={getImageUrl(payModal.member.qr_code_url)}
                    alt="Member QR"
                    onError={() => setQrImageError(true)}
                    style={{ maxWidth: 220, maxHeight: 220, objectFit: 'contain' }}
                  />
                </div>
              ) : payModal.vietQRUrl ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#333', fontWeight: 700, marginBottom: 8 }}>
                    {qrImageError ? '⚡ THẦN PHÙ TỰ ĐỘNG SINH' : '⚡ THẦN PHÙ VIETQR TỰ ĐỘNG KHAI MỞ'}
                  </div>
                  <img src={payModal.vietQRUrl} alt="VietQR" style={{ maxWidth: 240, maxHeight: 240, objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ color: 'var(--accent-red)', padding: 16 }}>⚠️ Đệ tử này chưa nộp Thần Phù hoặc STK Tiên Trang.</div>
              )}
            </div>

            {payModal.member?.bank_account_no && (
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div>🏦 Tiên Trang: <strong>{payModal.member.bank_name}</strong></div>
                <div>🔢 Số tài khoản / Thần phù: <strong>{payModal.member.bank_account_no}</strong></div>
                <div>👤 Danh xưng thụ hưởng: <strong>{payModal.member.bank_account_name}</strong></div>
              </div>
            )}

            {payModal.payment?.status === 'pending' && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Chiếu chỉ giải ngân</label>
                <input className="form-input" placeholder="Ví dụ: Đã truyền tống qua MB Bank canh ba" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            )}

            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Thu Hồi</button>
              {payModal.payment?.status === 'pending' && (
                <button
                  className="btn btn-success"
                  disabled={submitting}
                  onClick={() => markPaid(payModal.payment.id)}
                >
                  {submitting ? '⏳ Đang truyền tống...' : '✅ Xác Nhận Đã Xuất Ngân Khố'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
