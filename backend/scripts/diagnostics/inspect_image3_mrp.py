from sqlalchemy import select
from app.db.session import SessionLocal
from app.models import InspectionImage
from app.services.mrp_image_detector import extract_mrp_from_image

db = SessionLocal()

try:
    image = db.scalar(
        select(InspectionImage)
        .where(
            InspectionImage.inspection_id == 1,
            InspectionImage.id == 3,
        )
    )

    if image is None:
        raise RuntimeError("Inspection image 3 not found")

    result = extract_mrp_from_image(image.file_path)

    print("=" * 75)
    print("IMAGE 3 MRP EVIDENCE")
    print("=" * 75)

    if result is None:
        print("NO DETECTION")
    else:
        print("value         :", result.get("normalized_value"))
        print("raw_value     :", result.get("raw_value"))
        print("anchor        :", result.get("anchor"))
        print("anchor_conf   :", result.get("anchor_confidence"))
        print("angle         :", result.get("orientation"))
        print("variant       :", result.get("preprocess"))
        print("psm           :", result.get("psm"))
        print("score         :", result.get("score"))
        print("amount_recovery:", result.get("amount_recovery"))
        print("ocr_context   :", result.get("ocr_context"))

finally:
    db.close()
