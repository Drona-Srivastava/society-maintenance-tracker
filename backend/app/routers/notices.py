from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.notice import Notice
from app.models.user import User
from app.schemas.notice import (
    NoticeCreate,
    NoticeResponse,
    NoticeUpdate,
)


router = APIRouter(
    prefix="/api/notices",
    tags=["Notices"],
)

@router.get(
    "",
    response_model=list[NoticeResponse],
)
def get_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notices = db.scalars(
        select(Notice)
        .order_by(
            Notice.is_important.desc(),
            Notice.created_at.desc(),
        )
    ).all()

    return notices


@router.get(
    "/{notice_id}",
    response_model=NoticeResponse,
)
def get_notice(
    notice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notice = db.get(Notice, notice_id)

    if notice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    return notice


@router.post(
    "",
    response_model=NoticeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_notice(
    data: NoticeCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notice = Notice(
        title=data.title,
        content=data.content,
        is_important=data.is_important,
        created_by=current_user.id,
    )

    db.add(notice)
    db.commit()
    db.refresh(notice)

    return notice

@router.patch(
    "/{notice_id}",
    response_model=NoticeResponse,
)
def update_notice(
    notice_id: int,
    data: NoticeUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notice = db.get(Notice, notice_id)

    if notice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    if data.title is not None:
        notice.title = data.title

    if data.content is not None:
        notice.content = data.content

    if data.is_important is not None:
        notice.is_important = data.is_important

    db.commit()
    db.refresh(notice)

    return notice

@router.delete(
    "/{notice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_notice(
    notice_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notice = db.get(Notice, notice_id)

    if notice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    db.delete(notice)
    db.commit()

