import { useEffect, useState } from 'react'
import { memberAPI } from '../../api'
import toast from 'react-hot-toast'

export default function Earnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    memberAPI.getEarnings().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>💰 Thu nhập</h1>
        <p>Thống kê tiết học và tiền lương của bạn</p>
      </div>

      {/* Summary */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', borderColor: 'rgba(16,185,129,0.2)' }}>
          <div className="label">✅ Đã nhận</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>
            {(data?.total_earned || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="label">⏳ Chờ nhận</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', marginTop: 8 }}>
            {(data?.pending || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="h3" style={{ marginBottom: 16 }}>📋 Lịch sử thanh toán</h2>
        {(!data?.payments || data.payments.length === 0) ? (
          <div className="empty-state">
            <div className="icon">💸</div>
            <h3>Chưa có dữ liệu thanh toán</h3>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Ca học</th><th>Ngày</th><th>Số tiết</th><th>Số tiền</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {data.payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.weekly_session?.schedule_slot?.subject?.name || '—'}</td>
                    <td>{p.weekly_session?.session_date ? new Date(p.weekly_session.session_date).toLocaleDateString('vi-VN') : '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.periods_completed}</td>
                    <td className="money">{p.amount.toLocaleString('vi-VN')}đ</td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-verified' : 'badge-pending'}`}>
                        {p.status === 'paid' ? '✅ Đã nhận' : '⏳ Chờ nhận'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
