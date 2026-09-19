import cv2
import pytesseract
from app.services.mrp_image_detector import (
    _preprocess_variants,_resize,_rotate,_ocr_words,_find_anchor
)

image=cv2.imread(r".\storage\uploads\ocr_benchmark_clear.jpeg")
resized=_resize(_rotate(image,0))

for variant_name, variant in _preprocess_variants(resized):
    if variant_name != "gray":
        continue

    words=_ocr_words(variant,psm=11)
    anchor=_find_anchor(words)

    b=anchor["bbox"]
    ax=b["x"]+b["width"]
    ay=b["y"]
    ah=b["height"]

    tax_words={"OF","(INCL.","(NCL.","INCL.","NCL","ALL","TAXES)"}

    right_words=[]
    for w in words:
        wb=w["bbox"]
        if wb["x"] <= ax:
            continue

        cy=wb["y"]+wb["height"]/2
        if abs(cy-(ay+ah/2)) > 90:
            continue

        if w["text"].strip().upper() in tax_words:
            right_words.append(w)

    right_words.sort(key=lambda w:w["bbox"]["x"])

    if not right_words:
        print("NO TAX WORD FOUND")
        raise SystemExit

    first=right_words[0]["bbox"]
    x1=ax+5
    x2=first["x"]-5
    y1=max(0,ay-20)
    y2=min(variant.shape[0],ay+ah+20)

    crop=variant[y1:y2,x1:x2]

    crop=cv2.resize(crop,None,fx=4,fy=4,interpolation=cv2.INTER_CUBIC)

    for mode,name in [
        (crop,"raw"),
        (cv2.threshold(crop,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1],"otsu")
    ]:
        text=pytesseract.image_to_string(
            mode,
            config="--psm 7 -c tessedit_char_whitelist=0123456789.,-₹Rs"
        ).strip()

        print(f"variant={variant_name} | crop=({x1},{y1})-({x2},{y2}) | {name} -> {text!r}")
