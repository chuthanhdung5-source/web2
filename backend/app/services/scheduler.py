"""
APScheduler jobs:
1. Auto-mark missed check-ins khi hết hạn nộp ảnh
2. Auto-complete sessions khi đã hết giờ học
3. Gửi thông báo nhắc trước ca học 30 phút
"""
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

scheduler = BackgroundScheduler(timezone="Asia/Ho_Chi_Minh")


def mark_missed_checkins():
    """Tự động đánh dấu 'missed' cho các tiết đã qua deadline mà chưa có ảnh."""
    from app.database import SessionLocal
    from app.models import PeriodCheckin, Notification, WeeklySession
    from app.models.checkin import CheckinStatus
    from app.models.session import SessionStatus

    db: Session = SessionLocal()
    try:
        now = datetime.now()
        missed = db.query(PeriodCheckin).filter(
            PeriodCheckin.status == CheckinStatus.pending,
            PeriodCheckin.photo_url == None,
            PeriodCheckin.deadline < now,
        ).all()

        for checkin in missed:
            checkin.status = CheckinStatus.missed
            session = checkin.weekly_session
            if session and session.assigned_member_id:
                notif = Notification(
                    user_id=session.assigned_member_id,
                    title="⚠️ Bỏ lỡ tiết học!",
                    message=f"Tiết {checkin.period_number} ngày {session.session_date} đã bị đánh dấu bỏ tiết vì không nộp ảnh đúng hạn.",
                    type="warning",
                    related_session_id=session.id,
                )
                db.add(notif)

        if missed:
            db.commit()
            print(f"[Scheduler] Marked {len(missed)} check-ins as missed")

    except Exception as e:
        print(f"[Scheduler] Error in mark_missed_checkins: {e}")
        db.rollback()
    finally:
        db.close()


def auto_complete_sessions():
    """Tự động complete các ca học đã qua ngày."""
    from app.database import SessionLocal
    from app.models import WeeklySession, Payment, PeriodCheckin
    from app.models.session import SessionStatus
    from app.models.checkin import CheckinStatus
    from app.config import settings
    from datetime import date

    db: Session = SessionLocal()
    try:
        yesterday = date.today()
        sessions_to_complete = db.query(WeeklySession).filter(
            WeeklySession.session_date < yesterday,
            WeeklySession.status == SessionStatus.approved,
        ).all()

        for session in sessions_to_complete:
            session.status = SessionStatus.completed

            # Tính payment
            verified_count = db.query(PeriodCheckin).filter(
                PeriodCheckin.weekly_session_id == session.id,
                PeriodCheckin.status == CheckinStatus.verified
            ).count()

            if verified_count > 0 and session.assigned_member_id:
                from app.models import Payment
                from app.models.payment import PaymentStatus
                existing = db.query(Payment).filter(
                    Payment.weekly_session_id == session.id
                ).first()
                if not existing:
                    payment = Payment(
                        member_id=session.assigned_member_id,
                        weekly_session_id=session.id,
                        periods_completed=verified_count,
                        amount=verified_count * settings.PERIOD_SALARY,
                        status=PaymentStatus.pending,
                    )
                    db.add(payment)

        if sessions_to_complete:
            db.commit()
            print(f"[Scheduler] Completed {len(sessions_to_complete)} sessions")

    except Exception as e:
        print(f"[Scheduler] Error in auto_complete_sessions: {e}")
        db.rollback()
    finally:
        db.close()


def send_session_reminders():
    """Gửi thông báo nhắc trước ca học 30 phút."""
    from app.database import SessionLocal
    from app.models import WeeklySession, Notification
    from app.models.session import SessionStatus
    from app.utils.period_time import PERIOD_SCHEDULE
    from datetime import date, timedelta

    db: Session = SessionLocal()
    try:
        today = date.today()
        now = datetime.now()
        target_time = (now + timedelta(minutes=30)).time()

        approved_sessions = db.query(WeeklySession).filter(
            WeeklySession.session_date == today,
            WeeklySession.status == SessionStatus.approved,
            WeeklySession.assigned_member_id != None,
        ).all()

        for session in approved_sessions:
            slot = session.schedule_slot
            from datetime import datetime as dt, time
            period_start = PERIOD_SCHEDULE.get(slot.start_period, {}).get("start")
            if not period_start:
                continue

            # Gửi nếu còn khoảng 25-35 phút
            now_time = now.time()
            from datetime import timedelta as td
            lower = (dt.combine(today, period_start) - td(minutes=35)).time()
            upper = (dt.combine(today, period_start) - td(minutes=25)).time()

            if lower <= now_time <= upper:
                # Kiểm tra chưa gửi thông báo hôm nay
                existing = db.query(Notification).filter(
                    Notification.user_id == session.assigned_member_id,
                    Notification.related_session_id == session.id,
                    Notification.type == "reminder",
                ).first()
                if not existing:
                    notif = Notification(
                        user_id=session.assigned_member_id,
                        title="🔔 Ca học sắp bắt đầu!",
                        message=f"Ca {session.schedule_slot.subject.name} sẽ bắt đầu lúc {slot.start_time}. Nhớ đến lớp và chuẩn bị chụp ảnh!",
                        type="reminder",
                        related_session_id=session.id,
                    )
                    db.add(notif)

        db.commit()
    except Exception as e:
        print(f"[Scheduler] Error in send_session_reminders: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(mark_missed_checkins, "interval", minutes=5, id="mark_missed")
    scheduler.add_job(auto_complete_sessions, "cron", hour=1, minute=0, id="auto_complete")
    scheduler.add_job(send_session_reminders, "interval", minutes=5, id="reminders")
    scheduler.start()
    print("[OK] Scheduler started")

