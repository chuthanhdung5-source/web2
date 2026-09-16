from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone, timedelta
from typing import List
import json

from app.database import get_db
from app.models.user import User, UserRole
from app.models.douluo import DouluoCultivation, DouluoTransaction
from app.schemas.douluo import (
    CultivationOut,
    CultivateRequest,
    BreakthroughOut,
    RechargeRequest,
    MineRequest,
    SpendRequest,
    AdminPromoteRequest,
    LeaderboardItem,
    PurchaseRequest,
    ExtendSessionRequest,
    AdminMemberCultivationOut,
    AdminUpdateMemberCultivationRequest,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/douluo", tags=["Đấu La Đại Lục"])


def get_realm_by_level(level: int) -> str:
    if level <= 10:
        return "Tọa Sơn Bàn Cuối"
    elif level <= 20:
        return "Trụ Thạch Núp Lùm"
    elif level <= 30:
        return "Hư Ảo Gật Đầu"
    elif level <= 40:
        return 'Biến Âm Hô "CÓ!"'
    elif level <= 50:
        return "Thần Bút Ký Hộ"
    elif level <= 60:
        return "Thiền Định Ngủ Mở Mắt"
    elif level <= 70:
        return "Nghịch Chuyển Bàn Đầu"
    elif level <= 80:
        return "Lăng Ba Chuồn Cửa"
    elif level <= 99:
        return "Vạn Ca Học Hộ Đấu La"
    else:
        return "Núp Lùm Chi Thần"


def get_exp_needed(level: int) -> int:
    if level >= 100:
        return 999999999
    if level < 10:
        return level * 60  # 1 phút/cấp ban đầu
    if level < 20:
        return level * 100
    if level < 40:
        return level * 180
    if level < 60:
        return level * 300
    if level < 80:
        return level * 500
    if level < 90:
        return level * 800
    if level < 99:
        return level * 1500
    return 100000


def get_or_create_cultivation(db: Session, user: User) -> DouluoCultivation:
    cult = db.query(DouluoCultivation).filter(DouluoCultivation.user_id == user.id).first()
    if not cult:
        cult = DouluoCultivation(
            user_id=user.id,
            level=1,
            realm_name="Tọa Sơn Bàn Cuối",
            exp=0,
            diamonds=88888,
            total_cultivate_seconds=0,
            vip_tier=0,
            purchased_items="[]",
            session_expiry=None,
            is_enabled=True,
            last_cultivate_at=datetime.now(timezone.utc),
        )
        db.add(cult)
        db.commit()
        db.refresh(cult)
    return cult


@router.get("/me", response_model=CultivationOut)
def get_my_cultivation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cult = get_or_create_cultivation(db, current_user)
    
    expected_realm = get_realm_by_level(cult.level)
    if cult.realm_name != expected_realm:
        cult.realm_name = expected_realm
        db.commit()
        db.refresh(cult)

    now = datetime.now(timezone.utc)
    if cult.last_cultivate_at:
        last_time = cult.last_cultivate_at
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        
        diff_seconds = int((now - last_time).total_seconds())
        if 5 <= diff_seconds <= 28800:
            multiplier = 1.0 + (cult.vip_tier * 0.5)
            earned_exp = int(diff_seconds * multiplier)
            cult.exp += earned_exp
            cult.total_cultivate_seconds += diff_seconds
            cult.last_cultivate_at = now
            db.commit()
            db.refresh(cult)

    exp_needed = get_exp_needed(cult.level)
    return CultivationOut(
        id=cult.id,
        user_id=cult.user_id,
        user_name=current_user.full_name,
        level=cult.level,
        realm_name=cult.realm_name,
        exp=cult.exp,
        exp_needed=exp_needed,
        diamonds=cult.diamonds,
        total_cultivate_seconds=cult.total_cultivate_seconds,
        custom_title=cult.custom_title,
        vip_tier=cult.vip_tier,
        purchased_items=cult.purchased_items or "[]",
        session_expiry=cult.session_expiry,
        is_enabled=cult.is_enabled,
        last_cultivate_at=cult.last_cultivate_at,
    )


@router.post("/cultivate")
def cultivate_heartbeat(
    payload: CultivateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Đồng bộ thời gian bế quan tu luyện từ client (1s, 1p, 1h...)."""
    cult = get_or_create_cultivation(db, current_user)
    now = datetime.now(timezone.utc)

    seconds = min(payload.seconds, 300)
    multiplier = 1.0 + (cult.vip_tier * 0.5)
    earned_exp = int(seconds * multiplier)

    cult.exp += earned_exp
    cult.total_cultivate_seconds += seconds
    cult.last_cultivate_at = now
    db.commit()
    db.refresh(cult)

    return {
        "success": True,
        "added_exp": earned_exp,
        "current_exp": cult.exp,
        "exp_needed": get_exp_needed(cult.level),
        "total_seconds": cult.total_cultivate_seconds,
        "level": cult.level,
        "realm_name": cult.realm_name,
    }


@router.post("/breakthrough", response_model=BreakthroughOut)
def breakthrough(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cult = get_or_create_cultivation(db, current_user)
    if cult.level >= 100:
        return BreakthroughOut(
            success=False,
            new_level=100,
            new_realm="Núp Lùm Chi Thần",
            message="Đã đạt cảnh giới Núp Lùm Chi Thần tối thượng, không thể đột phá thêm!",
            exp=cult.exp,
            exp_needed=999999999,
        )

    needed = get_exp_needed(cult.level)
    if cult.exp < needed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hồn lực chưa đủ! Cần {needed} EXP để đột phá, hiện có {cult.exp} EXP.",
        )

    cult.exp -= needed
    cult.level += 1
    cult.realm_name = get_realm_by_level(cult.level)

    reward_diamonds = cult.level * 1000
    cult.diamonds += reward_diamonds

    tx = DouluoTransaction(
        user_id=cult.user_id,
        amount=reward_diamonds,
        action_type="cultivate_reward",
        description=f"Thưởng đột phá cảnh giới lên Cấp {cult.level} ({cult.realm_name})",
    )
    db.add(tx)
    db.commit()
    db.refresh(cult)

    return BreakthroughOut(
        success=True,
        new_level=cult.level,
        new_realm=cult.realm_name,
        message=f"🎉 Chúc mừng Hồn Sư đã đột phá thành công lên Cấp {cult.level} ({cult.realm_name}), nhận {reward_diamonds:,} 💎!",
        exp=cult.exp,
        exp_needed=get_exp_needed(cult.level),
    )


@router.post("/buy-diamonds")
def buy_diamonds(
    payload: RechargeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """(Chỉ Admin) Nạp VIP 0đ mua kim cương số lượng lớn."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền nạp các gói VIP triệu Kim Cương! Thành viên vui lòng vào Mỏ Hồn Thạch để gõ nhặt kim cương nhé!",
        )

    cult = get_or_create_cultivation(db, current_user)
    cult.diamonds += payload.diamonds
    if payload.vip_tier > cult.vip_tier:
        cult.vip_tier = payload.vip_tier

    tx = DouluoTransaction(
        user_id=cult.user_id,
        amount=payload.diamonds,
        action_type="recharge",
        description=f"Nạp 0đ gói {payload.pack_name} (+{payload.diamonds:,} 💎)",
    )
    db.add(tx)
    db.commit()
    db.refresh(cult)

    return {
        "success": True,
        "message": f"Nạp thành công {payload.diamonds:,} 💎 từ gói {payload.pack_name}!",
        "diamonds": cult.diamonds,
        "vip_tier": cult.vip_tier,
    }


@router.post("/mine-diamonds")
def mine_diamonds(
    payload: MineRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Member gõ mỏ nhặt kim cương (mỗi lần bấm +10 💎)."""
    cult = get_or_create_cultivation(db, current_user)
    clicks = min(payload.clicks, 200)
    earned = clicks * 10
    cult.diamonds += earned
    db.commit()
    db.refresh(cult)

    return {
        "success": True,
        "earned": earned,
        "diamonds": cult.diamonds,
        "message": f"Khai thác được +{earned} 💎!",
    }


@router.post("/spend")
def spend_diamonds(
    payload: SpendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trừ kim cương ảo khi thao tác trên web."""
    cult = get_or_create_cultivation(db, current_user)

    if cult.diamonds < payload.amount:
        cult.diamonds += 50000

    cult.diamonds = max(0, cult.diamonds - payload.amount)

    tx = DouluoTransaction(
        user_id=cult.user_id,
        amount=-payload.amount,
        action_type="spend",
        description=payload.reason,
    )
    db.add(tx)
    db.commit()
    db.refresh(cult)

    return {
        "success": True,
        "diamonds": cult.diamonds,
        "spent": payload.amount,
        "reason": payload.reason,
    }


@router.post("/purchase")
def purchase_privilege(
    payload: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mua đặc quyền, theme skin, huy hiệu bằng kim cương."""
    cult = get_or_create_cultivation(db, current_user)

    try:
        purchased = json.loads(cult.purchased_items or "[]")
    except Exception:
        purchased = []

    if payload.item_id in purchased and not payload.item_id.startswith("consumable_"):
        return {
            "success": True,
            "message": "Bạn đã sở hữu đặc quyền này rồi!",
            "diamonds": cult.diamonds,
            "purchased_items": cult.purchased_items,
            "item_id": payload.item_id,
        }

    if cult.diamonds < payload.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không đủ kim cương! Cần {payload.price:,} 💎 nhưng bạn chỉ có {cult.diamonds:,} 💎. Hãy đào khoáng hoặc bế quan thêm!",
        )

    cult.diamonds -= payload.price

    if payload.item_id not in purchased:
        purchased.append(payload.item_id)
        cult.purchased_items = json.dumps(purchased)

    if payload.item_id == "vip_badge":
        cult.vip_tier = max(cult.vip_tier, 1)
        if not cult.custom_title or cult.custom_title in ["Hồn Sĩ Tân Thủ", "Tân Thủ Hộ Đạo"]:
            cult.custom_title = "Vô Ảnh Chí Tôn"

    tx = DouluoTransaction(
        user_id=cult.user_id,
        amount=-payload.price,
        action_type="purchase",
        description=f"Mua đặc quyền: {payload.item_name}",
    )
    db.add(tx)
    db.commit()
    db.refresh(cult)

    return {
        "success": True,
        "message": f"🎉 Mua thành công {payload.item_name}!",
        "diamonds": cult.diamonds,
        "purchased_items": cult.purchased_items,
        "vip_tier": cult.vip_tier,
        "custom_title": cult.custom_title,
        "item_id": payload.item_id,
    }


@router.post("/extend-session")
def extend_session(
    payload: ExtendSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Gia hạn thời gian phiên làm việc bằng kim cương."""
    cult = get_or_create_cultivation(db, current_user)

    if cult.diamonds < payload.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không đủ kim cương gia hạn! Cần {payload.price:,} 💎, hiện có {cult.diamonds:,} 💎.",
        )

    cult.diamonds -= payload.price
    now = datetime.now(timezone.utc)
    base_time = cult.session_expiry if (cult.session_expiry and cult.session_expiry > now) else now
    cult.session_expiry = base_time + timedelta(minutes=payload.minutes)

    tx = DouluoTransaction(
        user_id=cult.user_id,
        amount=-payload.price,
        action_type="extend_session",
        description=f"Gia hạn phiên làm việc +{payload.minutes} phút",
    )
    db.add(tx)
    db.commit()
    db.refresh(cult)

    return {
        "success": True,
        "message": f"⏳ Đã gia hạn thành công thêm {payload.minutes} phút!",
        "diamonds": cult.diamonds,
        "session_expiry": cult.session_expiry,
        "minutes_added": payload.minutes,
    }


@router.post("/toggle")
def toggle_douluo_mode(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bật/tắt chế độ Đấu La Đại Lục cá nhân."""
    cult = get_or_create_cultivation(db, current_user)
    cult.is_enabled = not cult.is_enabled
    db.commit()
    return {"is_enabled": cult.is_enabled}


@router.get("/leaderboard", response_model=List[LeaderboardItem])
def get_leaderboard(
    db: Session = Depends(get_db),
):
    """Bảng xếp hạng Hồn Sư toàn bộ hệ thống."""
    cults = (
        db.query(DouluoCultivation, User)
        .join(User, DouluoCultivation.user_id == User.id)
        .order_by(
            desc(DouluoCultivation.level),
            desc(DouluoCultivation.total_cultivate_seconds),
            desc(DouluoCultivation.diamonds),
        )
        .limit(20)
        .all()
    )

    result = []
    for idx, (c, u) in enumerate(cults, 1):
        result.append(
            LeaderboardItem(
                rank=idx,
                user_id=u.id,
                user_name=u.full_name,
                avatar_url=u.avatar_url,
                level=c.level,
                realm_name=c.realm_name,
                custom_title=c.custom_title,
                diamonds=c.diamonds,
                total_cultivate_seconds=c.total_cultivate_seconds,
                vip_tier=c.vip_tier,
            )
        )
    return result


@router.post("/admin/promote")
def admin_promote(
    payload: AdminPromoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """(Chỉ Admin) Sắc phong cảnh giới, cấp độ, kim cương cho 1 người hoặc TẤT CẢ thành viên."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ có Giáo Hoàng / Admin mới có quyền sắc phong Hồn Sư!",
        )

    targets = []
    if payload.target_type == "all":
        all_users = db.query(User).filter(User.is_active == True).all()
        for u in all_users:
            targets.append(get_or_create_cultivation(db, u))
    else:
        if not payload.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng chọn thành viên cần sắc phong",
            )
        target_user = db.query(User).filter(User.id == payload.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy thành viên")
        targets.append(get_or_create_cultivation(db, target_user))

    count = 0
    for cult in targets:
        if payload.level is not None:
            cult.level = max(1, min(100, payload.level))
            cult.realm_name = get_realm_by_level(cult.level)
        if payload.diamonds_add is not None and payload.diamonds_add > 0:
            cult.diamonds += payload.diamonds_add
            tx = DouluoTransaction(
                user_id=cult.user_id,
                amount=payload.diamonds_add,
                action_type="admin_promote",
                description=f"Admin sắc phong ban thưởng +{payload.diamonds_add:,} 💎",
            )
            db.add(tx)
        if payload.custom_title is not None:
            cult.custom_title = payload.custom_title.strip() or None
        count += 1

    db.commit()

    target_desc = "tất cả thành viên" if payload.target_type == "all" else f"thành viên ID {payload.user_id}"
    return {
        "success": True,
        "message": f"✅ Đã ban sắc lệnh nâng cấp thành công cho {count} người ({target_desc})!",
        "affected_count": count,
    }


@router.get("/admin/member/{user_id}", response_model=AdminMemberCultivationOut)
def admin_get_member_cultivation(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ có Giáo Hoàng / Admin mới có quyền truy cập!",
        )
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên")

    cult = get_or_create_cultivation(db, target_user)
    items = []
    if cult.purchased_items:
        try:
            items = json.loads(cult.purchased_items)
            if not isinstance(items, list):
                items = []
        except Exception:
            items = []

    return AdminMemberCultivationOut(
        id=cult.id,
        user_id=target_user.id,
        user_name=target_user.full_name,
        username=target_user.username,
        level=cult.level,
        realm_name=cult.realm_name,
        exp=cult.exp,
        exp_needed=get_exp_needed(cult.level),
        diamonds=cult.diamonds,
        total_cultivate_seconds=cult.total_cultivate_seconds,
        custom_title=cult.custom_title,
        vip_tier=cult.vip_tier,
        purchased_items=items,
        is_enabled=cult.is_enabled,
    )


@router.put("/admin/member/{user_id}", response_model=AdminMemberCultivationOut)
def admin_update_member_cultivation(
    user_id: int,
    payload: AdminUpdateMemberCultivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ có Giáo Hoàng / Admin mới có quyền chỉnh sửa tu vi!",
        )
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên")

    cult = get_or_create_cultivation(db, target_user)

    if payload.level is not None:
        cult.level = max(1, min(100, payload.level))
        cult.realm_name = get_realm_by_level(cult.level)

    if payload.diamonds is not None:
        old_d = cult.diamonds
        cult.diamonds = max(0, payload.diamonds)
        diff = cult.diamonds - old_d
        if diff != 0:
            tx = DouluoTransaction(
                user_id=cult.user_id,
                amount=diff,
                action_type="admin_set",
                description=f"Admin điều chỉnh số dư thành {cult.diamonds:,} 💎",
            )
            db.add(tx)
    elif payload.diamonds_add is not None and payload.diamonds_add != 0:
        cult.diamonds = max(0, cult.diamonds + payload.diamonds_add)
        tx = DouluoTransaction(
            user_id=cult.user_id,
            amount=payload.diamonds_add,
            action_type="admin_promote",
            description=f"Admin thưởng/phạt kim cương ({payload.diamonds_add:+,} 💎)",
        )
        db.add(tx)

    if payload.custom_title is not None:
        cult.custom_title = payload.custom_title.strip() or None

    if payload.vip_tier is not None:
        cult.vip_tier = max(0, min(4, payload.vip_tier))

    if payload.purchased_items is not None:
        clean_items = list(dict.fromkeys(payload.purchased_items))
        cult.purchased_items = json.dumps(clean_items)

    if payload.exp is not None:
        cult.exp = max(0, payload.exp)

    if payload.total_cultivate_seconds is not None:
        cult.total_cultivate_seconds = max(0, payload.total_cultivate_seconds)

    if payload.is_enabled is not None:
        cult.is_enabled = payload.is_enabled

    db.commit()
    db.refresh(cult)

    items = []
    if cult.purchased_items:
        try:
            items = json.loads(cult.purchased_items)
            if not isinstance(items, list):
                items = []
        except Exception:
            items = []

    return AdminMemberCultivationOut(
        id=cult.id,
        user_id=target_user.id,
        user_name=target_user.full_name,
        username=target_user.username,
        level=cult.level,
        realm_name=cult.realm_name,
        exp=cult.exp,
        exp_needed=get_exp_needed(cult.level),
        diamonds=cult.diamonds,
        total_cultivate_seconds=cult.total_cultivate_seconds,
        custom_title=cult.custom_title,
        vip_tier=cult.vip_tier,
        purchased_items=items,
        is_enabled=cult.is_enabled,
    )

