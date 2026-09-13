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
    is_checkin_time_valid, PERIOD_SCHEDULE, get_vietnam_now
)
from app.config import settings

from app.utils.activity import log_activity
from app.models.activity_log import ActivityLog

router = APIRouter(prefix="/member", tags=["Member"])


@router.post("/upload-qr")
async def upload_payment_qr(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload ảnh mã QR chuyển khoản cá nhân."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh")

    url, filename = await upload_photo(file, folder=f"qr/{current_user.id}")
    current_user.qr_code_url = url
    db.commit()
    db.refresh(current_user)

    log_activity(
        db, current_user, "QR_UPLOAD",
        "Cập nhật mã QR thanh toán",
        f"Thành viên {current_user.full_name} đã tải lên mã QR nhận tiền mới."
    )
    return {"message": "Đã lưu mã QR thanh toán thành công", "qr_code_url": url}


# ===== MY SESSIONS =====
@router.get("/sessions", response_model=List[WeeklySessionOut])
def my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lịch học của tôi (bao gồm ca được phân công & ca đang đăng ký chờ duyệt)."""
    from app.models.session import SessionRegistration, RegistrationStatus
    reg_session_ids = [
        r.weekly_session_id for r in db.query(SessionRegistration).filter(
            SessionRegistration.member_id == current_user.id,
            SessionRegistration.status == RegistrationStatus.pending
        ).all()
    ]
    return db.query(WeeklySession).filter(
        (WeeklySession.assigned_member_id == current_user.id) |
        (WeeklySession.id.in_(reg_session_ids))
    ).order_by(WeeklySession.session_date.desc()).all()


@router.post("/sessions/{session_id}/register")
def register_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đăng ký một ca học (cho phép nhiều thành viên cùng đăng ký chờ duyệt)."""
    from app.models.session import SessionRegistration, RegistrationStatus
    session = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")
    if session.status in [SessionStatus.approved, SessionStatus.completed, SessionStatus.cancelled]:
        raise HTTPException(status_code=400, detail="Ca học này đã được duyệt hoặc đóng")
    if session.session_date < date.today():
        raise HTTPException(status_code=400, detail="Không thể đăng ký ca học đã qua")

    # Kiểm tra nếu thành viên đã đăng ký ca này rồi
    existing = db.query(SessionRegistration).filter(
        SessionRegistration.weekly_session_id == session_id,
        SessionRegistration.member_id == current_user.id,
        SessionRegistration.status == RegistrationStatus.pending
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã đăng ký ca học này rồi, đang chờ admin duyệt")

    slot = session.schedule_slot
    now = datetime.now()

    # Thêm record đăng ký mới vào bảng xếp hàng
    reg = SessionRegistration(
        weekly_session_id=session.id,
        member_id=current_user.id,
        registered_at=now,
        status=RegistrationStatus.pending
    )
    db.add(reg)

    session.status = SessionStatus.registered
    if not session.registered_at:
        session.registered_at = now

    db.commit()

    # Đếm thứ tự đăng ký của thành viên trong ca này
    order_num = db.query(SessionRegistration).filter(
        SessionRegistration.weekly_session_id == session.id,
        SessionRegistration.status == RegistrationStatus.pending
    ).count()

    log_activity(
        db, current_user, "SESSION_REGISTER",
        f"Đăng ký ca học môn {slot.subject.name if slot else 'N/A'} (Thứ tự #{order_num})",
        f"Thành viên {current_user.full_name} đã đăng ký ca học ngày {session.session_date} (xếp vị trí #{order_num}).",
        target_id=session.id
    )

    return {"message": f"Đã đăng ký ca học thành công (Xếp vị trí thứ #{order_num}), chờ admin duyệt"}


@router.post("/sessions/{session_id}/cancel")
def cancel_registration(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hủy đăng ký ca học (chỉ khi chưa được duyệt)."""
    from app.models.session import SessionRegistration, RegistrationStatus
    session = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca học")
    if session.status == SessionStatus.approved:
        raise HTTPException(status_code=400, detail="Ca học đã được duyệt, không thể hủy")

    reg = db.query(SessionRegistration).filter(
        SessionRegistration.weekly_session_id == session_id,
        SessionRegistration.member_id == current_user.id
    ).first()

    if not reg:
        raise HTTPException(status_code=400, detail="Bạn chưa đăng ký ca học này")

    db.delete(reg)

    # Kiểm tra xem còn ai đăng ký ca này không
    remaining_count = db.query(SessionRegistration).filter(
        SessionRegistration.weekly_session_id == session_id,
        SessionRegistration.status == RegistrationStatus.pending
    ).count()

    if remaining_count == 0:
        session.status = SessionStatus.open
        session.assigned_member_id = None

    db.commit()

    log_activity(
        db, current_user, "SESSION_CANCEL_REGISTER",
        f"Hủy đăng ký ca học môn {session.schedule_slot.subject.name if session.schedule_slot else 'N/A'}",
        f"Thành viên {current_user.full_name} đã hủy đăng ký ca học ngày {session.session_date}.",
        target_id=session.id
    )

    return {"message": "Đã hủy đăng ký ca học thành công"}



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

    # Kiểm tra thời gian nộp ảnh (dùng UTC chuẩn để lưu DB và quy đổi hiển thị Frontend)
    # Nếu bị từ chối, admin đã yêu cầu nộp lại nên cho phép nộp khắc phục ảnh
    now = datetime.utcnow()
    is_reupload = (checkin.status == CheckinStatus.rejected)

    if not is_reupload and not is_checkin_time_valid(checkin.period_number, now, session.session_date):
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
    checkin.reject_reason = None  # Xóa lý do từ chối cũ khi nộp lại ảnh mới

    db.commit()

    log_activity(
        db, current_user, "PHOTO_REUPLOAD" if is_reupload else "PHOTO_UPLOAD",
        f"{'Nộp lại' if is_reupload else 'Nộp'} ảnh điểm danh tiết {checkin.period_number}",
        f"Thành viên {current_user.full_name} đã {'nộp lại' if is_reupload else 'nộp'} ảnh điểm danh tiết {checkin.period_number} cho ca học ngày {session.session_date}.",
        target_id=checkin.id
    )

    return {"message": "Đã nộp ảnh thành công, chờ admin xác nhận", "photo_url": url}


@router.get("/activity-logs")
def get_member_activity_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy nhật ký hoạt động cá nhân của thành viên."""
    return db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(100).all()



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


# ===== MEMBER FEEDBACK =====
@router.post("/feedbacks")
def create_feedback(
    title: str,
    content: str,
    feedback_type: str = "general",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thành viên gửi góp ý/báo lỗi cho Admin."""
    from app.models import Feedback, FeedbackType, FeedbackStatus

    try:
        ftype = FeedbackType(feedback_type)
    except ValueError:
        ftype = FeedbackType.general

    feedback = Feedback(
        user_id=current_user.id,
        type=ftype,
        title=title,
        content=content,
        status=FeedbackStatus.pending,
    )
    db.add(feedback)

    log_activity(
        db, current_user, "FEEDBACK_SUBMIT",
        f"Gửi góp ý: {title}",
        f"Thành viên {current_user.full_name} đã gửi một góp ý/báo lỗi tới Admin.",
    )

    db.commit()
    return {"message": "Cảm ơn bạn! Góp ý đã được gửi tới Admin"}


@router.get("/feedbacks")
def get_my_feedbacks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các góp ý cá nhân đã gửi cho Admin."""
    from app.models import Feedback
    feedbacks = db.query(Feedback).filter(
        Feedback.user_id == current_user.id
    ).order_by(Feedback.created_at.desc()).all()

    res = []
    for f in feedbacks:
        res.append({
            "id": f.id,
            "type": f.type.value if hasattr(f.type, 'value') else str(f.type),
            "title": f.title,
            "content": f.content,
            "status": f.status.value if hasattr(f.status, 'value') else str(f.status),
            "admin_reply": f.admin_reply,
            "replied_at": f.replied_at,
            "created_at": f.created_at,
        })
    return res
