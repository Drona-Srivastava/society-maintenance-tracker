from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoticeCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=200,
    )
    content: str = Field(
        min_length=5,
        max_length=10000,
    )
    is_important: bool = False


class NoticeUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )
    content: str | None = Field(
        default=None,
        min_length=5,
        max_length=10000,
    )
    is_important: bool | None = None


class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    is_important: bool
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)