from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole, AdminProfile, Subject, Semester, ScheduleSlot, WeeklySession, PeriodCheckin, Payment, Notification
from app.models.checkin import CheckinStatus
from app.models.session import SessionStatus
from app.models.payment import PaymentStatus
from app.schemas.auth import UserOut
from app.schemas.schedule import AdminProfileOut, AdminProfileUpdate, SubjectOut, ScheduleSlotOut
from app.schemas.session import WeeklySessionOut, PaymentOut, NotificationOut, MemberStatsOut
from app.middleware.auth import require_admin, get_current_user
from app.utils.gcs import upload_photo
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
    _: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.member).first()
    if not user:
        raise HTTPException(status_code=404, detail="Thành viên không tồn tại")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
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
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    from datetime import datetime
    session = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")
    if session.status != SessionStatus.registered:
        raise HTTPException(status_code=400, detail="Ca học không ở trạng thái chờ duyệt")

    session.status = SessionStatus.approved if approve else SessionStatus.open
    session.approved_by = current_user.id if approve else None
    session.approved_at = datetime.now() if approve else None
    session.notes = notes

    if not approve:
        session.assigned_member_id = None

    # Tạo thông báo cho thành viên
    if session.assigned_member_id:
        notif = Notification(
            user_id=session.assigned_member_id,
            title="Ca học đã được duyệt ✅" if approve else "Ca học bị từ chối ❌",
            message=f"Ca học ngày {session.session_date} {'đã được admin duyệt' if approve else 'bị từ chối'}. {notes or ''}",
            type="approval" if approve else "rejection",
            related_session_id=session.id,
        )
        db.add(notif)

    db.commit()
    return {"message": "Đã duyệt" if approve else "Đã từ chối"}


@router.post("/sessions/{session_id}/assign")
def assign_session(
    session_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
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
    return {"message": f"Đã phân công ca học cho {member.full_name}"}


# ===== CHECKIN REVIEW =====
@router.get("/checkins/pending")
def get_pending_checkins(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    checkins = db.query(PeriodCheckin).filter(
        PeriodCheckin.status == CheckinStatus.pending
    ).order_by(PeriodCheckin.submitted_at).all()
    return checkins


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
    return {"message": "Đã xác nhận" if approve else "Đã từ chối"}


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
