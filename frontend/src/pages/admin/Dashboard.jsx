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
          <h1 className="banner-title">👋 Xin chào, Admin!</h1>
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
        <div className="stat-artifact-card gold-card">
          <div className="card-text-side">
            <div className="card-top-label">👥 Tổng thành viên</div>
            <div className="card-big-num gold">{stats?.total_members || 0}</div>
          </div>
          <div className="card-artwork-wrap">
            <TomeArtifact />
          </div>
        </div>

        <div className="stat-artifact-card blue-card">
          <div className="card-text-side">
            <div className="card-top-label">📅 Ca học hệ thống</div>
            <div className="card-big-num blue">{stats?.total_sessions || 0}</div>
          </div>
          <div className="card-artwork-wrap">
            <AstralMapArtifact />
          </div>
        </div>

        <div className="stat-artifact-card purple-card">
          <div className="card-text-side">
            <div className="card-top-label">⏳ Ca chờ duyệt</div>
            <div className="card-big-num purple">{stats?.pending_approval || 0}</div>
          </div>
          <div className="card-artwork-wrap">
            <HourglassArtifact />
          </div>
        </div>

        <div className="stat-artifact-card pink-card">
          <div className="card-text-side">
            <div className="card-top-label">📸 Ảnh check-in chờ duyệt</div>
            <div className="card-big-num pink">{stats?.pending_checkins || 0}</div>
          </div>
          <div className="card-artwork-wrap">
            <TelescopeArtifact />
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="stat-artifact-card green-card">
          <div className="card-text-side">
            <div className="card-top-label">✅ CA ĐÃ HOÀN THÀNH</div>
            <div className="card-big-num green">{stats?.completed_sessions || 0}</div>
          </div>
          <div className="card-artwork-wrap">
            <JadeTalismanArtifact />
          </div>
        </div>

        <div className="stat-artifact-card gold-card">
          <div className="card-text-side">
            <div className="card-top-label">💸 TỔNG TIỀN ĐÃ TRẢ</div>
            <div className="card-big-num gold">{(stats?.total_paid_amount || 0).toLocaleString('vi-VN')}đ</div>
          </div>
          <div className="card-artwork-wrap">
            <TreasureChestArtifact />
          </div>
        </div>

        <div className="stat-artifact-card amber-card">
          <div className="card-text-side">
            <div className="card-top-label">⏳ ĐANG CHỜ THANH TOÁN</div>
            <div className="card-big-num amber">{(stats?.total_pending_amount || 0).toLocaleString('vi-VN')}đ</div>
          </div>
          <div className="card-artwork-wrap">
            <MoneyPouchArtifact />
          </div>
        </div>
      </div>

      <div className="altar-platform-container">
        <div className="altar-header">
          <span>⚡</span>
          <span>Thao tác nhanh</span>
        </div>

        <div className="altar-grid">
          <Link to="/admin/sessions" className="altar-pedestal">
            <div className="altar-card-floater green">
              <span className="altar-card-glyph">🗡️</span>
            </div>
            <div className="altar-button-pod">
              <span>✅ Duyệt ca học ({stats?.pending_approval || 0})</span>
            </div>
          </Link>

          <Link to="/admin/checkins" className="altar-pedestal">
            <div className="altar-card-floater blue">
              <span className="altar-card-glyph">🛡️</span>
            </div>
            <div className="altar-button-pod">
              <span>📸 Xem ảnh check-in ({stats?.pending_checkins || 0})</span>
            </div>
          </Link>

          <Link to="/admin/payments" className="altar-pedestal">
            <div className="altar-card-floater gold">
              <span className="altar-card-glyph">🪙</span>
            </div>
            <div className="altar-button-pod">
              <span>💰 Quản lý thanh toán</span>
            </div>
          </Link>

          <Link to="/admin/schedule" className="altar-pedestal">
            <div className="altar-card-floater red">
              <span className="altar-card-glyph">📜</span>
            </div>
            <div className="altar-button-pod">
              <span>📅 Tạo ca tuần này</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function TomeArtifact() {
  return (
    <svg width="68" height="60" viewBox="0 0 68 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="48" height="44" rx="5" fill="#78350F" stroke="#F59E0B" strokeWidth="2"/>
      <path d="M12 10C22 14 34 14 34 50C22 50 12 46 12 46Z" fill="#FEF3C7"/>
      <path d="M56 10C46 14 34 14 34 50C46 50 56 46 56 46Z" fill="#FDE68A"/>
      <line x1="34" y1="12" x2="34" y2="50" stroke="#B45309" strokeWidth="2"/>
      <path d="M18 20H28M18 26H28M18 32H26M40 20H50M40 26H50M40 32H48" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M34 50L38 56L34 54L30 56Z" fill="#EF4444"/>
    </svg>
  )
}

function AstralMapArtifact() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="64" height="44" rx="6" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3"/>
      <path d="M14 20C18 16 26 18 30 24C34 30 42 22 50 26C56 29 58 36 52 40C46 44 32 42 24 38C16 34 10 26 14 20Z" fill="#38BDF8" fillOpacity="0.45"/>
      <circle cx="28" cy="24" r="3" fill="#FDE047"/>
      <circle cx="48" cy="30" r="3" fill="#F43F5E"/>
      <circle cx="36" cy="28" r="18" stroke="#7DD3FC" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="36" cy="28" r="8" stroke="#7DD3FC" strokeWidth="1" strokeOpacity="0.7"/>
    </svg>
  )
}

function HourglassArtifact() {
  return (
    <svg width="56" height="64" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="4" width="36" height="6" rx="3" fill="#F59E0B" stroke="#FDE047" strokeWidth="1.5"/>
      <rect x="10" y="54" width="36" height="6" rx="3" fill="#F59E0B" stroke="#FDE047" strokeWidth="1.5"/>
      <path d="M16 10H40L32 30C30 32 30 32 32 34L40 54H16L24 34C26 32 26 32 24 30L16 10Z" fill="#3B0764" fillOpacity="0.85" stroke="#C084FC" strokeWidth="2"/>
      <path d="M22 18H34L28 28Z" fill="#FDE047"/>
      <path d="M25 44L31 44L34 52H22Z" fill="#FDE047"/>
      <line x1="28" y1="28" x2="28" y2="44" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="2 2"/>
    </svg>
  )
}

function TelescopeArtifact() {
  return (
    <svg width="74" height="56" viewBox="0 0 74 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="24" width="18" height="14" rx="2" transform="rotate(-20 10 24)" fill="#B45309" stroke="#FDE047" strokeWidth="2"/>
      <rect x="25" y="18.5" width="26" height="12" rx="2" transform="rotate(-20 25 18.5)" fill="#D97706" stroke="#FDE047" strokeWidth="1.5"/>
      <rect x="48" y="10" width="18" height="16" rx="3" transform="rotate(-20 48 10)" fill="#78350F" stroke="#FDE047" strokeWidth="2"/>
      <circle cx="63" cy="18" r="6" fill="#38BDF8" fillOpacity="0.8" stroke="#FDE047" strokeWidth="1.5"/>
      <path d="M32 38L24 52M34 38L34 52M36 38L44 52" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function JadeTalismanArtifact() {
  return (
    <svg width="56" height="66" viewBox="0 0 56 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="40" height="58" rx="6" fill="#064E3B" stroke="#34D399" strokeWidth="2.5"/>
      <rect x="12" y="8" width="32" height="50" rx="4" stroke="#6EE7B7" strokeWidth="1" strokeDasharray="3 3"/>
      <path d="M28 14L34 26H30V44H26V26H22L28 14Z" fill="#A7F3D0" stroke="#10B981" strokeWidth="1"/>
      <path d="M22 36C22 36 18 42 28 46C38 42 34 36 34 36" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function TreasureChestArtifact() {
  return (
    <svg width="74" height="58" viewBox="0 0 74 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="24" width="50" height="28" rx="4" fill="#78350F" stroke="#F59E0B" strokeWidth="2"/>
      <path d="M10 24C10 16 18 10 37 10C56 10 64 16 64 24H10Z" fill="#92400E" stroke="#FDE047" strokeWidth="2"/>
      <circle cx="37" cy="24" r="5" fill="#FDE047" stroke="#78350F" strokeWidth="1.5"/>
      <ellipse cx="28" cy="20" rx="6" ry="4" fill="#FDE047"/>
      <ellipse cx="46" cy="20" rx="6" ry="4" fill="#FDE047"/>
      <ellipse cx="37" cy="18" rx="7" ry="4" fill="#FEF08A"/>
      <circle cx="20" cy="50" r="3" fill="#FDE047"/>
      <circle cx="54" cy="50" r="3" fill="#FDE047"/>
    </svg>
  )
}

function MoneyPouchArtifact() {
  return (
    <svg width="58" height="62" viewBox="0 0 58 62" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29 8C20 8 16 16 12 26C8 36 12 54 29 54C46 54 50 36 46 26C42 16 38 8 29 8Z" fill="#C2410C" stroke="#FB923C" strokeWidth="2"/>
      <path d="M19 16C23 18 35 18 39 16L42 10H16L19 16Z" fill="#EA580C" stroke="#FDE047" strokeWidth="1.5"/>
      <circle cx="29" cy="18" r="4" fill="#FDE047"/>
      <circle cx="29" cy="34" r="10" fill="#EA580C" stroke="#FED7AA" strokeWidth="1.5"/>
      <path d="M29 28C27 30 25 33 27 36C28 38 30 38 31 36C32 34 31 32 29 28Z" fill="#FEF08A"/>
    </svg>
  )
}
