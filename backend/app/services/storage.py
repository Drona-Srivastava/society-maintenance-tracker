from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status


UPLOAD_DIR = Path("uploads")
COMPLAINT_UPLOAD_DIR = UPLOAD_DIR / "complaints"
PROFILE_UPLOAD_DIR = UPLOAD_DIR / "profiles"

COMPLAINT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROFILE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024


async def save_file(
    file: UploadFile,
    upload_dir: Path = COMPLAINT_UPLOAD_DIR,
) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image must be smaller than 5 MB",
        )

    extension = Path(file.filename or "").suffix.lower()

    filename = f"{uuid4().hex}{extension}"
    file_path = upload_dir / filename

    file_path.write_bytes(contents)

    return f"/uploads/{upload_dir.name}/{filename}"