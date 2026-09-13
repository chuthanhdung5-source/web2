"""
Google Cloud Storage utility.
Nếu chưa có GCS credentials, sẽ dùng local storage thay thế.
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile

LOCAL_UPLOAD_DIR = Path("uploads")
LOCAL_UPLOAD_DIR.mkdir(exist_ok=True)

try:
    from google.cloud import storage as gcs_storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

from app.config import settings


def _use_gcs() -> bool:
    return (
        GCS_AVAILABLE
        and bool(settings.GCS_PROJECT_ID)
        and bool(settings.GOOGLE_APPLICATION_CREDENTIALS)
        and os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS)
    )


async def upload_photo(file: UploadFile, folder: str = "checkins") -> tuple[str, str]:
    """
    Upload ảnh lên GCS hoặc local storage.
    Returns: (url, filename)
    """
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{folder}/{uuid.uuid4()}{ext}"
    content = await file.read()

    if _use_gcs():
        client = gcs_storage.Client(project=settings.GCS_PROJECT_ID)
        bucket = client.bucket(settings.GCS_BUCKET_NAME)
        blob = bucket.blob(filename)
        blob.upload_from_string(content, content_type=file.content_type or "image/jpeg")
        blob.make_public()
        url = blob.public_url
    else:
        # Local storage fallback
        local_path = LOCAL_UPLOAD_DIR / filename
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(content)
        url = f"/uploads/{filename}"

    return url, filename


def delete_photo(filename: str):
    """Xóa ảnh từ GCS hoặc local."""
    if _use_gcs():
        client = gcs_storage.Client(project=settings.GCS_PROJECT_ID)
        bucket = client.bucket(settings.GCS_BUCKET_NAME)
        blob = bucket.blob(filename)
        if blob.exists():
            blob.delete()
    else:
        local_path = LOCAL_UPLOAD_DIR / filename
        if local_path.exists():
            local_path.unlink()


def get_signed_url(filename: str, expiration_minutes: int = 60) -> str:
    """Tạo signed URL cho ảnh private (nếu cần)."""
    if _use_gcs():
        from datetime import timedelta
        client = gcs_storage.Client(project=settings.GCS_PROJECT_ID)
        bucket = client.bucket(settings.GCS_BUCKET_NAME)
        blob = bucket.blob(filename)
        return blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes))
    return f"/uploads/{filename}"
