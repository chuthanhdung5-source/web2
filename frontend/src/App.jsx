import React, { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DouluoProvider } from './context/DouluoContext'
import { ThemeProvider } from './context/ThemeContext'
import DouluoSettingsModal from './components/Douluo/DouluoSettingsModal'
import RechargeVipModal from './components/Douluo/RechargeVipModal'
import CultivationModal from './components/Douluo/CultivationModal'
import DiamondMineModal from './components/Douluo/DiamondMineModal'
import DiamondShopModal from './components/Douluo/DiamondShopModal'
import ThemeModal from './components/Douluo/ThemeModal'
import SessionTimerOverlay from './components/Common/SessionTimerOverlay'
import AiChatWidget from './components/Chat/AiChatWidget'

import Login from './pages/Login'
import Register from './pages/Register'

import AdminDashboard from './pages/admin/Dashboard'
import AdminSchedule from './pages/admin/ScheduleManager'
import AdminSessionApproval from './pages/admin/SessionApproval'
import AdminCheckinReview from './pages/admin/CheckinReview'
import AdminActivityLogs from './pages/admin/ActivityLogs'
import SendNotification from './pages/admin/SendNotification'
import FeedbackManager from './pages/admin/FeedbackManager'
import AdminMembers from './pages/admin/MemberList'
import AdminPayments from './pages/admin/PaymentManager'
import AdminProfile from './pages/admin/ProfileSettings'

import MemberDashboard from './pages/member/Dashboard'
import AvailableSlots from './pages/member/AvailableSlots'
import MySchedule from './pages/member/MySchedule'
import CheckinPage from './pages/member/CheckinPage'
import Earnings from './pages/member/Earnings'
import SendFeedback from './pages/member/SendFeedback'
import AdminInfo from './pages/member/AdminInfo'
import MemberProfile from './pages/member/ProfileSettings'

import AppLayout from './components/Layout/AppLayout'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center', background: 'var(--bg-body, #0c0d16)' }}>
          <div style={{ fontSize: '3rem' }}>🔮</div>
          <h2 style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: 800 }}>Trận Pháp Tiên Môn Vừa Gặp Chấn Động</h2>
          <p style={{ color: '#94a3b8', maxWidth: '420px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Kinh mạch kết nối vừa được tái định hình hoặc phiên làm việc tạm ngắt quãng. Hãy nhấn nút bên dưới để phục hồi đạo vụ.
          </p>
          <button
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7c6af5, #6366f1)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(124, 106, 245, 0.4)'
            }}
            onClick={this.handleReload}
          >
            🔄 Tái Lập Trận Pháp (Tải Lại Trang)
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role && !(role === 'member' && user.role === 'admin')) {
    return <Navigate to="/" replace />
  }
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/member'} replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DouluoProvider>
          <ThemeProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RootRedirect />} />

              <Route path="/admin" element={
                <ProtectedRoute role="admin"><AppLayout /></ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="sessions" element={<AdminSessionApproval />} />
                <Route path="checkins" element={<AdminCheckinReview />} />
                <Route path="notifications/send" element={<SendNotification />} />
                <Route path="feedbacks" element={<FeedbackManager />} />
                <Route path="activity-logs" element={<AdminActivityLogs />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              <Route path="/member" element={
                <ProtectedRoute role="member"><AppLayout /></ProtectedRoute>
              }>
                <Route index element={<MemberDashboard />} />
                <Route path="slots" element={<AvailableSlots />} />
                <Route path="schedule" element={<MySchedule />} />
                <Route path="checkin/:sessionId" element={<CheckinPage />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="feedback" element={<SendFeedback />} />
                <Route path="admin-info" element={<AdminInfo />} />
                <Route path="profile" element={<MemberProfile />} />
              </Route>
            </Routes>
            <DouluoSettingsModal />
            <RechargeVipModal />
            <CultivationModal />
            <DiamondMineModal />
            <DiamondShopModal />
            <ThemeModal />
            <SessionTimerOverlay />
            <AiChatWidget />
            </BrowserRouter>
          </ThemeProvider>
        </DouluoProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
