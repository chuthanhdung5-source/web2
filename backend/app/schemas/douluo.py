from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CultivationOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    level: int
    realm_name: str
    exp: int
    exp_needed: int
    diamonds: int
    total_cultivate_seconds: int
    custom_title: Optional[str] = None
    vip_tier: int
    purchased_items: Optional[str] = "[]"
    session_expiry: Optional[datetime] = None
    is_enabled: bool
    last_cultivate_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PurchaseRequest(BaseModel):
    item_id: str
    item_name: str
    price: int = Field(ge=0)


class ExtendSessionRequest(BaseModel):
    minutes: int = Field(default=10, ge=1)
    price: int = Field(default=100, ge=0)


class CultivateRequest(BaseModel):
    seconds: int = Field(default=1, ge=1, le=86400, description="Số giây bế quan tu luyện gửi lên")


class BreakthroughOut(BaseModel):
    success: bool
    new_level: int
    new_realm: str
    message: str
    exp: int
    exp_needed: int


class RechargeRequest(BaseModel):
    vip_tier: int = Field(ge=0, le=4)
    diamonds: int = Field(ge=1)
    pack_name: str


class MineRequest(BaseModel):
    clicks: int = Field(default=1, ge=1, le=200, description="Số lần gõ nhặt kim cương")


class SpendRequest(BaseModel):
    amount: int = Field(ge=1)
    reason: str


class AdminPromoteRequest(BaseModel):
    target_type: str = Field(description="'all' hoặc 'user'")
    user_id: Optional[int] = None
    level: Optional[int] = Field(None, ge=1, le=100)
    diamonds_add: Optional[int] = Field(None, ge=0)
    custom_title: Optional[str] = None


class AdminMemberCultivationOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    username: Optional[str] = None
    level: int
    realm_name: str
    exp: int
    exp_needed: int
    diamonds: int
    total_cultivate_seconds: int
    custom_title: Optional[str] = None
    vip_tier: int
    purchased_items: List[str] = []
    is_enabled: bool


class AdminUpdateMemberCultivationRequest(BaseModel):
    level: Optional[int] = Field(None, ge=1, le=100)
    diamonds: Optional[int] = Field(None, ge=0)
    diamonds_add: Optional[int] = None
    custom_title: Optional[str] = None
    vip_tier: Optional[int] = Field(None, ge=0, le=4)
    purchased_items: Optional[List[str]] = None
    exp: Optional[int] = None
    total_cultivate_seconds: Optional[int] = None
    is_enabled: Optional[bool] = None


class LeaderboardItem(BaseModel):
    rank: int
    user_id: int
    user_name: str
    avatar_url: Optional[str] = None
    level: int
    realm_name: str
    custom_title: Optional[str] = None
    diamonds: int
    total_cultivate_seconds: int
    vip_tier: int
