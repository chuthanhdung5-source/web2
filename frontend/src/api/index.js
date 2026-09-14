import api from './client'

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
}

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getMembers: () => api.get('/admin/members'),
  toggleMember: (id) => api.patch(`/admin/members/${id}/toggle-active`),
  forceResetPassword: (id, data) => api.post(`/admin/members/${id}/force-reset-password`, data),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  uploadPhoto: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/admin/profile/photo', form)
  },
  getPendingSessions: () => api.get('/admin/sessions/pending'),
  approveSession: (id, approve, memberId, notes) =>
    api.post(`/admin/sessions/${id}/approve`, null, { params: { approve, member_id: memberId, notes } }),

  assignSession: (id, memberId) =>
    api.post(`/admin/sessions/${id}/assign`, null, { params: { member_id: memberId } }),
  getPendingCheckins: () => api.get('/admin/checkins/pending'),
  getCheckins: (status) => api.get('/admin/checkins', { params: { status } }),
  verifyCheckin: (id, approve, reason) =>
    api.post(`/admin/checkins/${id}/verify`, null, { params: { approve, reject_reason: reason } }),
  getPayments: (status) => api.get('/admin/payments', { params: { status } }),
  markPaid: (id, notes) =>
    api.post(`/admin/payments/${id}/mark-paid`, null, { params: { notes } }),
  getActivityLogs: (role) => api.get('/admin/activity-logs', { params: { role } }),
  broadcastNotification: (title, message, notifType, targetUserId) =>
    api.post('/admin/notifications/broadcast', null, {
      params: { title, message, notif_type: notifType, target_user_id: targetUserId }
    }),
  getFeedbacks: (status) => api.get('/admin/feedbacks', { params: { status } }),
  replyFeedback: (id, reply, status) =>
    api.post(`/admin/feedbacks/${id}/reply`, null, { params: { reply, status } }),
  // Subject & Slot CRUD
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),
  createSlot: (data) => api.post('/admin/schedule-slots', data),
  updateSlot: (id, data) => api.put(`/admin/schedule-slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/admin/schedule-slots/${id}`),
  deleteWeeklySession: (id) => api.delete(`/admin/weekly-sessions/${id}`),
}

export const scheduleAPI = {
  getSubjects: () => api.get('/schedule/subjects'),
  getSemesters: () => api.get('/schedule/semesters'),
  getSlots: (semesterId) => api.get('/schedule/slots', { params: { semester_id: semesterId } }),
  getWeeklySessions: (weekStart, status) =>
    api.get('/schedule/weekly-sessions', { params: { week_start: weekStart, status } }),
  getAvailableSessions: (weekStart) =>
    api.get('/schedule/available-sessions', { params: { week_start: weekStart } }),
  generateWeeklySessions: (weekStart, semesterId) =>
    api.post('/schedule/generate-weekly-sessions', null, {
      params: { week_start: weekStart, semester_id: semesterId }
    }),
}

export const memberAPI = {
  getMySessions: () => api.get('/member/sessions'),
  registerSession: (id) => api.post(`/member/sessions/${id}/register`),
  cancelRegistration: (id) => api.post(`/member/sessions/${id}/cancel`),
  getCheckins: (sessionId) => api.get(`/member/sessions/${sessionId}/checkins`),
  uploadCheckin: (checkinId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/member/checkin/${checkinId}/upload`, form)
  },
  uploadQR: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/member/upload-qr', form)
  },
  getEarnings: () => api.get('/member/earnings'),
  getStats: () => api.get('/member/stats'),
  getAdminInfo: () => api.get('/member/admin-info'),
  getNotifications: () => api.get('/member/notifications'),
  markNotifRead: (id) => api.post(`/member/notifications/${id}/read`),
  getActivityLogs: () => api.get('/member/activity-logs'),
  createFeedback: (title, content, feedbackType) =>
    api.post('/member/feedbacks', null, { params: { title, content, feedback_type: feedbackType } }),
  getMyFeedbacks: () => api.get('/member/feedbacks'),
}

export const douluoAPI = {
  getMe: () => api.get('/douluo/me'),
  cultivateHeartbeat: (seconds) => api.post('/douluo/cultivate', { seconds }),
  breakthrough: () => api.post('/douluo/breakthrough'),
  buyDiamonds: (vipTier, diamonds, packName) =>
    api.post('/douluo/buy-diamonds', { vip_tier: vipTier, diamonds, pack_name: packName }),
  mineDiamonds: (clicks = 1) => api.post('/douluo/mine-diamonds', { clicks }),
  spendDiamonds: (amount, reason) => api.post('/douluo/spend', { amount, reason }),
  toggleMode: () => api.post('/douluo/toggle'),
  getLeaderboard: () => api.get('/douluo/leaderboard'),
  adminPromote: (data) => api.post('/douluo/admin/promote', data),
}

