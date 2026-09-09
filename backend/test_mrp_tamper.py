import cv2

from app.services.mrp_image_detector import extract_mrp_from_image
from app.services.mrp_tamper_detector import analyze_mrp_tampering


IMAGE = r"backend/storage/uploads/e06a38b554e1456d81a4e262f6201f4e.png"


image = cv2.imread(IMAGE)

mrp = extract_mrp_from_image(IMAGE)

if mrp is None:
    print("MRP NOT DETECTED")
    raise SystemExit(1)


roi = (
    mrp["roi"]["x"],
    mrp["roi"]["y"],
    mrp["roi"]["width"],
    mrp["roi"]["height"],
)

declared_mrp = mrp["normalized_value"]


# Demo reference value.
# This is TEST DATA, not hardcoded inside the detector.
reference_mrp = 5.0


result = analyze_mrp_tampering(
    image=image,
    mrp_roi=roi,
    declared_mrp=declared_mrp,
    reference_mrp=reference_mrp,
)


print("\n" + "=" * 65)
print("LABELGUARD — DUAL MRP + TAMPER ANALYSIS")
print("=" * 65)

print("DECLARED MRP :", declared_mrp)
print("REFERENCE MRP:", reference_mrp)
print("PRICE STATUS :", "MATCH" if declared_mrp == reference_mrp else "MISMATCH")

print("\nTAMPER STATUS:", result["status"])
print("RISK SCORE   :", result["risk_score"])

print("\nSIGNALS")

for signal in result["signals"]:
    print(f"- {signal['name']}")
    print(f"  score : {signal['score']}")
    print(f"  reason: {signal['reason']}")
