from pathlib import Path

from app.ai.ocr.ocr_pipeline import run_preprocessed_ocr
from app.ai.extraction.declaration_extractor import extract_declarations


IMAGE = Path(
    r".\storage\uploads\ocr_benchmark_clear.jpeg"
)

ocr = run_preprocessed_ocr(IMAGE)

declarations = extract_declarations(
    ocr["ocr"],
    IMAGE,
)

print("=" * 100)
print("LABELGUARD — CLEAR IMAGE OCR BASELINE")
print("=" * 100)

print("IMAGE       :", IMAGE.name)
print("BEST ANGLE  :", ocr["best_angle"])
print("BEST VARIANT:", ocr["best_variant"])
print("OCR SCORE   :", ocr["score"])

print("\n" + "-" * 100)
print("EXTRACTED DECLARATIONS")
print("-" * 100)

for name, field in declarations["fields"].items():
    print(f"\n{name.upper()}")
    print("  value      :", field["value"])
    print("  raw_value  :", field["raw_value"])
    print("  confidence :", field["confidence"])
    print("  status     :", field["status"])
    print("  evidence   :", len(field["evidence"]), "token(s)")

print("\n" + "-" * 100)
print("RAW OCR TEXT")
print("-" * 100)
print(ocr["ocr"]["text"])
