import { useEffect, useState } from 'react'
import { memberAPI } from '../../api'

export default function AdminInfo() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    memberAPI.getAdminInfo().then(r => setInfo(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>

  if (!info) return (
    <div className="empty-state">
      <div className="icon">😕</div>
      <h3>Chưa có thông tin sinh viên</h3>
      <p>Liên hệ admin để cập nhật</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>🎓 Thông tin sinh viên</h1>
        <p>Thông tin người bạn cần học hộ</p>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        {/* Photo + basic */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32 }}>
          {info.photo_url ? (
            <img src={info.photo_url} alt="SV"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
          ) : (
            <div className="avatar" style={{ width: 120, height: 120, fontSize: '2.5rem' }}>
              {info.full_name?.charAt(0) || '?'}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <h2 className="h2">{info.full_name}</h2>
            <div style={{ color: 'var(--primary-light)', fontWeight: 600, marginTop: 4 }}>{info.student_id}</div>
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <h3 className="h3" style={{ marginBottom: 16 }}>📋 Thông tin chi tiết</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InfoRow icon="🏫" label="Trường" value={info.university} />
            <InfoRow icon="🎓" label="Chương trình" value={info.program} />
            <InfoRow icon="📅" label="Khóa" value={info.cohort} />
            <InfoRow icon="🏛️" label="Khoa" value={info.faculty} />
            <InfoRow icon="👥" label="Lớp" value={info.class_name} />
            <InfoRow icon="🎂" label="Ngày sinh" value={info.date_of_birth ? new Date(info.date_of_birth).toLocaleDateString('vi-VN') : null} />
          </div>
        </div>

        {/* Notes */}
        {info.notes && (
          <div className="card" style={{ gridColumn: '1 / -1', background: 'rgba(124,106,245,0.08)', borderColor: 'rgba(124,106,245,0.2)' }}>
            <h3 className="h3" style={{ marginBottom: 12 }}>📝 Ghi chú từ admin</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{info.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1rem', minWidth: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}
