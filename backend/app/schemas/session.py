from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.session import SessionStatus
from app.models.checkin import CheckinStatus
from app.models.payment import PaymentStatus
from app.schemas.schedule import ScheduleSlotOut
from app.schemas.auth import UserOut


class WeeklySessionOut(BaseModel):
    id: int
    session_date: date
    status: SessionStatus
    notes: Optional[str]
    approved_at: Optional[datetime]
    registered_at: Optional[datetime]
    schedule_slot: ScheduleSlotOut
    assigned_member: Optional[UserOut]

    class Config:
        from_attributes = True


class WeeklySessionRegister(BaseModel):
    weekly_session_id: int


class WeeklySessionApprove(BaseModel):
    approve: bool
    notes: Optional[str] = None


class PeriodCheckinOut(BaseModel):
    id: int
    period_number: int
    photo_url: Optional[str]
    submitted_at: Optional[datetime]
    status: CheckinStatus
    reject_reason: Optional[str]
    deadline: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentOut(BaseModel):
    id: int
    periods_completed: int
    amount: float
    status: PaymentStatus
    paid_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    weekly_session: Optional[WeeklySessionOut]
    member: Optional[UserOut] = None

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    related_session_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class MemberStatsOut(BaseModel):
    total_sessions: int
    completed_sessions: int
    total_periods: int
    total_earnings: float
    pending_payment: float
    avg_rating: Optional[float]
