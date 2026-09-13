"""
Bảng thời gian tiết học chuẩn:
- Buổi sáng: Tiết 1-6, bắt đầu 7:00
- Buổi chiều: Tiết 7-12, bắt đầu 13:00
- Mỗi tiết: 50 phút
- Nghỉ giữa các tiết: 5 phút
- Sau tiết 3 (sáng) và tiết 9 (chiều): nghỉ 10 phút
"""
from datetime import time, datetime, timedelta

PERIOD_SCHEDULE = {
    1:  {"start": time(7, 0),  "end": time(7, 50),  "session": "morning"},
    2:  {"start": time(7, 55), "end": time(8, 45),  "session": "morning"},
    3:  {"start": time(8, 50), "end": time(9, 40),  "session": "morning"},
    4:  {"start": time(9, 50), "end": time(10, 40), "session": "morning"},  # Nghỉ 10p sau tiết 3
    5:  {"start": time(10, 45),"end": time(11, 35), "session": "morning"},
    6:  {"start": time(11, 40),"end": time(12, 30), "session": "morning"},
    7:  {"start": time(13, 0), "end": time(13, 50), "session": "afternoon"},
    8:  {"start": time(13, 55),"end": time(14, 45), "session": "afternoon"},
    9:  {"start": time(14, 50),"end": time(15, 40), "session": "afternoon"},
    10: {"start": time(15, 50),"end": time(16, 40), "session": "afternoon"}, # Nghỉ 10p sau tiết 9
    11: {"start": time(16, 45),"end": time(17, 35), "session": "afternoon"},
    12: {"start": time(17, 40),"end": time(18, 30), "session": "afternoon"},
}


def get_period_info(period_number: int) -> dict:
    """Lấy thông tin tiết học."""
    return PERIOD_SCHEDULE.get(period_number)


def get_period_start_time(period_number: int) -> time:
    return PERIOD_SCHEDULE[period_number]["start"]


def get_period_end_time(period_number: int) -> time:
    return PERIOD_SCHEDULE[period_number]["end"]


def get_slot_start_time(start_period: int) -> str:
    """Lấy giờ bắt đầu ca học (dạng string HH:MM)."""
    t = PERIOD_SCHEDULE[start_period]["start"]
    return f"{t.hour:02d}:{t.minute:02d}"


def get_slot_end_time(end_period: int) -> str:
    """Lấy giờ kết thúc ca học (dạng string HH:MM)."""
    t = PERIOD_SCHEDULE[end_period]["end"]
    return f"{t.hour:02d}:{t.minute:02d}"


def get_session_type(start_period: int) -> str:
    """Xác định ca sáng hay chiều."""
    return PERIOD_SCHEDULE[start_period]["session"]


def get_checkin_deadline(session_date, period_number: int, buffer_minutes: int = 15) -> datetime:
    """
    Tính deadline nộp ảnh cho một tiết.
    Deadline = Giờ kết thúc tiết + buffer (mặc định 15 phút).
    """
    from datetime import datetime, timedelta
    period_end = PERIOD_SCHEDULE[period_number]["end"]
    deadline_dt = datetime.combine(session_date, period_end)
    deadline_dt += timedelta(minutes=buffer_minutes)
    return deadline_dt


def is_checkin_time_valid(period_number: int, submitted_at: datetime, session_date, buffer_before: int = 15, buffer_after: int = 30) -> bool:
    """
    Kiểm tra xem thời gian nộp ảnh có hợp lệ không.
    Hợp lệ: Cho phép nộp từ (giờ tiết bắt đầu - 15 phút) đến (giờ tiết kết thúc + 30 phút).
    """
    if period_number not in PERIOD_SCHEDULE:
        return False
    period_start = PERIOD_SCHEDULE[period_number]["start"]
    period_end = PERIOD_SCHEDULE[period_number]["end"]

    valid_from = datetime.combine(session_date, period_start) - timedelta(minutes=buffer_before)
    valid_to = datetime.combine(session_date, period_end) + timedelta(minutes=buffer_after)

    # Make timezone-naive comparison
    if submitted_at.tzinfo:
        submitted_naive = submitted_at.replace(tzinfo=None)
    else:
        submitted_naive = submitted_at

    return valid_from <= submitted_naive <= valid_to


def get_periods_for_slot(start_period: int, end_period: int) -> list[int]:
    """Lấy danh sách các tiết trong một ca."""
    return list(range(start_period, end_period + 1))
