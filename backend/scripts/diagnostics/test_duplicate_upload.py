from io import BytesIO

from fastapi import UploadFile
from starlette.datastructures import Headers

from app.db.session import SessionLocal
from app.models import InspectionImage
from app.services.image_service import create_inspection_image


IMAGE_ID = 1

db = SessionLocal()

try:
    existing = db.get(
        InspectionImage,
        IMAGE_ID,
    )

    if existing is None:
        raise RuntimeError(
            f"InspectionImage {IMAGE_ID} not found."
        )

    with open(
        existing.file_path,
        "rb",
    ) as file:
        content = file.read()

    upload = UploadFile(
        file=BytesIO(content),
        filename=existing.file_name,
        headers=Headers(
            {
                "content-type": existing.mime_type,
            }
        ),
    )

    before_count = (
        db.query(InspectionImage)
        .filter(
            InspectionImage.inspection_id
            == existing.inspection_id
        )
        .count()
    )

    print("BEFORE COUNT:", before_count)
    print("EXISTING HASH:", existing.content_hash)

    try:
        create_inspection_image(
            db=db,
            inspection_id=existing.inspection_id,
            image_type="front",
            upload_file=upload,
        )

        print(
            "RESULT: ERROR — "
            "duplicate upload was accepted"
        )

    except ValueError as exc:
        print("RESULT: DUPLICATE REJECTED")
        print("MESSAGE:", str(exc))

    after_count = (
        db.query(InspectionImage)
        .filter(
            InspectionImage.inspection_id
            == existing.inspection_id
        )
        .count()
    )

    print("AFTER COUNT:", after_count)

finally:
    db.close()
