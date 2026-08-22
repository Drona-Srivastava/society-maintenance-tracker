import os
from pathlib import Path
from uuid import uuid4

from azure.identity.aio import DefaultAzureCredential
from azure.storage.blob.aio import BlobServiceClient
from fastapi import HTTPException, UploadFile, status


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024

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
    upload_dir: Path,
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

    # upload_dir is currently:
    # uploads/complaints
    # or
    # uploads/profiles
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