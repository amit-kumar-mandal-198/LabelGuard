import cv2
import pytesseract
from pytesseract import Output
from app.services.mrp_image_detector import (
    _preprocess_variants,_resize,_rotate,_find_anchor
)

image=cv2.imread(r".\storage\uploads\ocr_benchmark_clear.jpeg")
resized=_resize(_rotate(image,0))

print("="*75)
print("MRP PRICE REGION TEST")
print("="*75)

for variant_name, variant in _preprocess_variants(resized):
    if variant_name not in ("original","gray","thresholded"):
        continue

    words=pytesseract.image_to_data(
        variant,
        config="--psm 11 -c tessedit_char_whitelist=0123456789Rs₹./-",
        output_type=Output.DICT
    )

    candidates=[]

    for i,text in enumerate(words["text"]):
        text=text.strip()
        if not text:
            continue

        conf=float(words["conf"][i])
        x=int(words["left"][i])
        y=int(words["top"][i])
        w=int(words["width"][i])
        h=int(words["height"][i])

        # Price should be close to the known MRP anchor region.
        if 1000 <= x <= 1125 and 1400 <= y <= 1600:
            candidates.append(
                (text, round(conf,1), x, y, w, h)
            )

    print(f"\nVARIANT: {variant_name}")

    if candidates:
        for item in candidates:
            print(item)
    else:
        print("NO NUMERIC CANDIDATE")
