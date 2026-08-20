from fastapi import APIRouter, Depends, status, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.complaint import Complaint, ComplaintPriority
from app.models.complaint_history import ComplaintHistory
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintHistoryResponse,
    ComplaintResponse,
)


router = APIRouter(
    prefix="/api/complaints",
    tags=["Complaints"],
)

@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_complaint(
    category: str = Form(...),
    description: str = Form(...),
    photo: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo_url = None

    if photo is not None:
        from app.services.storage import save_file

        photo_url = await save_file(photo)

    complaint = Complaint(
        resident_id=current_user.id,
        category=category,
        description=description,
        photo_url=photo_url,
        status="open",
        priority=ComplaintPriority.MEDIUM,
    )

    db.add(complaint)
    db.flush()

    history = ComplaintHistory(
        complaint_id=complaint.id,
        actor_id=current_user.id,
        old_status=None,
        new_status="open",
        note="Complaint created",
    )

    db.add(history)

    db.commit()
    db.refresh(complaint)

    return complaint
    

@router.get(
    "",
    response_model=list[ComplaintResponse],
)
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaints = db.scalars(
        select(Complaint)
        .where(Complaint.resident_id == current_user.id)
        .order_by(Complaint.created_at.desc())
    ).all()

    return complaints

@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse,
)
def get_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this complaint",
        )

    return complaint


@router.get(
    "/{complaint_id}/history",
    response_model=list[ComplaintHistoryResponse],
)
def get_complaint_history(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this complaint",
        )

    history = db.scalars(
        select(ComplaintHistory)
        .where(ComplaintHistory.complaint_id == complaint_id)
        .order_by(ComplaintHistory.created_at.asc())
    ).all()

    return history