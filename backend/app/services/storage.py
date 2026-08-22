import os
from pathlib import Path
from uuid import uuid4

from azure.identity.aio import DefaultAzureCredential
from azure.storage.blob.aio import BlobServiceClient
from fastapi import HTTPException, UploadFile, status


# Logical storage paths.
# These are used to determine the Blob Storage folder.
COMPLAINT_UPLOAD_DIR = Path("uploads/complaints")
PROFILE_UPLOAD_DIR = Path("uploads/profiles")


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024


STORAGE_BACKEND = os.getenv(
    "STORAGE_BACKEND",
    "azure",
)

AZURE_STORAGE_ACCOUNT = os.getenv(
    "AZURE_STORAGE_ACCOUNT"
)

AZURE_STORAGE_CONTAINER = os.getenv(
    "AZURE_STORAGE_CONTAINER",
    "uploads",
)


def get_blob_service_client() -> BlobServiceClient:
    if not AZURE_STORAGE_ACCOUNT:
        raise RuntimeError(
            "AZURE_STORAGE_ACCOUNT is not configured"
        )

    account_url = (
        f"https://{AZURE_STORAGE_ACCOUNT}.blob.core.windows.net"
    )

    credential = DefaultAzureCredential()

    return BlobServiceClient(
        account_url=account_url,
        credential=credential,
    )


async def save_file(
    file: UploadFile,
    upload_dir: Path = COMPLAINT_UPLOAD_DIR,
) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only JPEG, PNG, and WebP "
                "images are allowed"
            ),
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image must be smaller than 5 MB",
        )

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    filename = f"{uuid4().hex}{extension}"

    # Local storage is used only for tests.
    if STORAGE_BACKEND == "local":
        upload_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_path = upload_dir / filename
        file_path.write_bytes(contents)

        return f"/uploads/{upload_dir.name}/{filename}"

    # Azure Blob Storage
    #
    # uploads/complaints -> complaints
    # uploads/profiles   -> profiles
    folder = upload_dir.name

    blob_name = f"{folder}/{filename}"

    client = get_blob_service_client()

    try:
        container_client = client.get_container_client(
            AZURE_STORAGE_CONTAINER
        )

        blob_client = container_client.get_blob_client(
            blob_name
        )

        await blob_client.upload_blob(
            contents,
            overwrite=False,
            content_type=file.content_type,
        )

        return blob_client.url

    finally:
        await client.close()