from math import ceil
from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException,
    File,
    Form,
    UploadFile,
    Query,
)
from sqlalchemy import select, func
from sqlalchemy.orm import Session


from app.core.database import get_db
from app.core.security import get_current_user
from app.models.complaint import Complaint, ComplaintPriority
from app.models.complaint_history import ComplaintHistory
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintHistoryResponse,
    ComplaintResponse,
    ComplaintListResponse,
)
from app.services.storage import (
    COMPLAINT_UPLOAD_DIR,
    download_file,
    save_file,
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
        photo_url = await save_file(
            photo,
            COMPLAINT_UPLOAD_DIR,
        )

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
    response_model=ComplaintListResponse,
)
def get_my_complaints(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base_query = select(Complaint).where(
        Complaint.resident_id == current_user.id
    )

    total = db.scalar(
        select(func.count())
        .select_from(Complaint)
        .where(Complaint.resident_id == current_user.id)
    ) or 0

    complaints = db.scalars(
        base_query
        .order_by(Complaint.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    total_pages = ceil(total / limit) if total else 0

    return ComplaintListResponse(
        items=complaints,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )

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
    "/{complaint_id}/photo",
)
async def get_complaint_photo(
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

    if not complaint.photo_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This complaint has no photo",
        )

    contents, content_type = await download_file(
        complaint.photo_url
    )

    from fastapi.responses import Response

    return Response(
        content=contents,
        media_type=content_type,
    )

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