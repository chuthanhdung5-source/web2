from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.douluo import DouluoCultivation, DouluoTransaction
from app.schemas.douluo import (
    CultivationOut,
    CultivateRequest,
    BreakthroughOut,
    RechargeRequest,
    SpendRequest,
    AdminPromoteRequest,
    LeaderboardItem,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/douluo", tags=["Đấu La Đại Lục"])


def get_realm_by_level(level: int) -> str:
    if level <= 10:
        return "Hồn Sĩ"
    elif level <= 20:
        return "Hồn Sư"
    elif level <= 30:
        return "Đại Hồn Sư"
    elif level <= 40:
        return "Hồn Tôn"
    elif level <= 50:
        return "Hồn Tông"
    elif level <= 60:
        return "Hồn Vương"
    elif level <= 70:
        return "Hồn Đế"
    elif level <= 80:
        return "Hồn Thánh"
    elif level <= 90:
        return "Hồn Đấu La"
    elif level <= 98:
        return "Phong Hào Đấu La"
    elif level == 99:
        return "Cực Hạn Đấu La"
    else:
        return "Tu La Thần Vương"


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
            realm_name="Hồn Sĩ",
            exp=0,
            diamonds=88888,
            total_cultivate_seconds=0,
            vip_tier=0,
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
    """Lấy trạng thái tu vi, cảnh giới và số kim cương hiện tại."""
    cult = get_or_create_cultivation(db, current_user)
    
    # Tính EXP offline tự động nếu có thời gian gián đoạn (tối đa 8 giờ offline)
    now = datetime.now(timezone.utc)
    if cult.last_cultivate_at:
        # Chuyển đổi timestamp nếu cần
        last_time = cult.last_cultivate_at
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        
        diff_seconds = int((now - last_time).total_seconds())
        if 5 <= diff_seconds <= 28800:  # từ 5 giây tới 8 tiếng
            # Hệ số VIP
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

    # Tối đa gửi lên 300 giây mỗi lần ping
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
    """Đột phá cảnh giới khi tích lũy đủ EXP."""
    cult = get_or_create_cultivation(db, current_user)
    if cult.level >= 100:
        return BreakthroughOut(
            success=False,
            new_level=100,
            new_realm="Tu La Thần Vương",
            message="Đã đạt cảnh giới Thần Cấp tối thượng, không thể đột phá thêm!",
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

    # Thưởng kim cương khi đột phá
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
    """Nạp VIP 0đ mua kim cương."""
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


@router.post("/spend")
def spend_diamonds(
    payload: SpendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trừ kim cương ảo khi thao tác trên web."""
    cult = get_or_create_cultivation(db, current_user)

    # Nếu không đủ tiền, viện trợ thêm 50k kim cương thay vì chặn
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
        # Tất cả users
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
