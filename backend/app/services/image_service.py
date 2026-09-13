import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inspection import Inspection
from app.models.inspection_image import InspectionImage


STORAGE_DIR = Path(__file__).resolve().parents[2] / "storage" / "uploads"

ALLOWED_IMAGE_TYPES = {
    "front",
    "back",
    "side",
}

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_image_type(image_type: str) -> str:
    normalized = image_type.strip().lower()

    if normalized not in ALLOWED_IMAGE_TYPES:
        raise ValueError(
            f"Invalid image_type. Allowed values: "
            f"{', '.join(sorted(ALLOWED_IMAGE_TYPES))}"
        )

    return normalized


def validate_mime_type(content_type: str | None) -> str:
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(
            "Unsupported image format. Use JPEG, PNG, or WebP."
        )

    return content_type


def calculate_file_hash(file_path: str) -> str:
    hasher = hashlib.sha256()

    with open(file_path, "rb") as file:
        for chunk in iter(
            lambda: file.read(1024 * 1024),
            b"",
        ):
            hasher.update(chunk)

    return hasher.hexdigest()


def read_and_hash_upload(
    upload_file: UploadFile,
) -> tuple[bytes, str]:

    content = upload_file.file.read()

    if not content:
        raise ValueError("Image file is empty.")

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("Image size must not exceed 10 MB.")

    file_hash = hashlib.sha256(content).hexdigest()

    upload_file.file.seek(0)

    return content, file_hash


def save_upload_file(
    upload_file: UploadFile,
    content: bytes,
) -> tuple[str, int]:

    STORAGE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    original_name = Path(
        upload_file.filename or "image"
    ).name

    extension = Path(
        original_name
    ).suffix.lower()

    if extension not in {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }:
        raise ValueError(
            "Unsupported file extension. "
            "Use .jpg, .jpeg, .png, or .webp."
        )

    stored_name = f"{uuid4().hex}{extension}"

    destination = STORAGE_DIR / stored_name

    try:
        destination.write_bytes(content)
    except Exception:
        if destination.exists():
            destination.unlink()

        raise

    return str(destination), len(content)


def find_duplicate_image(
    db: Session,
    inspection_id: int,
    file_hash: str,
) -> InspectionImage | None:

    statement = (
        select(InspectionImage)
        .where(
            InspectionImage.inspection_id == inspection_id,
            InspectionImage.content_hash == file_hash,
        )
        .limit(1)
    )

    return db.scalar(statement)


def create_inspection_image(
    db: Session,
    inspection_id: int,
    image_type: str,
    upload_file: UploadFile,
) -> InspectionImage:

    inspection = db.get(
        Inspection,
        inspection_id,
    )

    if inspection is None:
        raise LookupError(
            "Inspection not found."
        )

    normalized_type = validate_image_type(
        image_type
    )

    mime_type = validate_mime_type(
        upload_file.content_type
    )

    content, file_hash = read_and_hash_upload(
        upload_file
    )

    duplicate = find_duplicate_image(
        db=db,
        inspection_id=inspection_id,
        file_hash=file_hash,
    )

    if duplicate is not None:
        raise ValueError(
            "Duplicate image already exists for "
            f"this inspection (image_id={duplicate.id})."
        )

    file_path, file_size = save_upload_file(
        upload_file,
        content,
    )

    image = InspectionImage(
        inspection_id=inspection_id,
        file_name=Path(file_path).name,
        file_path=file_path,
        image_type=normalized_type,
        file_size=file_size,
        mime_type=mime_type,
        content_hash=file_hash,
    )

    try:
        db.add(image)
        db.commit()
        db.refresh(image)

    except Exception:
        db.rollback()

        stored_file = Path(file_path)

        if stored_file.exists():
            stored_file.unlink()

        raise

    return image


def list_inspection_images(
    db: Session,
    inspection_id: int,
) -> list[InspectionImage]:

    statement = (
        select(InspectionImage)
        .where(
            InspectionImage.inspection_id == inspection_id
        )
        .order_by(
            InspectionImage.created_at.asc()
        )
    )

    return list(
        db.scalars(statement).all()
    )
