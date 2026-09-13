from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.models.user import User


def log_activity(
    db: Session,
    user: User,
    action_type: str,
    title: str,
    description: str = None,
    target_id: int = None
):
    """
    Ghi nhật ký lịch sử thao tác của Admin / Member vào database.
    """
    try:
        log = ActivityLog(
            user_id=user.id if user else None,
            user_name=user.full_name if user else "Hệ thống",
            user_role=user.role.value if (user and hasattr(user.role, "value")) else (str(user.role) if user else "system"),
            action_type=action_type,
            title=title,
            description=description,
            target_id=target_id
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Lỗi ghi log activity: {e}")
