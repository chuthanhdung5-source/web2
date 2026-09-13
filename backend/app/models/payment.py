from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weekly_session_id = Column(Integer, ForeignKey("weekly_sessions.id"), nullable=False)
    periods_completed = Column(Integer, default=0)
    amount = Column(Float, default=0.0)          # periods_completed * 35000
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.pending)
    paid_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("User", back_populates="payments", foreign_keys=[member_id])
    weekly_session = relationship("WeeklySession", back_populates="payment")


class NotificationType(str, enum.Enum):
    reminder = "reminder"
    approval = "approval"
    rejection = "rejection"
    payment = "payment"
    warning = "warning"
    info = "info"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SAEnum(NotificationType), default=NotificationType.info)
    is_read = Column(Boolean, default=False)
    related_session_id = Column(Integer, ForeignKey("weekly_sessions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class MemberRating(Base):
    __tablename__ = "member_ratings"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weekly_session_id = Column(Integer, ForeignKey("weekly_sessions.id"), nullable=False)
    rating = Column(Integer)        # 1-5
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("User", back_populates="ratings_received", foreign_keys=[member_id])
