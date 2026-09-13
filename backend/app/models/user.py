from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, Enum as SAEnum, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    avatar_url = Column(String(500))
    bank_name = Column(String(100))
    bank_account_no = Column(String(50))
    bank_account_name = Column(String(100))
    qr_code_url = Column(String(500))
    role = Column(SAEnum(UserRole), default=UserRole.member, nullable=False)
    total_earnings = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False)
    assigned_sessions = relationship("WeeklySession", back_populates="assigned_member", foreign_keys="WeeklySession.assigned_member_id")
    approved_sessions = relationship("WeeklySession", back_populates="approved_by_user", foreign_keys="WeeklySession.approved_by")
    payments = relationship("Payment", back_populates="member", foreign_keys="Payment.member_id")
    notifications = relationship("Notification", back_populates="user")
    ratings_received = relationship("MemberRating", back_populates="member", foreign_keys="MemberRating.member_id")
