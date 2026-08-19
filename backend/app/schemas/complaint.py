from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.complaint import ComplaintPriority, ComplaintStatus

from typing import Optional

class ComplaintCreate(BaseModel):
    category: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str = Field(
        min_length=5,
        max_length=5000,
    )


class ComplaintResponse(BaseModel):
    id: int
    resident_id: int
    category: str
    description: str
    photo_url: str | None
    status: ComplaintStatus
    priority: ComplaintPriority
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    actor_id: int
    old_status: str | None
    new_status: str
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    note: Optional[str] = Field(
        default=None,
        max_length=1000,
    )