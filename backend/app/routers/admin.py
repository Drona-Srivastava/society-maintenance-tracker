from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.complaint import (
    Complaint,
    ComplaintPriority,
    ComplaintStatus,
)
from app.models.complaint_history import ComplaintHistory
from app.models.user import User
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintUpdate,
)

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

def is_valid_status_transition(
    old_status: ComplaintStatus,
    new_status: ComplaintStatus,
) -> bool:
    allowed_transitions = {
        ComplaintStatus.OPEN: {
            ComplaintStatus.IN_PROGRESS,
        },
        ComplaintStatus.IN_PROGRESS: {
            ComplaintStatus.OPEN,
            ComplaintStatus.RESOLVED,
        },
        ComplaintStatus.RESOLVED: {
            ComplaintStatus.OPEN,
        },
    }

    return (
        new_status == old_status
        or new_status in allowed_transitions.get(
            old_status,
            set(),
        )
    )
    
@router.get(
    "/complaints",
    response_model=list[ComplaintResponse],
)
def get_all_complaints(
    status_filter: ComplaintStatus | None = Query(
        default=None,
        alias="status",
    ),
    priority: ComplaintPriority | None = None,
    category: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Complaint)

    if status_filter is not None:
        query = query.where(
            Complaint.status == status_filter
        )

    if priority is not None:
        query = query.where(
            Complaint.priority == priority
        )

    if category is not None:
        query = query.where(
            func.lower(Complaint.category)
            == category.lower()
        )

    query = (
        query
        .order_by(Complaint.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    return db.scalars(query).all()

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

    if (
        data.status is None
        and data.priority is None
        and data.note is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided",
        )

    old_status = complaint.status
    old_priority = complaint.priority

    history_parts: list[str] = []

    # Status change
    if data.status is not None:
        if not is_valid_status_transition(
            old_status,
            data.status,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid status transition: "
                    f"{old_status.value} → {data.status.value}"
                ),
            )
        if data.status != old_status:
            complaint.status = data.status

    # Priority change
    if data.priority is not None:
        if data.priority != old_priority:
            complaint.priority = data.priority

            history_parts.append(
                f"Priority changed: "
                f"{old_priority.value} → {data.priority.value}"
            )

    # Admin note
    if data.note:
        history_parts.append(
            f"Admin note: {data.note}"
        )

    # Create audit record if anything changed
    if history_parts:
        history = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=current_user.id,
            old_status=(
                old_status.value
                if data.status is not None
                and data.status != old_status
                else None
            ),
            new_status=(
                data.status.value
                if data.status is not None
                and data.status != old_status
                else old_status.value
            ),
            note=" | ".join(history_parts),
        )

        db.add(history)

    db.commit()
    db.refresh(complaint)

    return complaint