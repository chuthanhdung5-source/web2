from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class FeedbackStatus(str, enum.Enum):
    pending = "pending"
    replied = "replied"
    resolved = "resolved"


class FeedbackType(str, enum.Enum):
    general = "general"
    bug = "bug"
    suggestion = "suggestion"
    payment_issue = "payment_issue"
    schedule_issue = "schedule_issue"


class Feedback(Base):
    """
    Ý kiến / Góp ý / Báo lỗi từ thành viên gửi tới Admin.
    """
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SAEnum(FeedbackType), default=FeedbackType.general)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(SAEnum(FeedbackStatus), default=FeedbackStatus.pending)
    admin_reply = Column(Text, nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
