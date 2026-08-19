from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.user import User
from app.schemas.complaint import ComplaintResponse

from datetime import datetime, timezone

from app.models.complaint import (
    Complaint,
    ComplaintPriority,
    ComplaintStatus,
)
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintUpdate,
)

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)

@router.get(
    "/complaints",
    response_model=list[ComplaintResponse],
)
def get_all_complaints(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    complaints = db.scalars(
        select(Complaint)
        .order_by(Complaint.created_at.desc())
    ).all()

    return complaints

@router.patch(
    "/complaints/{complaint_id}",
    response_model=ComplaintResponse,
)
def update_complaint(
    complaint_id: int,
    data: ComplaintUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    old_status = complaint.status

    if data.status is not None:
        complaint.status = data.status

        if data.status == ComplaintStatus.RESOLVED:
            complaint.resolved_at = datetime.now(timezone.utc)

    if data.priority is not None:
        complaint.priority = data.priority

    if data.status is not None:
        history = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=current_user.id,
            old_status=old_status,
            new_status=data.status,
            note=data.note,
        )

        db.add(history)

    db.commit()
    db.refresh(complaint)

    return complaint