import cv2
from app.services.mrp_image_detector import (
    _ocr_words, _preprocess_variants, _resize, _rotate, _find_anchor
)

image=cv2.imread(r".\storage\uploads\ocr_benchmark_clear.jpeg")
if image is None:
    raise RuntimeError("Image not found")

print("="*75)
print("MRP SPATIAL TEST")
print("="*75)

rotated=_rotate(image,0)
resized=_resize(rotated)

for variant_name, variant in _preprocess_variants(resized):
    if variant_name not in ("original","gray","thresholded"):
        continue

    words=_ocr_words(variant,psm=11)
    anchor=_find_anchor(words)

    if not anchor:
        continue

    b=anchor["bbox"]
    ax, ay = b["x"], b["y"]
    aw, ah = b["width"], b["height"]
    anchor_cy = ay + ah / 2

    nearby=[]

    for w in words:
        wb=w["bbox"]
        x,y=wb["x"],wb["y"]
        cx=x+wb["width"]/2
        cy=y+wb["height"]/2

        if (
            x >= ax - 50
            and x <= ax + 900
            and abs(cy-anchor_cy) <= 90
        ):
            nearby.append(w)

    nearby.sort(key=lambda w: w["bbox"]["x"])

    print(f"\nVARIANT: {variant_name}")
    print(f"ANCHOR: {anchor['text']} | confidence={anchor['confidence']:.1f}")

    for w in nearby:
        wb=w["bbox"]
        print(
            f"{w['text']!r} "
            f"conf={w['confidence']:.1f} "
            f"x={wb['x']} y={wb['y']} "
            f"w={wb['width']} h={wb['height']}"
        )
