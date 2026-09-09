from pathlib import Path

from app.services.mrp_image_detector import extract_mrp_from_image


IMAGE = Path(
    r".\storage\uploads\ocr_benchmark_clear.jpeg"
)

result = extract_mrp_from_image(
    str(IMAGE)
)

print("=" * 90)
print("LABELGUARD — SPECIALIZED MRP DETECTOR TEST")
print("=" * 90)

if result is None:
    print("RESULT: MRP NOT DETECTED")
else:
    for key, value in result.items():
        print(f"{key}: {value}")
