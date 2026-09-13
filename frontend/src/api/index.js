import api from './client'

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getMembers: () => api.get('/admin/members'),
  toggleMember: (id) => api.patch(`/admin/members/${id}/toggle-active`),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  uploadPhoto: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/admin/profile/photo', form)
  },
  getPendingSessions: () => api.get('/admin/sessions/pending'),
  approveSession: (id, approve, notes) =>
    api.post(`/admin/sessions/${id}/approve`, null, { params: { approve, notes } }),
  getPendingCheckins: () => api.get('/admin/checkins/pending'),
  verifyCheckin: (id, approve, reason) =>
    api.post(`/admin/checkins/${id}/verify`, null, { params: { approve, reject_reason: reason } }),
  getPayments: (status) => api.get('/admin/payments', { params: { status } }),
  markPaid: (id, notes) =>
    api.post(`/admin/payments/${id}/mark-paid`, null, { params: { notes } }),
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
}
