from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import settings
from app.database import engine, Base
from app.routers import auth, admin, schedule, member
from app.services.scheduler import start_scheduler

# Tạo tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Web Quản Lý Học Hộ",
    description="API quản lý hệ thống học hộ với tracking thời gian thực",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(schedule.router)
app.include_router(member.router)

# Serve local uploads (fallback khi chưa có GCS)
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Seed dữ liệu và khởi động scheduler."""
    from app.database import SessionLocal
    from app.utils.seed_schedule import seed_schedule, seed_default_semester, seed_default_admin

    db = SessionLocal()
    try:
        # Seed admin mặc định
        seed_default_admin(db)
        # Seed học kỳ và lịch học
        semester_id = seed_default_semester(db)
        seed_schedule(db, semester_id)
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
