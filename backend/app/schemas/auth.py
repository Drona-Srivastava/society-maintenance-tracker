from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)
import re

PHONE_PATTERN = r"\+?\d{10,15}"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(max_length=16)
    address: str = Field(min_length=5, max_length=500)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if not re.fullmatch(PHONE_PATTERN, value):
            raise ValueError(
                "Phone number must contain 10–15 digits "
                "and may optionally start with +"
            )

        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    phone: str | None = Field(
        default=None,
        max_length=16,
    )
    address: str | None = Field(
        default=None,
        min_length=5,
        max_length=500,
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if value is None:
            return value

        if not re.fullmatch(PHONE_PATTERN, value):
            raise ValueError(
                "Phone number must contain 10–15 digits "
                "and may optionally start with +"
            )

        return value


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: str | None
    address: str | None
    profile_picture_url: str | None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse