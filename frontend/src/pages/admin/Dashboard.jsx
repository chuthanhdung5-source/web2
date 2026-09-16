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

  if (loading) return (
    <div className="flex-center" style={{ height: 320 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: '#f59e0b' }} />
    </div>
  )

  const pendingTotal = (stats?.pending_approval || 0) + (stats?.pending_checkins || 0)
  const completionRate = stats?.total_sessions > 0
    ? Math.round(((stats?.completed_sessions || 0) / stats.total_sessions) * 100)
    : 100

  return (
    <div className="xianxia-dashboard">
      <div className="sect-arch-banner">
        <div className="arch-left">
          <div className="sect-crest">🏛️</div>
          <div className="arch-text">
            <div className="arch-tag">
              <span className="live-pulse" />
              <span>GIÁO HOÀNG ĐIỆN • ĐIỀU HÀNH TỔNG BẢNG</span>
            </div>
            <h1 className="arch-title">Tiên Môn Chưởng Quản</h1>
            <p className="arch-desc">
              {pendingTotal > 0
                ? `Cảnh báo: Hiện có ${pendingTotal} công vụ đang chờ phê duyệt khẩn cấp!`
                : 'Toàn tông môn vận hành hanh thông, không có tác vụ tồn đọng.'}
            </p>
          </div>
        </div>
        <div className="arch-right">
          <button
            className="sect-talisman-btn"
            onClick={() => loadStats(true)}
            disabled={refreshing}
          >
            {refreshing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <span>📜</span>}
            <span>Khởi Động Trận Pháp</span>
          </button>
        </div>
      </div>

      <div className="xianxia-main-grid">
        <div className="xianxia-col-left">
          <div className="command-section">
            <div className="section-title-bar">
              <span className="sect-symbol">⚔️</span>
              <span className="section-heading">TRUNG TÂM PHÙ TRIỆU & ĐIỀU HÀNH</span>
              {pendingTotal > 0 && (
                <span className="urgent-badge">{pendingTotal} CẦN DUYỆT</span>
              )}
            </div>

            <div className="dispatch-cards-grid">
              <Link to="/admin/sessions" className="dispatch-card dispatch-emerald">
                <div className="dispatch-card-inner">
                  <div className="dispatch-header">
                    <span className="dispatch-icon">🗡️</span>
                    <span className="dispatch-count-badge emerald-badge">
                      {stats?.pending_approval || 0}
                    </span>
                  </div>
                  <h3 className="dispatch-name">Duyệt Ca Học</h3>
                  <p className="dispatch-desc">Phê duyệt các ca học đệ tử vừa nhận</p>
                  <div className="dispatch-action-footer">
                    <span>Vào thẩm định</span>
                    <span className="arrow-glyph">→</span>
                  </div>
                </div>
              </Link>

              <Link to="/admin/checkins" className="dispatch-card dispatch-sapphire">
                <div className="dispatch-card-inner">
                  <div className="dispatch-header">
                    <span className="dispatch-icon">🛡️</span>
                    <span className="dispatch-count-badge sapphire-badge">
                      {stats?.pending_checkins || 0}
                    </span>
                  </div>
                  <h3 className="dispatch-name">Xem Ảnh Check-in</h3>
                  <p className="dispatch-desc">Xác thực chứng cứ điểm danh trực nhật</p>
                  <div className="dispatch-action-footer">
                    <span>Xem bằng chứng</span>
                    <span className="arrow-glyph">→</span>
                  </div>
                </div>
              </Link>

              <Link to="/admin/payments" className="dispatch-card dispatch-amber">
                <div className="dispatch-card-inner">
                  <div className="dispatch-header">
                    <span className="dispatch-icon">🪙</span>
                    <span className="dispatch-count-badge amber-badge">Ngân khố</span>
                  </div>
                  <h3 className="dispatch-name">Quản Lý Thanh Toán</h3>
                  <p className="dispatch-desc">Quyết toán linh thạch lương thưởng</p>
                  <div className="dispatch-action-footer">
                    <span>Giải ngân ngay</span>
                    <span className="arrow-glyph">→</span>
                  </div>
                </div>
              </Link>

              <Link to="/admin/schedule" className="dispatch-card dispatch-ruby">
                <div className="dispatch-card-inner">
                  <div className="dispatch-header">
                    <span className="dispatch-icon">📜</span>
                    <span className="dispatch-count-badge ruby-badge">Thời khóa</span>
                  </div>
                  <h3 className="dispatch-name">Thiết Lập Pháp Đàn</h3>
                  <p className="dispatch-desc">Tạo ca học phân bổ cho các môn đệ</p>
                  <div className="dispatch-action-footer">
                    <span>Tạo ca tuần</span>
                    <span className="arrow-glyph">→</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="sect-pulse-box">
            <div className="pulse-header">
              <span className="sect-symbol">⚡</span>
              <span className="pulse-title">KHÍ TƯỢNG VẬN HÀNH TÔNG MÔN</span>
            </div>
            <div className="pulse-content">
              <div className="pulse-progress-wrap">
                <div className="pulse-labels">
                  <span>Tiến độ hoàn thành ca học:</span>
                  <span className="rate-text">{completionRate}%</span>
                </div>
                <div className="pulse-bar-track">
                  <div className="pulse-bar-fill" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              <div className="pulse-sub-chips">
                <div className="sub-chip">
                  <span className="sub-chip-dot green-dot" />
                  <span>{stats?.completed_sessions || 0} Ca hoàn tất mỹ mãn</span>
                </div>
                <div className="sub-chip">
                  <span className="sub-chip-dot amber-dot" />
                  <span>{stats?.pending_approval || 0} Ca đang thụ lý</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xianxia-col-right">
          <div className="treasury-monolith">
            <div className="monolith-corner corner-tl" />
            <div className="monolith-corner corner-tr" />
            <div className="monolith-corner corner-bl" />
            <div className="monolith-corner corner-br" />

            <div className="monolith-header">
              <span className="monolith-icon">💎</span>
              <div>
                <div className="monolith-tag">LINH THẠCH NGÂN KHỐ</div>
                <div className="monolith-subtitle">Quỹ lương & Tài chính tông môn</div>
              </div>
            </div>

            <div className="monolith-body">
              <div className="monolith-figure-box">
                <div className="figure-label">TỔNG LINH THẠCH ĐÃ TRẢ</div>
                <div className="figure-value-gold">
                  {(stats?.total_paid_amount || 0).toLocaleString('vi-VN')}đ
                </div>
              </div>

              <div className="monolith-pending-box">
                <div className="pending-row">
                  <span className="pending-label">⏳ Đang chờ giải ngân:</span>
                  <span className="pending-amount">
                    {(stats?.total_pending_amount || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pillars-section">
            <div className="section-title-bar">
              <span className="sect-symbol">🏛️</span>
              <span className="section-heading">TỨ TRỤ THỐNG KÊ</span>
            </div>

            <div className="pillars-grid">
              <div className="pillar-tile pillar-gold">
                <div className="pillar-icon-box">👥</div>
                <div className="pillar-info">
                  <div className="pillar-num">{(stats?.total_members || 0).toLocaleString('vi-VN')}</div>
                  <div className="pillar-name">Đồng Môn</div>
                </div>
              </div>

              <div className="pillar-tile pillar-cyan">
                <div className="pillar-icon-box">📅</div>
                <div className="pillar-info">
                  <div className="pillar-num">{stats?.total_sessions || 0}</div>
                  <div className="pillar-name">Ca Hệ Thống</div>
                </div>
              </div>

              <div className="pillar-tile pillar-purple">
                <div className="pillar-icon-box">⏳</div>
                <div className="pillar-info">
                  <div className="pillar-num">{stats?.pending_approval || 0}</div>
                  <div className="pillar-name">Ca Chờ Duyệt</div>
                </div>
              </div>

              <div className="pillar-tile pillar-pink">
                <div className="pillar-icon-box">📸</div>
                <div className="pillar-info">
                  <div className="pillar-num">{stats?.pending_checkins || 0}</div>
                  <div className="pillar-name">Ảnh Check-in</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
