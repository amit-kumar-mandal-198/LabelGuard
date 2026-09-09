import time
from pathlib import Path
from typing import Any

import cv2
import pytesseract


TESSERACT_PATH = Path(
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

if not TESSERACT_PATH.exists():
    raise FileNotFoundError(
        f"Tesseract executable not found: {TESSERACT_PATH}"
    )

pytesseract.pytesseract.tesseract_cmd = str(
    TESSERACT_PATH
)


DEFAULT_PSMS = (6, 11, 12)


def run_ocr(
    image_path: str | Path,
    psm: int = 6,
) -> dict[str, Any]:
    """
    Run one Tesseract OCR pass.

    Kept backward-compatible with the existing API:
        run_ocr(path)
        run_ocr(path, psm=11)
    """

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Image not found: {path}"
        )

    image = cv2.imread(str(path))

    if image is None:
        raise ValueError(
            f"Unable to decode image: {path}"
        )

    config = f"--oem 3 --psm {psm}"

    data = pytesseract.image_to_data(
        image,
        config=config,
        output_type=pytesseract.Output.DICT,
    )

    words = []

    for i, text in enumerate(data["text"]):
        text = str(text).strip()

        if not text:
            continue

        try:
            confidence = float(data["conf"][i])
        except (TypeError, ValueError):
            confidence = -1.0

        if confidence < 0:
            continue

        words.append(
            {
                "text": text,
                "confidence": round(
                    confidence,
                    2,
                ),
                "bbox": {
                    "x": int(data["left"][i]),
                    "y": int(data["top"][i]),
                    "width": int(data["width"][i]),
                    "height": int(data["height"][i]),
                },
                "block_num": int(
                    data["block_num"][i]
                ),
                "par_num": int(
                    data["par_num"][i]
                ),
                "line_num": int(
                    data["line_num"][i]
                ),
                "psm": psm,
            }
        )

    full_text = " ".join(
        word["text"]
        for word in words
    )

    return {
        "text": full_text,
        "words": words,
        "word_count": len(words),
        "psm": psm,
    }


def run_multi_psm_ocr(
    image_path: str | Path,
    psms: tuple[int, ...] = DEFAULT_PSMS,
) -> dict[str, Any]:
    """
    Run multiple Tesseract layout modes on the same image.

    PSM 6  -> uniform text block
    PSM 11 -> sparse text
    PSM 12 -> sparse text with OSD
    """

    results = []

    for psm in psms:
        result = run_ocr(
            image_path=image_path,
            psm=psm,
        )

        results.append(result)

    return {
        "psms": list(psms),
        "results": results,
    }
