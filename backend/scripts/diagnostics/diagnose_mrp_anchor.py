from pathlib import Path

import cv2

from app.services.mrp_image_detector import (
    _find_anchor,
    _ocr_words,
    _preprocess_variants,
    _resize,
    _rotate,
)


IMAGE = Path(
    r".\storage\uploads\ocr_benchmark_clear.jpeg"
)

original = cv2.imread(str(IMAGE))

if original is None:
    raise RuntimeError(
        f"Unable to load image: {IMAGE}"
    )

print("=" * 100)
print("LABELGUARD — MRP ANCHOR DISCOVERY DIAGNOSTIC")
print("=" * 100)

found = 0

for angle in (0, 90, 180, 270):

    rotated = _rotate(
        original,
        angle,
    )

    resized = _resize(rotated)

    for variant_name, variant in _preprocess_variants(
        resized
    ):

        for psm in (6, 11):

            words = _ocr_words(
                variant,
                psm=psm,
            )

            anchor = _find_anchor(words)

            if anchor is None:
                continue

            found += 1

            print("\n" + "-" * 100)
            print("ANGLE:", angle)
            print("VARIANT:", variant_name)
            print("PSM:", psm)
            print("ANCHOR:", anchor)

            print("\nNEARBY WORDS:")
            for word in words:
                bbox = word["bbox"]

                ax = anchor["bbox"]["x"]
                ay = anchor["bbox"]["y"]

                distance = (
                    abs(bbox["x"] - ax)
                    + abs(bbox["y"] - ay)
                )

                if distance <= 1200:
                    print(
                        f"  {word['text']!r}"
                        f" conf={word['confidence']:.1f}"
                        f" bbox={bbox}"
                    )

print("\n" + "=" * 100)
print("TOTAL MRP ANCHOR HITS:", found)
print("=" * 100)
