from app.services.mrp_image_detector import extract_mrp_from_image

image_path = r"backend/storage/uploads/e06a38b554e1456d81a4e262f6201f4e.png"

result = extract_mrp_from_image(image_path)

print("\n" + "=" * 60)
print("LABELGUARD — DYNAMIC MRP DETECTION")
print("=" * 60)

if result is None:
    print("MRP RESULT: NOT RELIABLY DETECTED")
else:
    print("MRP VALUE       :", result["normalized_value"])
    print("CURRENCY        :", result["currency"])
    print("RAW VALUE       :", result["raw_value"])
    print("ANCHOR          :", result["anchor"])
    print("ANCHOR CONF.    :", result["anchor_confidence"])
    print("ORIENTATION     :", result["orientation"])
    print("PREPROCESS      :", result["preprocess"])
    print("PSM             :", result["psm"])
    print("ROI             :", result["roi"])
    print("SCORE           :", result["score"])
    print("OCR CONTEXT     :", result["ocr_context"])
