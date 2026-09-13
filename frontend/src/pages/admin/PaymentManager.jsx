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
      toast.success('💰 Đã xác nhận chuyển khoản thành công!')
      setPayModal(null)
      setNotes('')
      load(filter)
    } catch { toast.error('Có lỗi xảy ra khi xác nhận thanh toán') }
    finally { setSubmitting(false) }
  }

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h1>💰 Quản lý thanh toán</h1>
        <p>Tổng tiền ({filter === 'pending' ? 'Chờ thanh toán' : 'Đã thanh toán'}): <strong style={{ color: 'var(--accent-green)', fontSize: '1.25rem' }}>{totalAmount.toLocaleString('vi-VN')}đ</strong></p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-3" style={{ marginBottom: 24 }}>
        {['pending', 'paid'].map(s => (
          <button key={s} id={`filter-${s}`}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}>
            {s === 'pending' ? '⏳ Chờ thanh toán' : '✅ Đã thanh toán'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : payments.length === 0 ? (
        <div className="empty-state"><div className="icon">💸</div><h3>Không có dữ liệu thanh toán</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Thông tin Ngân hàng / STK</th>
                <th>Ca học</th>
                <th>Số tiết</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>⚠️ Chưa nộp STK</span>
                      )}
                    </td>

                    <td>
                      <div>{p.weekly_session?.schedule_slot?.subject?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.weekly_session?.session_date && new Date(p.weekly_session.session_date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    <td style={{ fontWeight: 700, textAlign: 'center' }}>{p.periods_completed} tiết</td>
                    <td className="money" style={{ fontSize: '1rem', fontWeight: 800 }}>{p.amount.toLocaleString('vi-VN')}đ</td>

                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-verified' : 'badge-pending'}`}>
                        {p.status === 'paid' ? '✅ Đã trả' : '⏳ Chờ trả'}
                      </span>
                    </td>

                    <td>
                      <button
                        id={`pay-${p.id}`}
                        className={`btn ${p.status === 'paid' ? 'btn-secondary btn-sm' : 'btn-success btn-sm'}`}
                        onClick={() => setPayModal({ payment: p, member, vietQRUrl })}
                      >
                        {p.status === 'paid' ? '👁 Xem chi tiết' : '💳 Thanh toán ngay'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ marginBottom: 16 }}>💳 Thanh toán tiền đi học hộ</h3>

            <div style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                👤 Người nhận: <strong>{payModal.member?.full_name}</strong> (@{payModal.member?.username})
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                📚 Môn học: <strong>{payModal.payment?.weekly_session?.schedule_slot?.subject?.name}</strong> ({payModal.payment?.periods_completed} tiết)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>
                💰 Số tiền cần chuyển: {payModal.payment?.amount.toLocaleString('vi-VN')}đ
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{ textAlign: 'center', marginBottom: 16, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              {payModal.member?.qr_code_url ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#333', fontWeight: 700, marginBottom: 8 }}>🖼️ MÃ QR CHUYỂN KHOẢN (DO THÀNH VIÊN TẢI LÊN)</div>
                  <img src={getImageUrl(payModal.member.qr_code_url)} alt="Member QR" style={{ maxWidth: 220, maxHeight: 220, objectFit: 'contain' }} />
                </div>
              ) : payModal.vietQRUrl ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#333', fontWeight: 700, marginBottom: 8 }}>⚡ MÃ VIETQR TỰ ĐỘNG SINH (MỞ APP NGÂN HÀNG QUÉT)</div>
                  <img src={payModal.vietQRUrl} alt="VietQR" style={{ maxWidth: 240, maxHeight: 240, objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ color: 'var(--accent-red)', padding: 16 }}>⚠️ Thành viên này chưa nộp Mã QR hoặc STK Ngân hàng.</div>
              )}
            </div>

            {/* Bank details breakdown */}
            {payModal.member?.bank_account_no && (
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div>🏦 Ngân hàng: <strong>{payModal.member.bank_name}</strong></div>
                <div>🔢 Số tài khoản / Ví: <strong>{payModal.member.bank_account_no}</strong></div>
                <div>👤 Chủ tài khoản: <strong>{payModal.member.bank_account_name}</strong></div>
              </div>
            )}

            {payModal.payment?.status === 'pending' && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Ghi chú thanh toán (không bắt buộc)</label>
                <input className="form-input" placeholder="Ví dụ: Đã chuyển qua MB Bank lúc 09:00" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            )}

            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Đóng</button>
              {payModal.payment?.status === 'pending' && (
                <button
                  className="btn btn-success"
                  disabled={submitting}
                  onClick={() => markPaid(payModal.payment.id)}
                >
                  {submitting ? '⏳ Đang lưu...' : '✅ Xác nhận đã chuyển khoản'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
