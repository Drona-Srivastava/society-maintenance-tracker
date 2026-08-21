from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5, max_length=500)


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
        min_length=10,
        max_length=20,
    )
    address: str | None = Field(
        default=None,
        min_length=5,
        max_length=500,
    )


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