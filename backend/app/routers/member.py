from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models import User, WeeklySession, PeriodCheckin, Payment, Notification
from app.models.session import SessionStatus
from app.models.checkin import CheckinStatus
from app.models.payment import PaymentStatus
from app.schemas.session import WeeklySessionOut, PeriodCheckinOut, PaymentOut, NotificationOut, MemberStatsOut
from app.middleware.auth import get_current_user
from app.utils.gcs import upload_photo
from app.utils.period_time import (
    get_periods_for_slot, get_checkin_deadline,
    is_checkin_time_valid, PERIOD_SCHEDULE
)
from app.config import settings

router = APIRouter(prefix="/member", tags=["Member"])


# ===== MY SESSIONS =====
@router.get("/sessions", response_model=List[WeeklySessionOut])
def my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lịch học của tôi."""
    return db.query(WeeklySession).filter(
        WeeklySession.assigned_member_id == current_user.id
    ).order_by(WeeklySession.session_date.desc()).all()


@router.post("/sessions/{session_id}/register")
def register_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đăng ký một ca học trống."""
    session = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")
    if session.status != SessionStatus.open:
        raise HTTPException(status_code=400, detail="Ca học này không còn trống")
    if session.session_date < date.today():
        raise HTTPException(status_code=400, detail="Không thể đăng ký ca học đã qua")

    # Kiểm tra thành viên có đang đăng ký ca khác cùng giờ không
    slot = session.schedule_slot
    conflict = db.query(WeeklySession).join(
        WeeklySession.schedule_slot
    ).filter(
        WeeklySession.assigned_member_id == current_user.id,
        WeeklySession.session_date == session.session_date,
        WeeklySession.status.in_([SessionStatus.registered, SessionStatus.approved]),
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="Bạn đã đăng ký ca học cùng ngày")

    session.assigned_member_id = current_user.id
    session.status = SessionStatus.registered
    session.registered_at = datetime.now()

    # Tạo các PeriodCheckin records
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

    db.commit()
    return {"message": "Đã đăng ký ca học, chờ admin duyệt"}


@router.post("/sessions/{session_id}/cancel")
def cancel_registration(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hủy đăng ký ca học (chỉ khi chưa được duyệt)."""
    session = db.query(WeeklySession).filter(
        WeeklySession.id == session_id,
        WeeklySession.assigned_member_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca học")
    if session.status == SessionStatus.approved:
        raise HTTPException(status_code=400, detail="Ca học đã được duyệt, không thể hủy")

    session.status = SessionStatus.open
    session.assigned_member_id = None

    # Xóa checkin records chưa có ảnh
    db.query(PeriodCheckin).filter(
        PeriodCheckin.weekly_session_id == session.id,
        PeriodCheckin.photo_url == None
    ).delete()

    db.commit()
    return {"message": "Đã hủy đăng ký"}


# ===== CHECKIN =====
@router.get("/sessions/{session_id}/checkins", response_model=List[PeriodCheckinOut])
def get_session_checkins(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(WeeklySession).filter(
        WeeklySession.id == session_id,
        WeeklySession.assigned_member_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca học")
    return session.period_checkins


@router.post("/checkin/{checkin_id}/upload")
async def upload_checkin_photo(
    checkin_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload ảnh xác nhận điểm danh cho một tiết."""
    checkin = db.query(PeriodCheckin).filter(PeriodCheckin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiết học")

    session = checkin.weekly_session
    if session.assigned_member_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không phải ca học của bạn")
    if checkin.status == CheckinStatus.verified:
        raise HTTPException(status_code=400, detail="Tiết này đã được xác nhận")
    if checkin.status == CheckinStatus.missed:
        raise HTTPException(status_code=400, detail="Tiết này đã quá hạn nộp ảnh")

    # Kiểm tra thời gian nộp ảnh
    now = datetime.now()
    if not is_checkin_time_valid(checkin.period_number, now, session.session_date):
        # Cho phép nộp trước giờ học 15 phút hoặc trong giờ + 30p buffer
        period_info = PERIOD_SCHEDULE.get(checkin.period_number)
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ được nộp ảnh trong khoảng giờ học tiết {checkin.period_number} "
                   f"({period_info['start'].strftime('%H:%M')}-{period_info['end'].strftime('%H:%M')} ± buffer)"
        )

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh")

    url, filename = await upload_photo(file, folder=f"checkins/{session.id}")

    checkin.photo_url = url
    checkin.photo_filename = filename
    checkin.submitted_at = now
    checkin.status = CheckinStatus.pending

    db.commit()
    return {"message": "Đã nộp ảnh thành công, chờ admin xác nhận", "photo_url": url}


# ===== EARNINGS =====
@router.get("/earnings")
def get_earnings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payments = db.query(Payment).filter(Payment.member_id == current_user.id).all()
    return {
        "total_earned": sum(p.amount for p in payments if p.status == PaymentStatus.paid),
        "pending": sum(p.amount for p in payments if p.status == PaymentStatus.pending),
        "payments": payments,
    }


@router.get("/stats", response_model=MemberStatsOut)
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(WeeklySession).filter(
        WeeklySession.assigned_member_id == current_user.id
    ).all()
    completed = [s for s in sessions if s.status == SessionStatus.completed]
    total_periods = db.query(PeriodCheckin).join(WeeklySession).filter(
        WeeklySession.assigned_member_id == current_user.id,
        PeriodCheckin.status == CheckinStatus.verified
    ).count()

    return MemberStatsOut(
        total_sessions=len(sessions),
        completed_sessions=len(completed),
        total_periods=total_periods,
        total_earnings=current_user.total_earnings,
        pending_payment=sum(
            p.amount for p in db.query(Payment).filter(
                Payment.member_id == current_user.id,
                Payment.status == PaymentStatus.pending
            ).all()
        ),
        avg_rating=None,
    )


# ===== ADMIN INFO (public for members) =====
@router.get("/admin-info")
def get_admin_info(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Thông tin SV của admin (để thành viên biết học hộ ai)."""
    from app.models import AdminProfile
    admin = db.query(User).filter(User.role == "admin", User.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Chưa có thông tin admin")
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == admin.id).first()
    return {
        "full_name": profile.full_name if profile else admin.full_name,
        "student_id": profile.student_id if profile else None,
        "program": profile.program if profile else None,
        "cohort": profile.cohort if profile else None,
        "university": profile.university if profile else None,
        "faculty": profile.faculty if profile else None,
        "class_name": profile.class_name if profile else None,
        "date_of_birth": profile.date_of_birth if profile else None,
        "photo_url": profile.photo_url if profile else None,
        "notes": profile.notes if profile else None,
    }


# ===== NOTIFICATIONS =====
@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models import Notification
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/notifications/{notif_id}/read")
def mark_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models import Notification
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "OK"}
