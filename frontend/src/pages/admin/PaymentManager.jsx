import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function PaymentManager() {
  const [payments, setPayments] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  const load = (status) => {
    setLoading(true)
    adminAPI.getPayments(status)
      .then(r => setPayments(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(filter), [filter])

  const markPaid = async (id) => {
    try {
      await adminAPI.markPaid(id)
      toast.success('💰 Đã đánh dấu thanh toán!')
      load(filter)
    } catch { toast.error('Có lỗi xảy ra') }
  }

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h1>💰 Quản lý thanh toán</h1>
        <p>Tổng: <strong style={{ color: 'var(--accent-green)' }}>{totalAmount.toLocaleString('vi-VN')}đ</strong></p>
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
        <div className="empty-state"><div className="icon">💸</div><h3>Không có dữ liệu</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Ca học</th>
                <th>Số tiết</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                {filter === 'pending' && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.weekly_session?.assigned_member?.full_name || '—'}</td>
                  <td>
                    <div>{p.weekly_session?.schedule_slot?.subject?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.weekly_session?.session_date && new Date(p.weekly_session.session_date).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, textAlign: 'center' }}>{p.periods_completed}</td>
                  <td className="money">{p.amount.toLocaleString('vi-VN')}đ</td>
                  <td>
                    <span className={`badge ${p.status === 'paid' ? 'badge-verified' : 'badge-pending'}`}>
                      {p.status === 'paid' ? 'Đã trả' : 'Chờ trả'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString('vi-VN') : new Date(p.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  {filter === 'pending' && (
                    <td>
                      <button id={`pay-${p.id}`} className="btn btn-success btn-sm" onClick={() => markPaid(p.id)}>
                        💰 Đánh dấu đã trả
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
