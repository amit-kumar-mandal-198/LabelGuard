from pathlib import Path
import cv2

from app.services.mrp_image_detector import (
    _find_anchor,
    _find_anchor_line,
    _ocr_words,
    _preprocess_variants,
    _resize,
    _rotate,
)


image_path = Path(
    r".\storage\uploads\ocr_benchmark_clear.jpeg"
)

image = cv2.imread(str(image_path))

if image is None:
    raise RuntimeError("Image could not be loaded.")


found = []

for angle in (0, 90, 180, 270):
    rotated = _rotate(image, angle)
    resized = _resize(rotated)

    for variant_name, variant in _preprocess_variants(resized):

        for psm in (6, 11):

            words = _ocr_words(
                variant,
                psm=psm,
            )

            anchor = _find_anchor(words)

            if not anchor:
                continue

            line = _find_anchor_line(
                words,
                anchor,
            )

            found.append(
                {
                    "angle": angle,
                    "variant": variant_name,
                    "psm": psm,
                    "anchor": anchor["text"],
                    "confidence": round(
                        anchor["confidence"],
                        2,
                    ),
                    "line": " ".join(
                        word["text"]
                        for word in line
                    ),
                }
            )


print("=" * 75)
print("SHORT MRP ANCHOR DIAGNOSTIC")
print("=" * 75)

for item in found:
    print(
        f"angle={item['angle']} | "
        f"variant={item['variant']} | "
        f"psm={item['psm']} | "
        f"confidence={item['confidence']} | "
        f"line={item['line']}"
    )

print("\nTOTAL HITS:", len(found))
