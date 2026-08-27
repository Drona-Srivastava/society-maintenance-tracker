from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.complaint import Complaint, ComplaintStatus
from app.models.notice import Notice
from app.models.user import User
from app.schemas.resident_dashboard import (
    ResidentComplaintStats,
    ResidentDashboardResponse,
)


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "",
    response_model=ResidentDashboardResponse,
)
def get_resident_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resident_id = current_user.id

    total = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.resident_id == resident_id
        )
    ) or 0

    open_count = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.resident_id == resident_id,
            Complaint.status == ComplaintStatus.OPEN,
        )
    ) or 0

    in_progress = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.resident_id == resident_id,
            Complaint.status == ComplaintStatus.IN_PROGRESS,
        )
    ) or 0

    resolved = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.resident_id == resident_id,
            Complaint.status == ComplaintStatus.RESOLVED,
        )
    ) or 0

    recent_complaints = db.scalars(
        select(Complaint)
        .where(Complaint.resident_id == resident_id)
        .order_by(Complaint.created_at.desc())
        .limit(5)
    ).all()

    important_notices = db.scalars(
        select(Notice)
        .where(Notice.is_important.is_(True))
        .order_by(Notice.created_at.desc())
        .limit(5)
    ).all()

    return ResidentDashboardResponse(
        complaints=ResidentComplaintStats(
            total=total,
            open=open_count,
            in_progress=in_progress,
            resolved=resolved,
        ),
        recent_complaints=recent_complaints,
        important_notices=important_notices,
    )