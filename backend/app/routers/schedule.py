from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models import ScheduleSlot, WeeklySession, Semester, Subject
from app.models.session import SessionStatus
from app.schemas.schedule import ScheduleSlotOut, SemesterOut, SubjectOut
from app.schemas.session import WeeklySessionOut
from app.middleware.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/schedule", tags=["Schedule"])


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Subject).all()


@router.get("/semesters", response_model=List[SemesterOut])
def list_semesters(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Semester).order_by(Semester.start_date.desc()).all()


@router.get("/slots", response_model=List[ScheduleSlotOut])
def list_slots(
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    q = db.query(ScheduleSlot).filter(ScheduleSlot.is_active == True)
    if semester_id:
        q = q.filter(ScheduleSlot.semester_id == semester_id)
    return q.all()


@router.get("/weekly-sessions", response_model=List[WeeklySessionOut])
def list_weekly_sessions(
    week_start: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Lấy danh sách ca học theo tuần."""
    if not week_start:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)
    q = db.query(WeeklySession).filter(
        WeeklySession.session_date >= week_start,
        WeeklySession.session_date <= week_end,
    )
    if status:
        q = q.filter(WeeklySession.status == status)

    return q.order_by(WeeklySession.session_date, WeeklySession.id).all()


@router.get("/available-sessions", response_model=List[WeeklySessionOut])
def get_available_sessions(
    week_start: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Lấy các ca học còn trống (chưa có người đăng ký) để thành viên xem."""
    if not week_start:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)
    return db.query(WeeklySession).filter(
        WeeklySession.session_date >= week_start,
        WeeklySession.session_date <= week_end,
        WeeklySession.status == SessionStatus.open,
    ).order_by(WeeklySession.session_date).all()


@router.post("/generate-weekly-sessions")
def generate_weekly_sessions(
    week_start: date,
    semester_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """
    Admin gọi endpoint này để tự động tạo ca học cho 1 tuần.
    Dựa vào ScheduleSlots để tạo WeeklySessions cho từng ngày.
    """
    DAY_MAP = {2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6}  # T2=Monday,...,CN=Sunday

    slots = db.query(ScheduleSlot).filter(
        ScheduleSlot.semester_id == semester_id,
        ScheduleSlot.is_active == True
    ).all()

    created = 0
    for slot in slots:
        offset = DAY_MAP.get(slot.day_of_week, 0)
        session_date = week_start + timedelta(days=offset)

        existing = db.query(WeeklySession).filter(
            WeeklySession.schedule_slot_id == slot.id,
            WeeklySession.session_date == session_date,
        ).first()

        if not existing:
            ws = WeeklySession(
                schedule_slot_id=slot.id,
                session_date=session_date,
                status=SessionStatus.open,
            )
            db.add(ws)
            created += 1

    db.commit()
    return {"message": f"Đã tạo {created} ca học mới cho tuần {week_start}"}


@router.delete("/weekly-sessions/{session_id}")
def delete_weekly_session_in_schedule(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import PeriodCheckin, Payment, Notification
    from app.models.session import SessionRegistration
    from app.models.payment import MemberRating
    from app.utils.activity import log_activity
    from fastapi import HTTPException

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền xóa ca học")

    ws = db.query(WeeklySession).filter(WeeklySession.id == session_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Ca học không tồn tại")

    db.query(PeriodCheckin).filter(PeriodCheckin.weekly_session_id == ws.id).delete(synchronize_session=False)
    db.query(SessionRegistration).filter(SessionRegistration.weekly_session_id == ws.id).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.weekly_session_id == ws.id).delete(synchronize_session=False)
    db.query(MemberRating).filter(MemberRating.weekly_session_id == ws.id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.related_session_id == ws.id).update({"related_session_id": None}, synchronize_session=False)
    
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

