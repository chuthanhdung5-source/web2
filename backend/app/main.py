from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import settings
from app.database import engine, Base
import app.models  # Import tất cả models vào Base.metadata
from app.routers import auth, admin, schedule, member
from app.services.scheduler import start_scheduler

# Tạo tables nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Web Quản Lý Học Hộ",
    description="API quản lý hệ thống học hộ với tracking thời gian thực",
    version="1.0.0",
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://web2-tan-gamma.vercel.app",
]

if settings.FRONTEND_URL:
    for url in settings.FRONTEND_URL.split(","):
        clean_url = url.strip().rstrip("/")
        if clean_url and clean_url not in origins:
            origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes (Hỗ trợ cả route chuẩn và route có prefix /api)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(schedule.router)
app.include_router(member.router)

# Prefix /api compatibility
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(member.router, prefix="/api")

# Serve local uploads (fallback khi chưa có GCS)
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Seed dữ liệu và khởi động scheduler."""
    # Đảm bảo bảng mới luôn được tạo
    Base.metadata.create_all(bind=engine)

    from app.database import SessionLocal
    from app.utils.seed_schedule import seed_schedule, seed_default_semester, seed_default_admin
    from sqlalchemy import text

    db = SessionLocal()
    try:
        # Nâng cấp bảng users tự động
        for col, col_type in [
            ("bank_name", "VARCHAR(100)"),
            ("bank_account_no", "VARCHAR(50)"),
            ("bank_account_name", "VARCHAR(100)"),
            ("qr_code_url", "VARCHAR(500)"),
        ]:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                db.commit()
            except Exception:
                db.rollback()

        # Nâng cấp bảng weekly_sessions
        for col, col_type in [
            ("registered_at", "TIMESTAMP WITH TIME ZONE"),
            ("approved_at", "TIMESTAMP WITH TIME ZONE"),
            ("notes", "TEXT"),
        ]:
            try:
                db.execute(text(f"ALTER TABLE weekly_sessions ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                db.commit()
            except Exception:
                db.rollback()

        # Nâng cấp bảng period_checkins
        try:
            db.execute(text("ALTER TABLE period_checkins ADD COLUMN IF NOT EXISTS reject_reason TEXT;"))
            db.commit()
        except Exception:
            db.rollback()

        # Seed admin mặc định
        seed_default_admin(db)
        # Seed học kỳ và lịch học
        semester_id = seed_default_semester(db)
        seed_schedule(db, semester_id)

        # Xóa môn MAT3382 (Lập trình cho Khoa học dữ liệu) nếu còn trong DB do người dùng đã hủy
        try:
            db.execute(text("""
                DELETE FROM period_checkins 
                WHERE weekly_session_id IN (
                    SELECT ws.id FROM weekly_sessions ws
                    JOIN schedule_slots ss ON ws.schedule_slot_id = ss.id
                    JOIN subjects subj ON ss.subject_id = subj.id
                    WHERE subj.code = 'MAT3382'
                );
                DELETE FROM session_registrations 
                WHERE weekly_session_id IN (
                    SELECT ws.id FROM weekly_sessions ws
                    JOIN schedule_slots ss ON ws.schedule_slot_id = ss.id
                    JOIN subjects subj ON ss.subject_id = subj.id
                    WHERE subj.code = 'MAT3382'
                );
                DELETE FROM weekly_sessions 
                WHERE schedule_slot_id IN (
                    SELECT ss.id FROM schedule_slots ss 
                    JOIN subjects subj ON ss.subject_id = subj.id 
                    WHERE subj.code = 'MAT3382'
                );
                DELETE FROM schedule_slots 
                WHERE subject_id IN (
                    SELECT id FROM subjects WHERE code = 'MAT3382'
                );
                DELETE FROM subjects WHERE code = 'MAT3382';
            """))
            db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()

    # Khởi động APScheduler
    start_scheduler()


@app.get("/")
def root():
    return {"message": "Web Học Hộ API v1.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
