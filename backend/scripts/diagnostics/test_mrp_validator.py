from app.services.mrp_image_detector import extract_mrp_from_image
from app.services.mrp_validator import validate_mrp_result

IMAGE = r"backend/storage/uploads/e06a38b554e1456d81a4e262f6201f4e.png"

raw = extract_mrp_from_image(IMAGE)
final = validate_mrp_result(raw)

print("\n" + "=" * 60)
print("LABELGUARD — MRP COMPLIANCE RESULT")
print("=" * 60)

print("VALUE       :", final["value"])
print("CURRENCY    :", final["currency"])
print("STATUS      :", final["status"])
print("CONFIDENCE  :", final["confidence"])

print("\nEVIDENCE")
for key, value in final.get("evidence", {}).items():
    print(f"{key}: {value}")
