import { useEffect, useState } from 'react'
import { scheduleAPI, adminAPI } from '../../api'
import TimetableGrid from '../../components/Schedule/TimetableGrid'
import toast from 'react-hot-toast'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'

const DAY_NAMES = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ Nhật' }

const PERIOD_TIMES = {
  1: { start: '07:00', end: '07:50' },
  2: { start: '07:55', end: '08:45' },
  3: { start: '08:50', end: '09:40' },
  4: { start: '09:50', end: '10:40' },
  5: { start: '10:45', end: '11:35' },
  6: { start: '11:40', end: '12:30' },
  7: { start: '13:00', end: '13:50' },
  8: { start: '13:55', end: '14:45' },
  9: { start: '14:50', end: '15:40' },
  10: { start: '15:50', end: '16:40' },
  11: { start: '16:45', end: '17:35' },
  12: { start: '17:40', end: '18:30' },
}

export default function ScheduleManager() {
  const [sessions, setSessions] = useState([])
  const [semesters, setSemesters] = useState([])
  const [members, setMembers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [slots, setSlots] = useState([])

  const [activeSemester, setActiveSemester] = useState(null)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [subjectForm, setSubjectForm] = useState({
    code: '', name: '', credits: 3, class_code: '', status: 'Sơ Nhập Khảo Nghiệm', tuition: 0
  })

  const [showSlotModal, setShowSlotModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [slotForm, setSlotForm] = useState({
    subject_id: '', day_of_week: 2, start_period: 1, end_period: 2, classroom: '', start_time: '07:00', end_time: '08:45'
  })

  useEffect(() => {
    scheduleAPI.getSemesters().then(r => {
      setSemesters(r.data)
      const active = r.data.find(s => s.is_active) || r.data[0]
      setActiveSemester(active?.id)
    })
    adminAPI.getMembers().then(r => setMembers(r.data))
    loadSubjects()
    loadSlots()
  }, [])

  const loadSubjects = () => {
    scheduleAPI.getSubjects().then(r => setSubjects(r.data))
  }

  const loadSlots = () => {
    scheduleAPI.getSlots().then(r => setSlots(r.data))
  }

  const loadSessions = () => {
    if (!weekStart) return
    setLoading(true)
    scheduleAPI.getWeeklySessions(format(weekStart, 'yyyy-MM-dd'))
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(loadSessions, [weekStart])

  const generateWeek = async () => {
    if (!activeSemester) return toast.error('Chưa chọn niên khóa tu chân')
    setGenerating(true)
    try {
      const res = await scheduleAPI.generateWeeklySessions(format(weekStart, 'yyyy-MM-dd'), activeSemester)
      toast.success(res.data.message || 'Khởi trận pháp tuần thành công!')
      loadSessions()
    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi khởi trận pháp') }
    finally { setGenerating(false) }
  }

  const handleAssign = async (sessionId, memberId) => {
    try {
      const res = await adminAPI.assignSession(sessionId, memberId)
      toast.success(res.data.message || 'Đã ban sắc lệnh hộ đạo!')
      loadSessions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi ban sắc lệnh hộ đạo')
    }
  }

  const handleApprove = async (sessionId, approve) => {
    try {
      await adminAPI.approveSession(sessionId, approve)
      toast.success(approve ? '✅ Đã chuẩn phê tràng thí luyện!' : '❌ Đã bác bỏ tràng thí luyện')
      loadSessions()
    } catch {
      toast.error('Lỗi khi chuẩn phê tràng thí luyện')
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Bản tọa có chắc chắn muốn thu hồi tràng hộ đạo này khỏi tuần hiện tại?')) return
    try {
      await adminAPI.deleteWeeklySession(sessionId)
      toast.success('Đã thu hồi tràng hộ đạo thành công!')
      loadSessions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi thu hồi tràng hộ đạo')
    }
  }

  const openSubjectModal = (subj = null) => {
    if (subj) {
      setEditingSubject(subj)
      setSubjectForm({
        code: subj.code, name: subj.name, credits: subj.credits || 3,
        class_code: subj.class_code || '', status: subj.status || 'Sơ Nhập Khảo Nghiệm', tuition: subj.tuition || 0
      })
    } else {
      setEditingSubject(null)
      setSubjectForm({ code: '', name: '', credits: 3, class_code: '', status: 'Sơ Nhập Khảo Nghiệm', tuition: 0 })
    }
    setShowSubjectModal(true)
  }

  const handleSaveSubject = async (e) => {
    e.preventDefault()
    if (!subjectForm.code || !subjectForm.name) return toast.error('Vui lòng điền đủ Mã pháp môn và Tên pháp môn!')
    try {
      if (editingSubject) {
        await adminAPI.updateSubject(editingSubject.id, subjectForm)
        toast.success('Đã cập nhật pháp môn!')
      } else {
        await adminAPI.createSubject(subjectForm)
        toast.success('Đã khai mở pháp môn mới!')
      }
      setShowSubjectModal(false)
      loadSubjects()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi lưu thông tin pháp môn!')
    }
  }

  const handleDeleteSubject = async (subj) => {
    if (!window.confirm(`⚠️ CẢNH BÁO: Xóa pháp môn "${subj.name}" (${subj.code}) sẽ HỦY BỎ TOÀN BỘ trận pháp cố định và các tràng liên quan! Tiếp tục?`)) return
    try {
      await adminAPI.deleteSubject(subj.id)
      toast.success(`Đã xóa pháp môn ${subj.name}`)
      loadSubjects()
      loadSlots()
      loadSessions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi xóa pháp môn!')
    }
  }

  const openSlotModal = (slot = null) => {
    if (slot) {
      setEditingSlot(slot)
      setSlotForm({
        subject_id: slot.subject_id,
        day_of_week: slot.day_of_week,
        start_period: slot.start_period,
        end_period: slot.end_period,
        classroom: slot.classroom || '',
        start_time: slot.start_time || PERIOD_TIMES[slot.start_period]?.start || '07:00',
        end_time: slot.end_time || PERIOD_TIMES[slot.end_period]?.end || '08:45',
      })
    } else {
      setEditingSlot(null)
      setSlotForm({
        subject_id: subjects[0]?.id || '',
        day_of_week: 2,
        start_period: 1,
        end_period: 2,
        classroom: '',
        start_time: '07:00',
        end_time: '08:45'
      })
    }
    setShowSlotModal(true)
  }

  const handlePeriodChange = (startP, endP) => {
    const st = PERIOD_TIMES[startP]?.start || '07:00'
    const et = PERIOD_TIMES[endP]?.end || '08:45'
    setSlotForm(prev => ({ ...prev, start_period: startP, end_period: endP, start_time: st, end_time: et }))
  }

  const handleSaveSlot = async (e) => {
    e.preventDefault()
    if (!slotForm.subject_id) return toast.error('Vui lòng chọn pháp môn!')
    if (!activeSemester) return toast.error('Chưa có niên khóa hoạt động!')

    const payload = {
      ...slotForm,
      subject_id: parseInt(slotForm.subject_id),
      semester_id: activeSemester,
      day_of_week: parseInt(slotForm.day_of_week),
      start_period: parseInt(slotForm.start_period),
      end_period: parseInt(slotForm.end_period),
    }

    try {
      if (editingSlot) {
        await adminAPI.updateSlot(editingSlot.id, payload)
        toast.success('Đã cập nhật trận pháp cố định!')
      } else {
        await adminAPI.createSlot(payload)
        toast.success('Đã thiết lập trận pháp cố định mới!')
      }
      setShowSlotModal(false)
      loadSlots()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi lưu trận pháp cố định!')
    }
  }

  const handleDeleteSlot = async (slot) => {
    if (!window.confirm(`Bạn có chắc muốn thu hồi tràng hộ đạo thứ ${DAY_NAMES[slot.day_of_week]} (Khắc ${slot.start_period}-${slot.end_period})?`)) return
    try {
      await adminAPI.deleteSlot(slot.id)
      toast.success('Đã thu hồi trận pháp cố định!')
      loadSlots()
      loadSessions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi thu hồi trận pháp cố định!')
    }
  }

  const weekLabel = `${format(weekStart, 'dd/MM')} – ${format(addWeeks(weekStart, 1), 'dd/MM/yyyy')}`

  return (
    <div>
      <div className="page-header flex flex-between align-center" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1>📅 Khảo Thí Trực Trận & Pháp Tràng Hộ Đạo</h1>
          <p>Quản trị trận pháp mẫu, điều chỉnh thời khắc thí luyện, pháp môn và ban sắc lệnh hộ đạo</p>
        </div>

        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewMode('grid')}
          >
            🗓️ Bát Quái Trận Đồ TKB
          </button>
          <button
            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewMode('table')}
          >
            📋 Đạo Tràng Trong Tuần
          </button>
          <button
            className={`btn ${viewMode === 'manage' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewMode('manage')}
          >
            ⚙️ Pháp Môn & Khảo Kỳ Cố Định
          </button>
        </div>
      </div>

      {viewMode !== 'manage' && (
        <div className="flex flex-between align-center" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="flex gap-2 align-center" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>← Tuần trước</button>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', textAlign: 'center', padding: '0 4px' }}>Tuần {weekLabel}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>Tuần sau →</button>
          </div>
          <button id="generate-week" className="btn btn-primary btn-sm" onClick={generateWeek} disabled={generating}>
            {generating ? '⏳ Đang khởi trận...' : '⚡ Khởi Trận Pháp Lịch Tuần Này'}
          </button>
        </div>
      )}

      {viewMode === 'grid' && (
        loading ? (
          <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>Chưa có đạo tràng khảo thí nào trong tuần này</h3>
            <p>Bấm "Khởi Trận Pháp Lịch Tuần Này" để tự động kiến lập các tràng hộ đạo từ pháp trận mẫu hoặc chuyển sang tab "Pháp Môn & Khảo Kỳ Cố Định".</p>
          </div>
        ) : (
          <TimetableGrid
            weeklySessions={sessions}
            isAdmin={true}
            members={members}
            onAssign={handleAssign}
            onApprove={handleApprove}
            onDeleteSession={handleDeleteSession}
          />
        )
      )}

      {viewMode === 'table' && (
        loading ? (
          <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>Chưa có đạo tràng nào trong tuần này</h3>
            <p>Bấm "Khởi Trận Pháp Lịch Tuần Này" để tạo đạo tràng.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th><th>Thứ</th><th>Pháp Môn</th><th>Khắc</th><th>Canh Giờ</th><th>Đạo Trường</th><th>Trạng Thái</th><th>Sắc Lệnh Môn Hạ</th><th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                    <td>{DAY_NAMES[s.schedule_slot?.day_of_week]}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.schedule_slot?.subject?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.schedule_slot?.subject?.code}</div>
                    </td>
                    <td>Khắc {s.schedule_slot?.start_period}–{s.schedule_slot?.end_period}</td>
                    <td style={{ fontSize: '0.85rem' }}>{s.schedule_slot?.start_time} – {s.schedule_slot?.end_time}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.schedule_slot?.classroom}</td>
                    <td><span className={`badge badge-${s.status}`}>
                      {{ open: 'Bỏ Ngỏ', registered: 'Chờ Phê', approved: 'Đã Ban Lệnh', completed: 'Viên Mãn', cancelled: 'Thu Hồi' }[s.status]}
                    </span></td>
                    <td>
                      <select
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                        value={s.assigned_member?.id || ''}
                        onChange={(e) => e.target.value && handleAssign(s.id, e.target.value)}
                      >
                        <option value="">-- Chưa Ban Sắc Lệnh --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>👤 {m.full_name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteSession(s.id)}
                        title="Thu hồi tràng này"
                      >
                        🗑️ Thu Hồi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {viewMode === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>📌 Trận Pháp Khảo Kỳ Cố Định Tuần (Master Schedule Slots)</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Trận pháp mẫu dùng để tự động khởi tạo các tràng hộ đạo mỗi tuần.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openSlotModal()}>
                ➕ Thiết Lập Tràng Cố Định
              </button>
            </div>

            {slots.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có trận pháp cố định nào</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Pháp Môn</th>
                      <th>Thứ</th>
                      <th>Thời Khắc</th>
                      <th>Canh Giờ</th>
                      <th>Đạo Trường</th>
                      <th>Trạng Thái</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map(sl => (
                      <tr key={sl.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{sl.subject?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sl.subject?.code} ({sl.subject?.class_code})</div>
                        </td>
                        <td><span className="badge badge-info">{DAY_NAMES[sl.day_of_week]}</span></td>
                        <td><strong>Khắc {sl.start_period} – {sl.end_period}</strong></td>
                        <td style={{ fontSize: '0.85rem' }}>⏰ {sl.start_time} - {sl.end_time}</td>
                        <td>🏰 <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{sl.classroom}</span></td>
                        <td>
                          <span className={`badge ${sl.is_active ? 'badge-verified' : 'badge-danger'}`}>
                            {sl.is_active ? '🟢 Hoạt Động' : '🔴 Đã Phong Tỏa'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => openSlotModal(sl)}>
                              ✏️ Sửa
                            </button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleDeleteSlot(sl)}>
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="flex flex-between align-center" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>📚 Danh Lục Pháp Môn Khảo Thí (Subjects)</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Quản lý danh mục các pháp môn khảo thí trong hệ thống.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openSubjectModal()}>
                ➕ Khai Mở Pháp Môn Mới
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Mã Pháp Môn</th>
                    <th>Danh Xưng Pháp Môn</th>
                    <th>Đạo Phẩm</th>
                    <th>Đạo Tràng Hội</th>
                    <th>Cảnh Giới Thí Luyện</th>
                    <th>Linh Thạch Tiêu Hao</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.code}</code></td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.credits} Đạo Phẩm</td>
                      <td>{s.class_code || '—'}</td>
                      <td><span className="badge badge-info">{s.status || 'N/A'}</span></td>
                      <td>{s.tuition ? `${s.tuition.toLocaleString('vi-VN')}đ` : '0đ'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => openSubjectModal(s)}>
                            ✏️ Sửa
                          </button>
                          <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleDeleteSubject(s)}>
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div className="modal-backdrop" onClick={() => setShowSubjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
            <h3>{editingSubject ? '✏️ Chỉnh Sửa Pháp Môn' : '➕ Khai Mở Pháp Môn Mới'}</h3>
            <form onSubmit={handleSaveSubject} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div>
                <label className="form-label">Mã Pháp Môn (*)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: MAT2034"
                  value={subjectForm.code}
                  onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Danh Xưng Pháp Môn (*)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Cửu Thiên Huyền Toán Đại Pháp"
                  value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Đạo Phẩm (Tín chỉ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={subjectForm.credits}
                    onChange={e => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Đạo Tràng Hội (Lớp HP)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MAT2034 1"
                    value={subjectForm.class_code}
                    onChange={e => setSubjectForm({ ...subjectForm, class_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Cảnh Giới Thí Luyện</label>
                  <select
                    className="form-input"
                    value={subjectForm.status}
                    onChange={e => setSubjectForm({ ...subjectForm, status: e.target.value })}
                  >
                    <option value="Sơ Nhập Khảo Nghiệm">Sơ Nhập Khảo Nghiệm</option>
                    <option value="Trọng Tu Khảo Nghiệm">Trọng Tu Khảo Nghiệm</option>
                    <option value="Tự Do Ngộ Đạo">Tự Do Ngộ Đạo</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Linh Thạch Tiêu Hao (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={subjectForm.tuition}
                    onChange={e => setSubjectForm({ ...subjectForm, tuition: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-end" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác Nhận Khai Mở</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="modal-backdrop" onClick={() => setShowSlotModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, padding: 24 }}>
            <h3>{editingSlot ? '✏️ Chỉnh Sửa Trận Pháp Cố Định' : '➕ Thiết Lập Tràng Cố Định Mới'}</h3>
            <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div>
                <label className="form-label">Pháp Môn (*)</label>
                <select
                  className="form-input"
                  value={slotForm.subject_id}
                  onChange={e => setSlotForm({ ...slotForm, subject_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn Pháp Môn --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Thứ trong tuần (*)</label>
                  <select
                    className="form-input"
                    value={slotForm.day_of_week}
                    onChange={e => setSlotForm({ ...slotForm, day_of_week: parseInt(e.target.value) })}
                  >
                    <option value={2}>Thứ 2</option>
                    <option value={3}>Thứ 3</option>
                    <option value={4}>Thứ 4</option>
                    <option value={5}>Thứ 5</option>
                    <option value={6}>Thứ 6</option>
                    <option value={7}>Thứ 7</option>
                    <option value={8}>Chủ Nhật</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Đạo Trường (Phòng học) (*)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: 513T4"
                    value={slotForm.classroom}
                    onChange={e => setSlotForm({ ...slotForm, classroom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Khắc bắt đầu (*)</label>
                  <select
                    className="form-input"
                    value={slotForm.start_period}
                    onChange={e => {
                      const sp = parseInt(e.target.value)
                      const ep = Math.max(sp, slotForm.end_period)
                      handlePeriodChange(sp, ep)
                    }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => (
                      <option key={p} value={p}>Khắc {p} ({PERIOD_TIMES[p].start})</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label">Khắc kết thúc (*)</label>
                  <select
                    className="form-input"
                    value={slotForm.end_period}
                    onChange={e => {
                      const ep = parseInt(e.target.value)
                      const sp = Math.min(ep, slotForm.start_period)
                      handlePeriodChange(sp, ep)
                    }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => (
                      <option key={p} value={p}>Khắc {p} ({PERIOD_TIMES[p].end})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Canh giờ khởi sự</label>
                  <input
                    type="text"
                    className="form-input"
                    value={slotForm.start_time}
                    onChange={e => setSlotForm({ ...slotForm, start_time: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Canh giờ hoàn tất</label>
                  <input
                    type="text"
                    className="form-input"
                    value={slotForm.end_time}
                    onChange={e => setSlotForm({ ...slotForm, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-end" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Khắc Lên Ngọc Giản</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
