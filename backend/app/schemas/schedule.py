from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class AdminProfileOut(BaseModel):
    student_id: Optional[str]
    full_name: Optional[str]
    program: Optional[str]
    cohort: Optional[str]
    university: Optional[str]
    faculty: Optional[str]
    class_name: Optional[str]
    date_of_birth: Optional[date]
    notes: Optional[str]
    photo_url: Optional[str]

    class Config:
        from_attributes = True


class AdminProfileUpdate(BaseModel):
    student_id: Optional[str] = None
    full_name: Optional[str] = None
    program: Optional[str] = None
    cohort: Optional[str] = None
    university: Optional[str] = None
    faculty: Optional[str] = None
    class_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    id_card: Optional[str] = None
    notes: Optional[str] = None


class SubjectOut(BaseModel):
    id: int
    code: str
    name: str
    credits: Optional[int]
    class_code: Optional[str]
    status: Optional[str]
    tuition: Optional[float]

    class Config:
        from_attributes = True


class SemesterOut(BaseModel):
    id: int
    name: str
    start_date: Optional[date]
    end_date: Optional[date]
    is_active: bool

    class Config:
        from_attributes = True


class ScheduleSlotOut(BaseModel):
    id: int
    subject_id: int
    day_of_week: int
    session_type: Optional[str]
    start_period: int
    end_period: int
    start_time: Optional[str]
    end_time: Optional[str]
    classroom: Optional[str]
    subject: SubjectOut

    class Config:
        from_attributes = True
