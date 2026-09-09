from app.db.session import SessionLocal
from app.models import InspectionImage
from app.services.mrp_image_detector import extract_mrp_from_image


db = SessionLocal()

try:
    images = (
        db.query(InspectionImage)
        .filter(InspectionImage.inspection_id == 1)
        .order_by(InspectionImage.id)
        .all()
    )

    print("\n" + "=" * 80)
    print("LABELGUARD — MRP IMAGE SCAN")
    print("=" * 80)

    for image in images:
        result = extract_mrp_from_image(image.file_path)

        print(f"\nIMAGE ID   : {image.id}")
        print(f"TYPE       : {image.image_type}")
        print(f"FILE       : {image.file_name}")
        print(f"PATH       : {image.file_path}")

        if result:
            print(f"MRP VALUE  : {result.get('normalized_value')}")
            print(f"ANCHOR     : {result.get('anchor')}")
            print(f"SCORE      : {result.get('score')}")
            print(f"ORIENTATION: {result.get('orientation')}")
            print(f"PREPROCESS : {result.get('preprocess')}")
            print(f"PSM        : {result.get('psm')}")
        else:
            print("MRP VALUE  : None")
            print("RESULT     : MRP not reliably detected")

finally:
    db.close()
