from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class CheckinStatus(str, enum.Enum):
    pending = "pending"       # Đã upload, chờ verify
    verified = "verified"     # Admin xác nhận OK
    rejected = "rejected"     # Admin từ chối
    missed = "missed"         # Không nộp ảnh đúng hạn


class PeriodCheckin(Base):
    """
    Ảnh xác nhận cho từng tiết trong một ca học.
    VD: Ca MAT2034 tiết 5-6 → 2 PeriodCheckin (tiết 5, tiết 6).
    """
    __tablename__ = "period_checkins"

    id = Column(Integer, primary_key=True, index=True)
    weekly_session_id = Column(Integer, ForeignKey("weekly_sessions.id"), nullable=False)
    period_number = Column(Integer, nullable=False)    # Tiết số mấy (1-12)
    photo_url = Column(String(500))                   # GCS URL
    photo_filename = Column(String(200))
    submitted_at = Column(DateTime(timezone=True))
    status = Column(SAEnum(CheckinStatus), default=CheckinStatus.pending)
    reject_reason = Column(Text)
    deadline = Column(DateTime(timezone=True))        # Thời hạn nộp ảnh
    verified_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    weekly_session = relationship("WeeklySession", back_populates="period_checkins")
