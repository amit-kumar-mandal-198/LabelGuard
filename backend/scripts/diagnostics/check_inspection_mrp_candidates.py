from pathlib import Path
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models import InspectionImage
from app.services.mrp_image_detector import extract_mrp_from_image

db = SessionLocal()

try:
    images = list(
        db.scalars(
            select(InspectionImage)
            .where(InspectionImage.inspection_id == 1)
            .order_by(InspectionImage.id)
        ).all()
    )

    for image in images:
        path = Path(image.file_path)

        if not path.exists():
            print(f"IMAGE {image.id}: FILE MISSING")
            continue

        result = extract_mrp_from_image(str(path))

        print(
            f"IMAGE {image.id} | "
            f"{path.name} | "
            f"MRP={result.get('normalized_value') if result else None} | "
            f"SCORE={result.get('score') if result else None} | "
            f"ANGLE={result.get('orientation') if result else None}"
        )

finally:
    db.close()
