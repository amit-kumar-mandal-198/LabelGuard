from pathlib import Path

import cv2
import pytesseract

from app.services.mrp_image_detector import (
    _crop_word_line,
    _find_anchor,
    _find_anchor_line,
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


best = None


for angle in (0, 90, 180, 270):

    rotated = _rotate(
        original,
        angle,
    )

    resized = _resize(
        rotated
    )

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

            line_words = _find_anchor_line(
                words,
                anchor,
            )

            cropped = _crop_word_line(
                variant,
                line_words,
            )

            if cropped is None:
                continue

            line_image, bbox = cropped

            height, width = line_image.shape[:2]

            scaled = cv2.resize(
                line_image,
                (
                    width * 4,
                    height * 4,
                ),
                interpolation=cv2.INTER_CUBIC,
            )

            results = []

            for line_psm in (
                6,
                7,
                11,
                13,
            ):

                text = pytesseract.image_to_string(
                    scaled,
                    config=f"--oem 3 --psm {line_psm}",
                ).strip()

                if text:
                    results.append(
                        {
                            "psm": line_psm,
                            "text": text,
                        }
                    )

            candidate_score = (
                float(anchor["confidence"])
                + len(line_words) * 2
            )

            candidate = {
                "angle": angle,
                "variant": variant_name,
                "psm": psm,
                "anchor": anchor["text"],
                "anchor_confidence": anchor["confidence"],
                "line_words": [
                    word["text"]
                    for word in line_words
                ],
                "bbox": bbox,
                "score": candidate_score,
                "results": results,
            }

            if (
                best is None
                or candidate["score"]
                > best["score"]
            ):
                best = candidate


print("=" * 100)
print("LABELGUARD — TIGHT MRP LINE OCR BENCHMARK")
print("=" * 100)

if best is None:

    print("RESULT: NO MRP ANCHOR LINE FOUND")

else:

    print("ANGLE              :", best["angle"])
    print("VARIANT            :", best["variant"])
    print("DISCOVERY PSM      :", best["psm"])
    print("ANCHOR             :", best["anchor"])
    print(
        "ANCHOR CONFIDENCE  :",
        best["anchor_confidence"],
    )
    print("LINE WORDS         :", best["line_words"])
    print("ROI                :", best["bbox"])

    print("\nLINE OCR RESULTS")
    print("-" * 100)

    for result in best["results"]:
        print(
            f"\nPSM {result['psm']}:"
        )
        print(result["text"])
