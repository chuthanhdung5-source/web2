from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, UserRole, AdminProfile, Subject, Semester, ScheduleSlot, WeeklySession, PeriodCheckin, Payment, Notification, ActivityLog
from app.models.checkin import CheckinStatus
from app.models.session import SessionStatus
from app.models.payment import PaymentStatus
from app.schemas.auth import UserOut
from app.schemas.schedule import (
    AdminProfileOut, AdminProfileUpdate, SubjectOut, ScheduleSlotOut,
    SubjectCreate, SubjectUpdate, ScheduleSlotCreate, ScheduleSlotUpdate
)
from app.schemas.session import WeeklySessionOut, PaymentOut, NotificationOut, MemberStatsOut
from app.middleware.auth import require_admin, get_current_user
from app.utils.gcs import upload_photo
from app.utils.activity import log_activity
from app.utils.period_time import get_slot_start_time, get_slot_end_time, get_session_type
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])


# ===== MEMBER MANAGEMENT =====
@router.get("/members", response_model=List[UserOut])
def list_members(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    return db.query(User).filter(User.role == UserRole.member).all()


@router.patch("/members/{user_id}/toggle-active", response_model=UserOut)
def toggle_member_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.member).first()
    if not user:
        raise HTTPException(status_code=404, detail="Thành viên không tồn tại")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    log_activity(
        db, current_user, "MEMBER_TOGGLE_ACTIVE",
        f"{'Kích hoạt' if user.is_active else 'Khóa'} tài khoản {user.full_name}",
        f"Admin {current_user.full_name} đã {'kích hoạt' if user.is_active else 'khóa'} tài khoản @{user.username}",
        target_id=user.id
    )
    return user


# ===== ADMIN PROFILE =====
@router.get("/profile", response_model=AdminProfileOut)
def get_admin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Chưa có thông tin sinh viên")
    return profile


@router.put("/profile", response_model=AdminProfileOut)
def update_admin_profile(
    data: AdminProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == current_user.id).first()
    if not profile:
        profile = AdminProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/profile/photo")
async def upload_admin_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    url, _ = await upload_photo(file, folder="admin-photos")
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == current_user.id).first()
    if not profile:
        profile = AdminProfile(user_id=current_user.id, photo_url=url)
        db.add(profile)
    else:
        profile.photo_url = url
    db.commit()
    return {"photo_url": url}


# ===== SESSION APPROVAL =====
@router.get("/sessions/pending", response_model=List[WeeklySessionOut])
def get_pending_sessions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    return db.query(WeeklySession).filter(
        WeeklySession.status == SessionStatus.registered
    ).order_by(WeeklySession.session_date).all()


@router.post("/sessions/{session_id}/approve")
def approve_session(
    session_id: int,
    approve: bool,
    member_id: Optional[int] = None,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    from datetime import datetime
    from app.models.session import SessionRegistration, RegistrationStatus
    from app.utils.period_time import get_periods_for_slot, get_checkin_deadline

    session = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")
    if session.status != SessionStatus.registered:
        raise HTTPException(status_code=400, detail="Ca học không ở trạng thái chờ duyệt")

    now = datetime.now()

    if approve:
        # Tìm danh sách đăng ký
        registrations = db.query(SessionRegistration).filter(
            SessionRegistration.weekly_session_id == session_id,
            SessionRegistration.status == RegistrationStatus.pending
        ).order_by(SessionRegistration.registered_at.asc()).all()

        chosen_member_id = member_id
        if not chosen_member_id:
            if registrations:
                chosen_member_id = registrations[0].member_id
            else:
                chosen_member_id = session.assigned_member_id

        if not chosen_member_id:
            raise HTTPException(status_code=400, detail="Không tìm thấy thành viên để duyệt")

        chosen_member = db.query(User).filter(User.id == chosen_member_id).first()
        if not chosen_member:
            raise HTTPException(status_code=404, detail="Thành viên không tồn tại")

        session.assigned_member_id = chosen_member.id
        session.status = SessionStatus.approved
        session.approved_by = current_user.id
        session.approved_at = now
        session.notes = notes

        # Cập nhật trạng thái từng đăng ký
        for reg in registrations:
            if reg.member_id == chosen_member.id:
                reg.status = RegistrationStatus.approved
            else:
                reg.status = RegistrationStatus.rejected
                # Gửi thông báo từ chối cho ứng viên không được chọn
                db.add(Notification(
                    user_id=reg.member_id,
                    title="Thông báo kết quả đăng ký ca học ℹ️",
                    message=f"Ca học ngày {session.session_date} đã được Admin duyệt cho thành viên khác.",
                    type="info",
                    related_session_id=session.id,
                ))

        # Tạo các PeriodCheckin records nếu chưa có
        if not session.period_checkins:
            slot = session.schedule_slot
            periods = get_periods_for_slot(slot.start_period, slot.end_period)
            for period_num in periods:
                deadline = get_checkin_deadline(session.session_date, period_num)
                checkin = PeriodCheckin(
                    weekly_session_id=session.id,
                    period_number=period_num,
                    status=CheckinStatus.pending,
                    deadline=deadline,
                )
                db.add(checkin)

        # Gửi thông báo duyệt cho thành viên được chọn
        db.add(Notification(
            user_id=chosen_member.id,
            title="Ca học đã được duyệt ✅",
            message=f"Ca học ngày {session.session_date} môn {session.schedule_slot.subject.name} đã được Admin duyệt cho bạn.",
            type="approval",
            related_session_id=session.id,
        ))

        log_activity(
            db, current_user, "SESSION_APPROVE",
            f"Duyệt ca học môn {session.schedule_slot.subject.name if session.schedule_slot else 'N/A'}",
            f"Admin {current_user.full_name} đã duyệt chọn {chosen_member.full_name} cho ca học ngày {session.session_date}.",
            target_id=session.id
        )

        db.commit()
        return {"message": f"Đã duyệt ca học cho {chosen_member.full_name}"}

    else:
        # Từ chối toàn bộ ca học này
        session.status = SessionStatus.open
        session.assigned_member_id = None
        session.notes = notes

        registrations = db.query(SessionRegistration).filter(
            SessionRegistration.weekly_session_id == session_id
        ).all()
        for reg in registrations:
            reg.status = RegistrationStatus.rejected
            db.add(Notification(
                user_id=reg.member_id,
                title="Ca học bị từ chối ❌",
                message=f"Yêu cầu đăng ký ca học ngày {session.session_date} bị Admin từ chối. {notes or ''}",
                type="rejection",
                related_session_id=session.id,
            ))

        log_activity(
            db, current_user, "SESSION_REJECT",
            f"Từ chối đăng ký ca học môn {session.schedule_slot.subject.name if session.schedule_slot else 'N/A'}",
            f"Admin {current_user.full_name} đã từ chối tất cả yêu cầu đăng ký ca học ngày {session.session_date}.",
            target_id=session.id
        )

        db.commit()
        return {"message": "Đã từ chối các yêu cầu đăng ký"}



@router.post("/sessions/{session_id}/assign")
def assign_session(
    session_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin giao/phân công trực tiếp ca học cho một thành viên."""
    from datetime import datetime
    from app.models import PeriodCheckin, User
    from app.models.checkin import CheckinStatus
    from app.utils.period_time import get_periods_for_slot, get_checkin_deadline

    session = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")

    member = db.query(User).filter(User.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Thành viên không tồn tại")

    session.assigned_member_id = member.id
    session.status = SessionStatus.approved
    session.approved_at = datetime.now()

    # Tạo các PeriodCheckin records nếu chưa có
    if not session.period_checkins:
        slot = session.schedule_slot
        periods = get_periods_for_slot(slot.start_period, slot.end_period)
        for period_num in periods:
            deadline = get_checkin_deadline(session.session_date, period_num)
            checkin = PeriodCheckin(
                weekly_session_id=session.id,
                period_number=period_num,
                status=CheckinStatus.pending,
                deadline=deadline,
            )
            db.add(checkin)

    notif = Notification(
        user_id=member.id,
        title="Bạn được phân công ca học mới 🎓",
        message=f"Admin đã phân công bạn ca học môn {session.schedule_slot.subject.name} ngày {session.session_date}.",
        type="info",
        related_session_id=session.id,
    )
    db.add(notif)
    db.commit()

    log_activity(
        db, current_user, "SESSION_ASSIGN",
        f"Phân công ca học môn {session.schedule_slot.subject.name if session.schedule_slot else 'N/A'}",
        f"Admin {current_user.full_name} đã phân công cho {member.full_name} ca học ngày {session.session_date}.",
        target_id=session.id
    )

    return {"message": f"Đã phân công ca học cho {member.full_name}"}


# ===== CHECKIN REVIEW & HISTORY =====
@router.get("/checkins/pending")
def get_pending_checkins(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    return get_all_checkins(status="pending", db=db)


@router.get("/checkins")
def get_all_checkins(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    query = db.query(PeriodCheckin)
    if status and status != 'all':
        query = query.filter(PeriodCheckin.status == status)

    checkins = query.order_by(PeriodCheckin.submitted_at.desc().nullslast(), PeriodCheckin.id.desc()).all()

    result = []
    for c in checkins:
        ws = c.weekly_session
        slot = ws.schedule_slot if ws else None
        member = ws.assigned_member if ws else None
        subject = slot.subject if slot else None

        result.append({
            "id": c.id,
            "weekly_session_id": c.weekly_session_id,
            "period_number": c.period_number,
            "photo_url": c.photo_url,
            "photo_filename": c.photo_filename,
            "submitted_at": c.submitted_at,
            "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
            "reject_reason": c.reject_reason,
            "deadline": c.deadline,
            "verified_at": c.verified_at,
            "member_id": member.id if member else None,
            "member_name": member.full_name if member else "Chưa phân công",
            "member_username": member.username if member else "",
            "subject_name": subject.name if subject else "N/A",
            "subject_code": subject.code if subject else "N/A",
            "classroom": slot.classroom if slot else "N/A",
            "session_date": str(ws.session_date) if ws else "N/A",
        })
    return result


@router.post("/checkins/{checkin_id}/verify")
def verify_checkin(
    checkin_id: int,
    approve: bool,
    reject_reason: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    from datetime import datetime
    checkin = db.query(PeriodCheckin).filter(PeriodCheckin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in không tồn tại")

    checkin.status = CheckinStatus.verified if approve else CheckinStatus.rejected
    checkin.reject_reason = reject_reason if not approve else None
    checkin.verified_at = datetime.now()

    # Cập nhật payment nếu tất cả tiết đã được verify
    session = checkin.weekly_session
    if session and session.assigned_member_id:
        _update_payment(db, session, current_user)

    db.commit()

    member_name = session.assigned_member.full_name if (session and session.assigned_member) else "thành viên"
    log_activity(
        db, current_user,
        "CHECKIN_VERIFY" if approve else "CHECKIN_REJECT",
        f"{'Xác nhận' if approve else 'Từ chối'} ảnh check-in tiết {checkin.period_number}",
        f"Admin {current_user.full_name} đã {'xác nhận' if approve else 'từ chối'} ảnh check-in tiết {checkin.period_number} của {member_name}." + (f" Lý do: {reject_reason}" if not approve and reject_reason else ""),
        target_id=checkin.id
    )

    return {"message": "Đã xác nhận" if approve else "Đã từ chối"}


# ===== AUDIT LOGS / ACTIVITY LOGS =====
@router.get("/activity-logs")
def get_activity_logs(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    query = db.query(ActivityLog)
    if role and role != 'all':
        query = query.filter(ActivityLog.user_role == role)
    return query.order_by(ActivityLog.created_at.desc()).limit(200).all()



def _update_payment(db: Session, session: WeeklySession, admin: User):
    """Tính lại tiền cho ca học sau khi verify checkin."""
    verified_count = db.query(PeriodCheckin).filter(
        PeriodCheckin.weekly_session_id == session.id,
        PeriodCheckin.status == CheckinStatus.verified
    ).count()

    payment = db.query(Payment).filter(Payment.weekly_session_id == session.id).first()
    if not payment:
        payment = Payment(
            member_id=session.assigned_member_id,
            weekly_session_id=session.id,
        )
        db.add(payment)

    payment.periods_completed = verified_count
    payment.amount = verified_count * settings.PERIOD_SALARY

    # Cập nhật total_earnings của thành viên
    member = db.query(User).filter(User.id == session.assigned_member_id).first()
    if member:
        total = db.query(Payment).filter(
            Payment.member_id == member.id,
            Payment.status == PaymentStatus.pending
        ).all()
        member.total_earnings = sum(p.amount for p in total)


# ===== PAYMENT MANAGEMENT =====
@router.get("/payments", response_model=List[PaymentOut])
def list_payments(
    status: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    q = db.query(Payment)
    if status:
        q = q.filter(Payment.status == status)
    return q.order_by(Payment.created_at.desc()).all()


@router.post("/payments/{payment_id}/mark-paid")
def mark_paid(
    payment_id: int,
    notes: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    from datetime import datetime
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    payment.status = PaymentStatus.paid
    payment.paid_at = datetime.now()
    payment.notes = notes

    if payment.member:
        payment.member.total_earnings = (payment.member.total_earnings or 0.0) + payment.amount

    notif = Notification(
        user_id=payment.member_id,
        title="Đã nhận thanh toán 💰",
        message=f"Admin đã chuyển khoản {payment.amount:,.0f}đ cho ca học {payment.weekly_session_id}.",
        type="payment",
    )
    db.add(notif)
    db.commit()
    return {"message": "Đã đánh dấu thanh toán"}


# ===== STATISTICS =====
@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    total_members = db.query(User).filter(User.role == UserRole.member).count()
    total_sessions = db.query(WeeklySession).count()
    completed_sessions = db.query(WeeklySession).filter(
        WeeklySession.status == SessionStatus.completed
    ).count()
    pending_approval = db.query(WeeklySession).filter(
        WeeklySession.status == SessionStatus.registered
    ).count()
    total_paid = db.query(Payment).filter(Payment.status == PaymentStatus.paid).all()
    return {
        "total_members": total_members,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "pending_approval": pending_approval,
        "total_paid_amount": sum(p.amount for p in total_paid),
        "total_pending_amount": sum(p.amount for p in total_pending),
    }


# ===== NOTIFICATIONS BROADCAST =====
@router.post("/notifications/broadcast")
def broadcast_notification(
    title: str,
    message: str,
    notif_type: str = "info",
    target_user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin gửi thông báo tới tất cả thành viên hoặc một thành viên cụ thể."""
    from app.models import Notification, NotificationType

    try:
        ntype = NotificationType(notif_type)
    except ValueError:
        ntype = NotificationType.info

    if target_user_id:
        target_users = db.query(User).filter(User.id == target_user_id).all()
    else:
        target_users = db.query(User).filter(User.role == UserRole.member).all()

    count = 0
    for u in target_users:
        db.add(Notification(
            user_id=u.id,
            title=title,
            message=message,
            type=ntype,
        ))
        count += 1

    log_activity(
        db, current_user, "NOTIFICATION_BROADCAST",
        f"Gửi thông báo: {title}",
        f"Admin {current_user.full_name} đã gửi thông báo tới {count} thành viên.",
    )

    db.commit()
    return {"message": f"Đã gửi thông báo tới {count} thành viên thành công"}


# ===== FEEDBACK MANAGEMENT =====
@router.get("/feedbacks")
def get_feedbacks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Admin lấy danh sách góp ý/báo lỗi từ thành viên."""
    from app.models import Feedback
    query = db.query(Feedback)
    if status and status != 'all':
        query = query.filter(Feedback.status == status)

    feedbacks = query.order_by(Feedback.created_at.desc()).all()
    res = []
    for f in feedbacks:
        u = f.user
        res.append({
            "id": f.id,
            "user_id": f.user_id,
            "user_name": u.full_name if u else "Khách",
            "user_username": u.username if u else "",
            "type": f.type.value if hasattr(f.type, 'value') else str(f.type),
            "title": f.title,
            "content": f.content,
            "status": f.status.value if hasattr(f.status, 'value') else str(f.status),
            "admin_reply": f.admin_reply,
            "replied_at": f.replied_at,
            "created_at": f.created_at,
        })
    return res


@router.post("/feedbacks/{feedback_id}/reply")
def reply_feedback(
    feedback_id: int,
    reply: str,
    status: str = "replied",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin trả lời góp ý của thành viên."""
    from datetime import datetime
    from app.models import Feedback, FeedbackStatus, Notification, NotificationType

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Góp ý không tồn tại")

    feedback.admin_reply = reply
    feedback.replied_at = datetime.now()

    try:
        feedback.status = FeedbackStatus(status)
    except ValueError:
        feedback.status = FeedbackStatus.replied

    # Gửi thông báo trực tiếp cho thành viên vừa gửi feedback
    db.add(Notification(
        user_id=feedback.user_id,
        title="Admin đã phản hồi góp ý 💬",
        message=f"Phản hồi về '{feedback.title}': {reply}",
        type=NotificationType.info,
    ))

    log_activity(
        db, current_user, "FEEDBACK_REPLY",
        f"Phản hồi góp ý: {feedback.title}",
        f"Admin {current_user.full_name} đã phản hồi góp ý của {feedback.user.full_name if feedback.user else 'thành viên'}.",
        target_id=feedback.id
    )

    db.commit()
    return {"message": "Đã gửi phản hồi thành công"}


# ===== SUBJECT & SCHEDULE SLOT CRUD (ADMIN) =====
@router.post("/subjects", response_model=SubjectOut)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(Subject).filter(Subject.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã môn học đã tồn tại")
    
    subject = Subject(
        code=data.code,
        name=data.name,
        credits=data.credits,
        class_code=data.class_code,
        status=data.status,
        tuition=data.tuition,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    log_activity(
        db, current_user, "SUBJECT_CREATE",
        f"Thêm môn học mới: {subject.name}",
        f"Admin {current_user.full_name} đã thêm môn học {subject.code} - {subject.name}.",
        target_id=subject.id
    )
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Môn học không tồn tại")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)

    log_activity(
        db, current_user, "SUBJECT_UPDATE",
        f"Cập nhật môn học: {subject.name}",
        f"Admin {current_user.full_name} đã cập nhật môn học {subject.code}.",
        target_id=subject.id
    )
    return subject


def _cleanup_session_dependencies(db: Session, session_id: int):
    """Xóa hoặc hủy liên kết tất cả bảng phụ liên quan đến weekly_session_id trước khi xóa ca học."""
    from app.models import PeriodCheckin, Payment, Notification
    from app.models.session import SessionRegistration
    from app.models.payment import MemberRating

    db.query(PeriodCheckin).filter(PeriodCheckin.weekly_session_id == session_id).delete(synchronize_session=False)
    db.query(SessionRegistration).filter(SessionRegistration.weekly_session_id == session_id).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.weekly_session_id == session_id).delete(synchronize_session=False)
    db.query(MemberRating).filter(MemberRating.weekly_session_id == session_id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.related_session_id == session_id).update({"related_session_id": None}, synchronize_session=False)


@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Môn học không tồn tại")

    subject_name = subject.name
    # Delete related sessions & slots
    slots = db.query(ScheduleSlot).filter(ScheduleSlot.subject_id == subject_id).all()
    for slot in slots:
        sessions = db.query(WeeklySession).filter(WeeklySession.schedule_slot_id == slot.id).all()
        for ws in sessions:
            _cleanup_session_dependencies(db, ws.id)
            db.delete(ws)
        db.delete(slot)
    
    db.delete(subject)
    db.commit()

    log_activity(
        db, current_user, "SUBJECT_DELETE",
        f"Xóa môn học: {subject_name}",
        f"Admin {current_user.full_name} đã xóa môn học {subject_name} và toàn bộ lịch liên quan.",
        target_id=subject_id
    )
    return {"message": f"Đã xóa môn học {subject_name}"}


@router.post("/schedule-slots", response_model=ScheduleSlotOut)
def create_schedule_slot(
    data: ScheduleSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    subject = db.query(Subject).filter(Subject.id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Môn học không tồn tại")

    start_t = data.start_time or get_slot_start_time(data.start_period)
    end_t = data.end_time or get_slot_end_time(data.end_period)
    s_type = data.session_type or get_session_type(data.start_period)

    slot = ScheduleSlot(
        subject_id=data.subject_id,
        semester_id=data.semester_id,
        day_of_week=data.day_of_week,
        start_period=data.start_period,
        end_period=data.end_period,
        start_time=start_t,
        end_time=end_t,
        session_type=s_type,
        classroom=data.classroom,
        is_active=True,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    log_activity(
        db, current_user, "SCHEDULE_SLOT_CREATE",
        f"Thêm lịch cố định môn {subject.name}",
        f"Admin {current_user.full_name} đã thêm ca thứ {slot.day_of_week} (tiết {slot.start_period}-{slot.end_period}).",
        target_id=slot.id
    )
    return slot


@router.put("/schedule-slots/{slot_id}", response_model=ScheduleSlotOut)
def update_schedule_slot(
    slot_id: int,
    data: ScheduleSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Lịch học không tồn tại")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(slot, field, value)

    # Recalculate time if periods changed
    if data.start_period:
        slot.start_time = data.start_time or get_slot_start_time(slot.start_period)
        slot.session_type = get_session_type(slot.start_period)
    if data.end_period:
        slot.end_time = data.end_time or get_slot_end_time(slot.end_period)

    db.commit()
    db.refresh(slot)

    log_activity(
        db, current_user, "SCHEDULE_SLOT_UPDATE",
        f"Cập nhật lịch cố định ca #{slot.id}",
        f"Admin {current_user.full_name} đã sửa lịch cố định cho môn {slot.subject.name if slot.subject else 'N/A'}.",
        target_id=slot.id
    )
    return slot


@router.delete("/schedule-slots/{slot_id}")
def delete_schedule_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Lịch học không tồn tại")

    # Delete related sessions
    sessions = db.query(WeeklySession).filter(WeeklySession.schedule_slot_id == slot_id).all()
    for ws in sessions:
        _cleanup_session_dependencies(db, ws.id)
        db.delete(ws)

    subj_name = slot.subject.name if slot.subject else "N/A"
    db.delete(slot)
    db.commit()

    log_activity(
        db, current_user, "SCHEDULE_SLOT_DELETE",
        f"Xóa lịch cố định môn {subj_name}",
        f"Admin {current_user.full_name} đã xóa lịch cố định thứ {slot.day_of_week} tiết {slot.start_period}-{slot.end_period}.",
        target_id=slot_id
    )
    return {"message": "Đã xóa lịch cố định thành công"}


@router.delete("/weekly-sessions/{session_id}")
def delete_weekly_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    ws = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")

    _cleanup_session_dependencies(db, ws.id)
    
    date_str = str(ws.session_date)
    subj_name = ws.schedule_slot.subject.name if (ws.schedule_slot and ws.schedule_slot.subject) else "N/A"
    
    db.delete(ws)
    db.commit()

    log_activity(
        db, current_user, "WEEKLY_SESSION_DELETE",
        f"Xóa ca học ngày {date_str}",
        f"Admin {current_user.full_name} đã xóa ca học môn {subj_name} ngày {date_str}.",
        target_id=session_id
    )
    return {"message": f"Đã xóa ca học ngày {date_str}"}


