import os
import json
import base64
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


def _get_gcs_client():
    if not GCS_AVAILABLE:
        return None

    # Option 1: Base64 or JSON string in environment variable
    creds_json = os.environ.get("GCS_CREDENTIALS_JSON") or settings.GCS_CREDENTIALS_JSON
    if creds_json and creds_json.strip():
        try:
            raw = creds_json.strip()
            if not raw.startswith("{"):
                raw = base64.b64decode(raw).decode("utf-8")
            info = json.loads(raw)
            return gcs_storage.Client.from_service_account_info(info)
        except Exception as e:
            print(f"[GCS ERROR] Cannot load credentials from JSON string: {e}")

    # Option 2: Credentials JSON file path
    if settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
        try:
            return gcs_storage.Client.from_service_account_json(settings.GOOGLE_APPLICATION_CREDENTIALS)
        except Exception as e:
            print(f"[GCS ERROR] Cannot load credentials from file: {e}")

    # Option 3: Default project ID
    if settings.GCS_PROJECT_ID:
        try:
            return gcs_storage.Client(project=settings.GCS_PROJECT_ID)
        except Exception:
            pass

    return None


async def upload_photo(file: UploadFile, folder: str = "checkins") -> tuple[str, str]:
    """
    Upload ảnh lên Google Cloud Storage (GCS) hoặc local storage fallback.
    Returns: (url, filename)
    """
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{folder}/{uuid.uuid4()}{ext}"
    content = await file.read()

    client = _get_gcs_client()
    if client and settings.GCS_BUCKET_NAME:
        try:
            bucket = client.bucket(settings.GCS_BUCKET_NAME)
            blob = bucket.blob(filename)
            blob.upload_from_string(content, content_type=file.content_type or "image/jpeg")
            blob.make_public()
            return blob.public_url, filename
        except Exception as e:
            print(f"[GCS UPLOAD ERROR] Fallback to local storage: {e}")

    # Local storage fallback
    local_path = LOCAL_UPLOAD_DIR / filename
    local_path.parent.mkdir(parents=True, exist_ok=True)
    with open(local_path, "wb") as f:
        f.write(content)
    url = f"/uploads/{filename}"

    return url, filename


def delete_photo(filename: str):
    """Xóa ảnh từ GCS hoặc local."""
    client = _get_gcs_client()
    if client and settings.GCS_BUCKET_NAME:
        try:
            bucket = client.bucket(settings.GCS_BUCKET_NAME)
            blob = bucket.blob(filename)
            if blob.exists():
                blob.delete()
                return
        except Exception:
            pass

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
