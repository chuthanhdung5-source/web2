from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base


class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_id = Column(String(20))          # Mã sinh viên
    full_name = Column(String(100))          # Tên SV (có thể khác display name)
    program = Column(String(100), default="68 Khoa học dữ liệu")
    cohort = Column(String(20), default="QH.2023.T.CQ")
    university = Column(String(200), default="Đại học Quốc gia Hà Nội")
    faculty = Column(String(200))
    class_name = Column(String(50))
    date_of_birth = Column(Date)
    id_card = Column(String(20))             # CCCD/CMND (để học hộ)
    notes = Column(Text)                     # Ghi chú cho thành viên
    photo_url = Column(String(500))          # Ảnh SV (để nhận diện)

    user = relationship("User", back_populates="admin_profile")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False)      # MAT2034
    name = Column(String(200), nullable=False)     # Giải tích số
    credits = Column(Integer)
    class_code = Column(String(50))                # MAT2034 1
    status = Column(String(100))                   # Đăng ký học lại / lần đầu
    tuition = Column(Float, default=0.0)

    schedule_slots = relationship("ScheduleSlot", back_populates="subject")
