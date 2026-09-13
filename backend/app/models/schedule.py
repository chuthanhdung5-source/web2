from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.database import Base


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)    # HK1 2026-2027
    start_date = Column(Date)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True)

    schedule_slots = relationship("ScheduleSlot", back_populates="semester")


class ScheduleSlot(Base):
    """
    Một slot lịch cố định (VD: MAT2034 mỗi T4 tiết 5-6).
    Đây là template để tạo ra weekly sessions.
    """
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)    # 2=T2, 3=T3,...7=T7, 8=CN
    session_type = Column(String(10))                # morning | afternoon
    start_period = Column(Integer, nullable=False)   # Tiết bắt đầu (1-12)
    end_period = Column(Integer, nullable=False)     # Tiết kết thúc (1-12)
    start_time = Column(String(5))                   # "07:00"
    end_time = Column(String(5))                     # "08:45"
    classroom = Column(String(100))                  # 513T4502T3
    is_active = Column(Boolean, default=True)

    subject = relationship("Subject", back_populates="schedule_slots")
    semester = relationship("Semester", back_populates="schedule_slots")
    weekly_sessions = relationship("WeeklySession", back_populates="schedule_slot")
