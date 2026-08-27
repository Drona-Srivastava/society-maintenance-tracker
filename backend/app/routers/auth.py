from sqlalchemy import select
from sqlalchemy.orm import Session
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
)

from app.services.storage import (
    PROFILE_UPLOAD_DIR,
    save_file,
)

from app.models.password_reset import PasswordResetOTP
from app.services.email import send_password_reset_email

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

def hash_otp(otp: str) -> str:
    return hashlib.sha256(
        otp.encode("utf-8")
    ).hexdigest()


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="resident",
        phone=data.phone,
        address=data.address,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.patch(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if (
        data.name is None
        and data.phone is None
        and data.address is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided",
        )

    if data.name is not None:
        current_user.name = data.name

    if data.phone is not None:
        current_user.phone = data.phone

    if data.address is not None:
        current_user.address = data.address

    db.commit()
    db.refresh(current_user)

    return current_user

@router.post(
    "/profile-picture",
    response_model=UserResponse,
)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    picture_url = await save_file(
        file,
        PROFILE_UPLOAD_DIR,
    )

    current_user.profile_picture_url = picture_url

    db.commit()
    db.refresh(current_user)

    return current_user

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == data.email)
    )

    # Always return the same response.
    # Do not reveal whether an email exists.
    if not user:
        return {
            "message": (
                "If an account exists with this email, "
                "a verification code has been sent."
            )
        }

    # Invalidate previous unused OTPs.
    existing_otps = db.scalars(
        select(PasswordResetOTP).where(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used_at.is_(None),
        )
    ).all()

    for reset in existing_otps:
        reset.used_at = datetime.now(timezone.utc)

    otp = generate_otp()

    reset = PasswordResetOTP(
        user_id=user.id,
        code_hash=hash_otp(otp),
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=10),
        attempts=0,
    )

    db.add(reset)
    db.commit()

    try:
        send_password_reset_email(
            user.email,
            otp,
        )
    except Exception:
        # Do not leave a valid OTP behind if email delivery fails.
        reset.used_at = datetime.now(timezone.utc)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification email. Please try again.",
        )

    return {
        "message": (
            "If an account exists with this email, "
            "a verification code has been sent."
        )
    }

@router.post("/verify-reset-otp")
def verify_reset_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    reset = db.scalar(
        select(PasswordResetOTP)
        .where(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used_at.is_(None),
        )
        .order_by(
            PasswordResetOTP.created_at.desc()
        )
    )

    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    now = datetime.now(timezone.utc)

    if reset.expires_at <= now:
        reset.used_at = now
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    if reset.attempts >= 5:
        reset.used_at = now
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many attempts. Please request a new code.",
        )

    if not secrets.compare_digest(
        reset.code_hash,
        hash_otp(data.otp),
    ):
        reset.attempts += 1
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    return {
        "message": "Verification code is valid."
    }

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    reset = db.scalar(
        select(PasswordResetOTP)
        .where(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used_at.is_(None),
        )
        .order_by(
            PasswordResetOTP.created_at.desc()
        )
    )

    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    now = datetime.now(timezone.utc)

    if reset.expires_at <= now:
        reset.used_at = now
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    if reset.attempts >= 5:
        reset.used_at = now
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many attempts. Please request a new code.",
        )

    if not secrets.compare_digest(
        reset.code_hash,
        hash_otp(data.otp),
    ):
        reset.attempts += 1
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    user.password_hash = hash_password(
        data.new_password
    )

    reset.used_at = now

    db.commit()

    return {
        "message": "Password reset successfully."
    }