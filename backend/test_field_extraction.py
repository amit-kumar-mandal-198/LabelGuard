from pathlib import Path

from app.ai.ocr.ocr_pipeline import run_preprocessed_ocr
from app.ai.extraction.declaration_extractor import extract_declarations


IMAGE = Path(
    r"C:\Users\Lenovo\LABELGUARD\backend\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)


ocr = run_preprocessed_ocr(IMAGE)
result = extract_declarations(ocr["ocr"])

print("=" * 90)
print("LABELGUARD — FIELD EXTRACTION V0.5")
print("=" * 90)

print("OCR ANGLE   :", ocr["best_angle"])
print("OCR VARIANT :", ocr["best_variant"])
print("OCR SCORE   :", ocr["score"])

for name, field in result["fields"].items():
    print(
        f"\n{name.upper()}"
        f"\n  value      : {field['value']}"
        f"\n  raw_value  : {field['raw_value']}"
        f"\n  confidence : {field['confidence']}"
        f"\n  status     : {field['status']}"
        f"\n  evidence   : {len(field['evidence'])} token(s)"
    )
