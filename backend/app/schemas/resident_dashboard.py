from pydantic import BaseModel

from app.schemas.complaint import ComplaintResponse
from app.schemas.notice import NoticeResponse


class ResidentComplaintStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int


class ResidentDashboardResponse(BaseModel):
    complaints: ResidentComplaintStats
    recent_complaints: list[ComplaintResponse]
    important_notices: list[NoticeResponse]