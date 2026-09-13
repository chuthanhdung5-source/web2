from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, UserRole, AdminProfile, Subject, Semester, ScheduleSlot, WeeklySession, PeriodCheckin, Payment, Notification, ActivityLog
from app.models.checkin import CheckinStatus
from app.models.session import SessionStatus
from app.models.payment import PaymentStatus
from app.schemas.auth import UserOut
from app.schemas.schedule import AdminProfileOut, AdminProfileUpdate, SubjectOut, ScheduleSlotOut
from app.schemas.session import WeeklySessionOut, PaymentOut, NotificationOut, MemberStatsOut
from app.middleware.auth import require_admin, get_current_user
from app.utils.gcs import upload_photo
from app.utils.activity import log_activity
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
    total_pending = db.query(Payment).filter(Payment.status == PaymentStatus.pending).all()

    return {
        "total_members": total_members,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "pending_approval": pending_approval,
        "total_paid_amount": sum(p.amount for p in total_paid),
        "total_pending_amount": sum(p.amount for p in total_pending),
    }
