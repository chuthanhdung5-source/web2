"""
Seed dữ liệu lịch học từ OCR ảnh thời khóa biểu.
Chương trình: 68 Khoa học dữ liệu — QH.2023.T.CQ
"""
from sqlalchemy.orm import Session
from app.models import Subject, Semester, ScheduleSlot
from app.utils.period_time import get_slot_start_time, get_slot_end_time, get_session_type


SUBJECTS_DATA = [
    {
        "code": "MAT2034",
        "name": "Giải tích số",
        "credits": 3,
        "class_code": "MAT2034 1",
        "status": "Đăng ký học lại",
        "tuition": 577800.0,
        "slots": [
            {"day": 4, "start_period": 5, "end_period": 6, "classroom": "513T4"},   # T4, tiết 5-6
            {"day": 6, "start_period": 1, "end_period": 2, "classroom": "502T3"},   # T6, tiết 1-2
        ]
    },
    {
        "code": "MAT3382",
        "name": "Lập trình cho Khoa học dữ liệu",
        "credits": 2,
        "class_code": "MAT3382 1",
        "status": "Đăng ký lần đầu",
        "tuition": 0.0,
        "slots": [
            {"day": 2, "start_period": 9, "end_period": 10, "classroom": "303T4 Phong May"},  # T2, tiết 9-10
            {"day": 3, "start_period": 1, "end_period": 2, "classroom": "303T4 Phong May"},  # T3, tiết 1-2
        ]
    },
    {
        "code": "MAT3390",
        "name": "Nhập môn Tin sinh học",
        "credits": 3,
        "class_code": "MAT3390 2",
        "status": "Đăng ký lần đầu",
        "tuition": 0.0,
        "slots": [
            {"day": 4, "start_period": 1, "end_period": 2, "classroom": "202T5 Phong May"},  # T4, tiết 1-2
            {"day": 5, "start_period": 7, "end_period": 8, "classroom": "202T5 Phong May"},  # T5, tiết 7-8
        ]
    },
    {
        "code": "MAT3381",
        "name": "Thực tập thực tế về Khoa học dữ liệu",
        "credits": 3,
        "class_code": "MAT3381 1",
        "status": "Đăng ký lần đầu",
        "tuition": 0.0,
        "slots": [
            # T7, CN — tiết "13-13" → Thực tập (không có phòng, linh hoạt)
            # Tạm hiểu là học từ 7h sáng T7 (tiết 1) — admin có thể điều chỉnh
            {"day": 7, "start_period": 1, "end_period": 6, "classroom": "Thực tập (liên hệ admin)"},
            {"day": 8, "start_period": 1, "end_period": 6, "classroom": "Thực tập (liên hệ admin)"},
        ]
    },
    {
        "code": "MAT3392",
        "name": "Ứng dụng dữ liệu lớn trong quản lý rủi ro tài biến thiên nhiên",
        "credits": 3,
        "class_code": "MAT3392",
        "status": "Đăng ký lần đầu",
        "tuition": 0.0,
        "slots": [
            {"day": 2, "start_period": 3, "end_period": 4, "classroom": "302T4"},  # T2, tiết 3-4
            {"day": 4, "start_period": 3, "end_period": 4, "classroom": "509T3"},  # T4, tiết 3-4
        ]
    },
    {
        "code": "MAT3399",
        "name": "Xử lý ngôn ngữ tự nhiên và học sâu",
        "credits": 3,
        "class_code": "MAT3399 2",
        "status": "Đăng ký lần đầu",
        "tuition": 0.0,
        "slots": [
            {"day": 2, "start_period": 7, "end_period": 8, "classroom": "201T5 Phong May"},   # T2, tiết 7-8
            {"day": 3, "start_period": 10, "end_period": 12, "classroom": "201T5 Phong May"}, # T3, tiết 10-12
        ]
    },
]


def seed_schedule(db: Session, semester_id: int):
    """Seed toàn bộ lịch học vào database."""
    for subj_data in SUBJECTS_DATA:
        # Tạo hoặc cập nhật môn học
        subject = db.query(Subject).filter(Subject.code == subj_data["code"]).first()
        if not subject:
            subject = Subject(
                code=subj_data["code"],
                name=subj_data["name"],
                credits=subj_data["credits"],
                class_code=subj_data["class_code"],
                status=subj_data["status"],
                tuition=subj_data["tuition"],
            )
            db.add(subject)
            db.flush()

        # Tạo schedule slots
        for slot_data in subj_data["slots"]:
            existing = db.query(ScheduleSlot).filter(
                ScheduleSlot.subject_id == subject.id,
                ScheduleSlot.semester_id == semester_id,
                ScheduleSlot.day_of_week == slot_data["day"],
                ScheduleSlot.start_period == slot_data["start_period"],
            ).first()

            if not existing:
                slot = ScheduleSlot(
                    subject_id=subject.id,
                    semester_id=semester_id,
                    day_of_week=slot_data["day"],
                    start_period=slot_data["start_period"],
                    end_period=slot_data["end_period"],
                    start_time=get_slot_start_time(slot_data["start_period"]),
                    end_time=get_slot_end_time(slot_data["end_period"]),
                    session_type=get_session_type(slot_data["start_period"]),
                    classroom=slot_data["classroom"],
                )
                db.add(slot)

    db.commit()
    print("[OK] Seed schedule completed!")



def seed_default_semester(db: Session) -> int:
    """Tạo học kỳ mặc định nếu chưa có."""
    from datetime import date
    semester = db.query(Semester).filter(Semester.name == "HK1 2026-2027").first()
    if not semester:
        semester = Semester(
            name="HK1 2026-2027",
            start_date=date(2026, 9, 1),
            end_date=date(2027, 1, 15),
            is_active=True,
        )
        db.add(semester)
        db.commit()
        db.refresh(semester)
    return semester.id


def seed_default_admin(db: Session):
    """Seed hoặc cập nhật mật khẩu tài khoản admin mặc định (admin / admin123456)."""
    from app.models import User, UserRole
    from app.utils.security import hash_password

    admin = db.query(User).filter(User.role == UserRole.admin).first()
    if not admin:
        admin_user = User(
            username="admin",
            email="admin@webhocho.com",
            password_hash=hash_password("admin123456"),
            full_name="Quản Trị Viên",
            phone="0900000000",
            role=UserRole.admin,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("[OK] Default admin created (admin / admin123456)")
    else:
        admin.password_hash = hash_password("admin123456")
        db.commit()
        print("[OK] Admin password updated to admin123456")

