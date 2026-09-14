from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, UserOut, UserUpdate,
    PasswordChange, ForgotPasswordRequest
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    # Mọi tài khoản tạo qua Đăng ký đều là MEMBER (thành viên/người học hộ)
    # Admin là tài khoản hệ thống sẵn có, không được tạo qua Đăng ký
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=UserRole.member,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Đặt lại mật khẩu cho người dùng khi quên mật khẩu (xác minh qua username và email đã đăng ký)."""
    user = db.query(User).filter(
        User.username == data.username,
        User.email == data.email
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập hoặc Email không chính xác")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa, vui lòng liên hệ Admin")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    from app.models import ActivityLog
    log = ActivityLog(
        user_id=user.id,
        user_name=user.full_name,
        user_role=user.role,
        action_type="PASSWORD_RESET",
        title="Khôi phục mật khẩu qua Quên mật khẩu",
        description=f"Tài khoản @{user.username} ({user.full_name}) đã tự đặt lại mật khẩu thành công.",
        target_id=user.id
    )
    db.add(log)
    db.commit()

    return {"message": "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới."}
