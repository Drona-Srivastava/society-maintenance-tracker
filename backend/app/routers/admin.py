from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_admin

from app.models.complaint import (
    Complaint,
    ComplaintPriority,
    ComplaintStatus,
)
from app.models.complaint_history import ComplaintHistory
from app.models.notice import Notice
from app.models.user import User

from app.schemas.complaint import (
    AdminComplaintResponse,
    ComplaintHistoryResponse,
    ComplaintResponse,
    ComplaintUpdate,
)
from app.schemas.dashboard import (
    ComplaintStats,
    DashboardResponse,
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
    response_model=list[AdminComplaintResponse],
)
def get_all_complaints(
    status_filter: ComplaintStatus | None = Query(
        default=None,
        alias="status",
    ),
    priority: ComplaintPriority | None = None,
    category: str | None = None,
    from_date: datetime | None = Query(
        default=None,
        description="Return complaints created on or after this date",
    ),
    to_date: datetime | None = Query(
        default=None,
        description="Return complaints created before or on this date",
    ),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Complaint).options(
        joinedload(Complaint.resident)
    )

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
            == category.strip().lower()
        )

    if from_date is not None:
        query = query.where(
            Complaint.created_at >= from_date
        )

    if to_date is not None:
        query = query.where(
            Complaint.created_at <= to_date
        )

    overdue_cutoff = datetime.now(timezone.utc) - timedelta(
    days=settings.COMPLAINT_OVERDUE_DAYS
)

    is_overdue = (
        (Complaint.status != ComplaintStatus.RESOLVED)
        & (Complaint.created_at < overdue_cutoff)
    )

    query = (
        query
        .order_by(
            is_overdue.desc(),
            Complaint.created_at.desc(),
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )

    complaints = db.scalars(query).all()

    return [
        AdminComplaintResponse(
            **ComplaintResponse.model_validate(
                complaint
            ).model_dump(),
            resident_name=complaint.resident.name,
            resident_email=complaint.resident.email,
            resident_phone=complaint.resident.phone,
            resident_address=complaint.resident.address,
        )
        for complaint in complaints
    ]


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

            history_parts.append(
                f"Status changed: "
                f"{old_status.value} → {data.status.value}"
            )

        if data.status == ComplaintStatus.RESOLVED:
            complaint.resolved_at = datetime.now(timezone.utc)

        elif data.status == ComplaintStatus.OPEN:
            complaint.resolved_at = None

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

@router.get(
    "/complaints/{complaint_id}/history",
    response_model=list[ComplaintHistoryResponse],
)
def get_complaint_history(
    complaint_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    history = db.scalars(
        select(ComplaintHistory)
        .where(
            ComplaintHistory.complaint_id == complaint_id
        )
        .order_by(ComplaintHistory.created_at.desc())
    ).all()

    return history

@router.get(
    "/dashboard",
    response_model=DashboardResponse,
)
def get_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    overdue_cutoff = now - timedelta(
        days=settings.COMPLAINT_OVERDUE_DAYS
    )

    total_complaints = db.scalar(
        select(func.count(Complaint.id))
    ) or 0

    open_complaints = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.OPEN
        )
    ) or 0

    in_progress_complaints = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.IN_PROGRESS
        )
    ) or 0

    resolved_complaints = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.RESOLVED
        )
    ) or 0

    overdue_complaints = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.status != ComplaintStatus.RESOLVED,
            Complaint.created_at < overdue_cutoff,
        )
    ) or 0

    high_priority_complaints = db.scalar(
        select(func.count(Complaint.id)).where(
            Complaint.priority == ComplaintPriority.HIGH,
            Complaint.status != ComplaintStatus.RESOLVED,
        )
    ) or 0

    total_residents = db.scalar(
        select(func.count(User.id)).where(
            User.role == "resident"
        )
    ) or 0

    total_notices = db.scalar(
        select(func.count(Notice.id))
    ) or 0

    important_notices = db.scalar(
        select(func.count(Notice.id)).where(
            Notice.is_important.is_(True)
        )
    ) or 0

    return DashboardResponse(
        complaints=ComplaintStats(
            total=total_complaints,
            open=open_complaints,
            in_progress=in_progress_complaints,
            resolved=resolved_complaints,
            overdue=overdue_complaints,
            high_priority=high_priority_complaints,
        ),
        total_residents=total_residents,
        total_notices=total_notices,
        important_notices=important_notices,
    )