import sys, re, tempfile, os
sys.path.insert(0, ".")
from pathlib import Path
import cv2

from app.ai.ocr.ocr_engine import run_ocr
from app.ai.preprocessing.orientation_detector import detect_best_orientation, rotate_image
from app.db.session import SessionLocal
from app.models.inspection_image import InspectionImage
from sqlalchemy import select

db = SessionLocal()
images = list(
    db.scalars(
        select(InspectionImage)
        .where(InspectionImage.inspection_id == 1)
        .order_by(InspectionImage.created_at)
    ).all()
)
db.close()

print(f"Images for inspection 1: {len(images)}")
for img in images:
    print(f"  id={img.id}, type={img.image_type}, path={img.file_path}")

# Run OCR on each image and search for BBE terms
BBE_PATTERN = re.compile(
    r"(best\s*before|use\s*by|exp(?:iry|iration)?|shelf.*?life|consume.*?before)",
    re.IGNORECASE,
)

for img in images:
    path = Path(img.file_path)
    if not path.exists():
        print(f"  MISSING: {path}")
        continue

    orientation = detect_best_orientation(path)
    best_angle = int(orientation["best_angle"])

    image = cv2.imread(str(path))
    rotated = rotate_image(image, best_angle)

    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    cv2.imwrite(tmp.name, rotated)

    ocr_result = run_ocr(tmp.name, psm=6)
    os.unlink(tmp.name)

    text = ocr_result["text"]
    words = ocr_result["words"]

    print(f"\n=== Image {img.id} (type={img.image_type}, angle={best_angle}) ===")
    print(f"OCR words: {len(words)}")
    print()
    print("--- Full OCR Text ---")
    print(text[:2000])
    print()

    matches = BBE_PATTERN.findall(text)
    print(f"BBE keyword matches: {matches}")
    print()

    # Show word-level confidence for any date-like tokens
    date_words = [
        w for w in words
        if re.search(r"\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4}", w["text"])
    ]
    print(f"Date-like tokens ({len(date_words)}):")
    for dw in date_words:
        print(f"  {repr(dw['text'])} conf={dw['confidence']} bbox={dw['bbox']}")
