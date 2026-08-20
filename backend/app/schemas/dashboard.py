from pydantic import BaseModel


class ComplaintStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    overdue: int
    high_priority: int


class DashboardResponse(BaseModel):
    complaints: ComplaintStats
    total_residents: int
    total_notices: int
    important_notices: int