import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'
import './Dashboard.css'

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
    <div className="dashboard-page">
      <div className="imperial-banner">
        <span className="banner-decor-dragon-left">🐉</span>
        <div className="banner-content">
          <h1 className="banner-title">👋 Xin chào, Chưởng Môn!</h1>
          <p className="banner-subtitle">Tổng quan hệ thống học hộ hôm nay (cập nhật theo thời gian thực)</p>
        </div>
        <button
          className="btn-talisman-refresh"
          onClick={() => loadStats(true)}
          disabled={refreshing}
        >
          {refreshing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <span>📜</span>}
          <span>Làm mới số liệu</span>
        </button>
        <span className="banner-decor-dragon-right">🐉</span>
      </div>

      <div className="grid grid-4">
        <div className="celestial-stat gold-border">
          <div className="celestial-stat-icon gold-glow">👥</div>
          <div className="celestial-stat-data">
            <div className="celestial-stat-label">Tổng thành viên</div>
            <div className="celestial-stat-number gold-text">{stats?.total_members || 0}</div>
          </div>
        </div>

        <div className="celestial-stat blue-border">
          <div className="celestial-stat-icon blue-glow">📅</div>
          <div className="celestial-stat-data">
            <div className="celestial-stat-label">Ca học hệ thống</div>
            <div className="celestial-stat-number blue-text">{stats?.total_sessions || 0}</div>
          </div>
        </div>

        <div className="celestial-stat purple-border">
          <div className="celestial-stat-icon purple-glow">⏳</div>
          <div className="celestial-stat-data">
            <div className="celestial-stat-label">Ca chờ duyệt</div>
            <div className="celestial-stat-number purple-text">{stats?.pending_approval || 0}</div>
          </div>
        </div>

        <div className="celestial-stat pink-border">
          <div className="celestial-stat-icon pink-glow">📸</div>
          <div className="celestial-stat-data">
            <div className="celestial-stat-label">Check-in chờ duyệt</div>
            <div className="celestial-stat-number pink-text">{stats?.pending_checkins || 0}</div>
          </div>
        </div>
      </div>

      <div className="revenue-panel">
        <div className="revenue-panel-inner">
          <div className="revenue-panel-left">
            <div className="revenue-badge">💎 LINH THẠCH NGÂN KHỐ</div>
            <div className="revenue-big-val">{(stats?.total_paid_amount || 0).toLocaleString('vi-VN')}đ</div>
            <div className="revenue-sub-val">
              Đang chờ thanh toán: <span className="amber-text">{(stats?.total_pending_amount || 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <div className="revenue-panel-right">
            <div className="revenue-metric-chip">
              <span className="chip-icon">✅</span>
              <div>
                <div className="chip-label">Ca đã hoàn thành</div>
                <div className="chip-number">{stats?.completed_sessions || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="altar-platform-container">
        <div className="altar-header">
          <span>⚡</span>
          <span>Thao tác nhanh</span>
        </div>

        <div className="altar-grid">
          <Link to="/admin/sessions" className="altar-btn green-btn">
            <span className="altar-btn-icon">🗡️</span>
            <span className="altar-btn-text">Duyệt ca ({stats?.pending_approval || 0})</span>
          </Link>

          <Link to="/admin/checkins" className="altar-btn blue-btn">
            <span className="altar-btn-icon">🛡️</span>
            <span className="altar-btn-text">Ảnh check-in ({stats?.pending_checkins || 0})</span>
          </Link>

          <Link to="/admin/payments" className="altar-btn gold-btn">
            <span className="altar-btn-icon">🪙</span>
            <span className="altar-btn-text">Thanh toán</span>
          </Link>

          <Link to="/admin/schedule" className="altar-btn red-btn">
            <span className="altar-btn-icon">📜</span>
            <span className="altar-btn-text">Tạo ca tuần</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
