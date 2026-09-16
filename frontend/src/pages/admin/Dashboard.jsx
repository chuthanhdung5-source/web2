import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const loadStats = (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Lỗi tải dữ liệu thống kê'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  return (
    <div>
      <div className="page-header flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>👋 Xin chào, Admin!</h1>
          <p>Tổng quan hệ thống học hộ hôm nay (cập nhật theo thời gian thực)</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadStats(true)}
          disabled={refreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {refreshing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '🔄'}
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon="👥" label="Tổng thành viên" value={stats?.total_members || 0} color="var(--primary)" />
        <StatCard icon="📅" label="Ca học hệ thống" value={stats?.total_sessions || 0} color="var(--accent-blue)" />
        <StatCard icon="⏳" label="Ca chờ duyệt" value={stats?.pending_approval || 0} color="var(--accent)" urgent />
        <StatCard icon="📸" label="Ảnh check-in chờ duyệt" value={stats?.pending_checkins || 0} color="#ec4899" urgent />
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card card-elevated stat-card-compact">
          <div className="label">✅ Ca đã hoàn thành</div>
          <div className="stat-value-highlight green">
            {stats?.completed_sessions || 0}
          </div>
        </div>
        <div className="card card-elevated stat-card-compact">
          <div className="label">💸 Tổng tiền đã trả</div>
          <div className="stat-value-highlight green">
            {(stats?.total_paid_amount || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>
        <div className="card card-elevated stat-card-compact">
          <div className="label">⏳ Đang chờ thanh toán</div>
          <div className="stat-value-highlight amber">
            {(stats?.total_pending_amount || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <h3 className="h4" style={{ marginBottom: 12 }}>⚡ Thao tác nhanh</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <Link to="/admin/sessions" className="btn btn-primary btn-sm">
            ✅ Duyệt ca học ({stats?.pending_approval || 0})
          </Link>
          <Link to="/admin/checkins" className="btn btn-secondary btn-sm">
            📸 Xem ảnh check-in ({stats?.pending_checkins || 0})
          </Link>
          <Link to="/admin/payments" className="btn btn-secondary btn-sm">💰 Quản lý thanh toán</Link>
          <Link to="/admin/schedule" className="btn btn-secondary btn-sm">📅 Tạo ca tuần này</Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, urgent }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div className="stat-card-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={{ color: urgent && value > 0 ? 'var(--accent)' : color }}>
        {value}
      </div>
    </div>
  )
}
