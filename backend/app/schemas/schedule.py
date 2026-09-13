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


class SubjectCreate(BaseModel):
    code: str
    name: str
    credits: Optional[int] = 3
    class_code: Optional[str] = None
    status: Optional[str] = "Đăng ký lần đầu"
    tuition: Optional[float] = 0.0


class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    credits: Optional[int] = None
    class_code: Optional[str] = None
    status: Optional[str] = None
    tuition: Optional[float] = None


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


class ScheduleSlotCreate(BaseModel):
    subject_id: int
    semester_id: int
    day_of_week: int  # 2: Monday, ..., 8: Sunday
    start_period: int
    end_period: int
    classroom: Optional[str] = "Chưa có phòng"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    session_type: Optional[str] = None


class ScheduleSlotUpdate(BaseModel):
    subject_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_period: Optional[int] = None
    end_period: Optional[int] = None
    classroom: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleSlotOut(BaseModel):
    id: int
    subject_id: int
    semester_id: Optional[int] = None
    day_of_week: int
    session_type: Optional[str]
    start_period: int
    end_period: int
    start_time: Optional[str]
    end_time: Optional[str]
    classroom: Optional[str]
    is_active: Optional[bool] = True
    subject: SubjectOut

    class Config:
        from_attributes = True

