from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class SessionStatus(str, enum.Enum):
    open = "open"                # Mở đăng ký
    registered = "registered"   # Thành viên đã đăng ký, chờ duyệt
    approved = "approved"       # Admin đã duyệt
    in_progress = "in_progress" # Đang trong giờ học
    completed = "completed"     # Hoàn thành (hết giờ)
    cancelled = "cancelled"     # Đã hủy


class WeeklySession(Base):
    """
    Một ca học cụ thể trong tuần (instance của ScheduleSlot).
    VD: MAT2034 Thứ 4 ngày 15/09/2026 tiết 5-6.
    """
    __tablename__ = "weekly_sessions"

    id = Column(Integer, primary_key=True, index=True)
    schedule_slot_id = Column(Integer, ForeignKey("schedule_slots.id"), nullable=False)
    session_date = Column(Date, nullable=False)                  # Ngày cụ thể
    status = Column(SAEnum(SessionStatus), default=SessionStatus.open)
    assigned_member_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    registered_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    schedule_slot = relationship("ScheduleSlot", back_populates="weekly_sessions")
    assigned_member = relationship("User", back_populates="assigned_sessions", foreign_keys=[assigned_member_id])
    approved_by_user = relationship("User", back_populates="approved_sessions", foreign_keys=[approved_by])
    period_checkins = relationship("PeriodCheckin", back_populates="weekly_session", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="weekly_session", uselist=False)
