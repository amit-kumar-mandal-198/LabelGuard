import cv2
import pytesseract
from app.services.mrp_image_detector import (
    _preprocess_variants, _resize, _rotate, _ocr_words, _find_anchor
)

image=cv2.imread(r".\storage\uploads\ocr_benchmark_clear.jpeg")
resized=_resize(_rotate(image,0))

for variant_name, variant in _preprocess_variants(resized):
    if variant_name not in ("original","gray","thresholded","enhanced"):
        continue

    words=_ocr_words(variant,psm=11)
    anchor=_find_anchor(words)

    if not anchor:
        continue

    b=anchor["bbox"]
    ax=b["x"]+b["width"]
    ay=b["y"]
    ah=b["height"]

    candidates=[]

    for w in words:
        wb=w["bbox"]
        x=wb["x"]
        y=wb["y"]
        cy=y+wb["height"]/2

        if ax-10 <= x <= ax+120 and abs(cy-(ay+ah/2)) <= 90:
            text=w["text"].strip().upper()

            if text not in {
                "OF","(INCL.","(NCL.","INCL.","NCL","ALL","TAXES)"
            }:
                candidates.append(w)

    if not candidates:
        continue

    candidates.sort(key=lambda w:w["bbox"]["x"])
    bad=candidates[0]["bbox"]

    x1=max(0,bad["x"]-18)
    x2=min(variant.shape[1],bad["x"]+bad["width"]+18)
    y1=max(0,bad["y"]-25)
    y2=min(variant.shape[0],bad["y"]+bad["height"]+25)

    crop=variant[y1:y2,x1:x2]

    # OTSU requires single-channel image.
    if len(crop.shape) == 3:
        crop=cv2.cvtColor(crop,cv2.COLOR_BGR2GRAY)

    crop=cv2.resize(
        crop,
        None,
        fx=6,
        fy=6,
        interpolation=cv2.INTER_CUBIC
    )

    tests=[
        ("raw",crop),
        (
            "otsu",
            cv2.threshold(
                crop,0,255,
                cv2.THRESH_BINARY+cv2.THRESH_OTSU
            )[1]
        ),
        (
            "inv_otsu",
            cv2.threshold(
                crop,0,255,
                cv2.THRESH_BINARY_INV+cv2.THRESH_OTSU
            )[1]
        ),
    ]

    print(f"\nVARIANT={variant_name}")
    print(
        f"SUSPECT BOX: x={bad['x']} y={bad['y']} "
        f"w={bad['width']} h={bad['height']}"
    )

    for name,img in tests:
        text=pytesseract.image_to_string(
            img,
            config="--psm 10 "
                   "-c tessedit_char_whitelist=0123456789.₹Rs/-"
        ).strip()

        print(f"{name} -> {text!r}")
