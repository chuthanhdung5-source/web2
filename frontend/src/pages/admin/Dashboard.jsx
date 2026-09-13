import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Lỗi tải dữ liệu'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1>👋 Xin chào, Admin!</h1>
        <p>Tổng quan hệ thống học hộ hôm nay</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        <StatCard icon="👥" label="Tổng thành viên" value={stats?.total_members || 0} color="var(--primary)" />
        <StatCard icon="📅" label="Ca học trong hệ thống" value={stats?.total_sessions || 0} color="var(--accent-blue)" />
        <StatCard icon="⏳" label="Chờ duyệt" value={stats?.pending_approval || 0} color="var(--accent)" urgent />
        <StatCard icon="✅" label="Ca đã hoàn thành" value={stats?.completed_sessions || 0} color="var(--accent-green)" />
      </div>

      {/* Money stats */}
      <div className="grid grid-2" style={{ marginBottom: 32 }}>
        <div className="card card-elevated">
          <div className="label">💸 Tổng tiền đã trả</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>
            {(stats?.total_paid_amount || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>
        <div className="card card-elevated">
          <div className="label">⏳ Đang chờ thanh toán</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', marginTop: 8 }}>
            {(stats?.total_pending_amount || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="h3" style={{ marginBottom: 16 }}>⚡ Thao tác nhanh</h3>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <Link to="/admin/sessions" className="btn btn-primary">✅ Duyệt ca học ({stats?.pending_approval || 0})</Link>
          <Link to="/admin/checkins" className="btn btn-secondary">📸 Xem ảnh check-in</Link>
          <Link to="/admin/payments" className="btn btn-secondary">💰 Quản lý thanh toán</Link>
          <Link to="/admin/schedule" className="btn btn-secondary">📅 Tạo ca tuần này</Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, urgent }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div className="stat-value" style={{ color: urgent && value > 0 ? 'var(--accent)' : color }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
