from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DouluoCultivation(Base):
    __tablename__ = "douluo_cultivations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    level = Column(Integer, default=1, nullable=False)
    realm_name = Column(String(50), default="Hồn Sĩ", nullable=False)
    exp = Column(BigInteger, default=0, nullable=False)
    diamonds = Column(BigInteger, default=88888, nullable=False)
    total_cultivate_seconds = Column(BigInteger, default=0, nullable=False)
    last_cultivate_at = Column(DateTime(timezone=True), server_default=func.now())
    custom_title = Column(String(100), nullable=True)
    vip_tier = Column(Integer, default=0, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", backref="douluo_cultivation")


class DouluoTransaction(Base):
    __tablename__ = "douluo_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)  # Dương (+) hoặc Âm (-)
    action_type = Column(String(50), nullable=False)  # recharge, spend, cultivate_reward, admin_promote
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", backref="douluo_transactions")
