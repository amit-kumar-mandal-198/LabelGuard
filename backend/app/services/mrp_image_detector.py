import re
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import pytesseract


TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


ANCHOR_TOKENS = {
    "mrp",
    "m.r.p",
    "mrp.",
    "incl",
    "incl.",
    "ncl",
}

TAX_TERMS = {
    "incl",
    "inclusive",
    "tax",
    "taxes",
}


def _normalize_token(value: str) -> str:
    value = value.lower().strip()
    value = value.replace("(", "").replace(")", "")
    value = value.replace("[", "").replace("]", "")
    value = value.replace("{", "").replace("}", "")
    value = value.replace(":", "")
    value = value.strip(".,;:-")
    return value


def _is_anchor(token: str) -> bool:
    normalized = _normalize_token(token)

    if normalized in ANCHOR_TOKENS:
        return True

    if normalized in {"ncl", "incl"}:
        return True

    return False


def _preprocess_variants(image: np.ndarray) -> list[tuple[str, np.ndarray]]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8),
    )
    enhanced = clahe.apply(gray)

    denoised = cv2.fastNlMeansDenoising(
        enhanced,
        None,
        10,
        7,
        21,
    )

    thresholded = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )

    return [
        ("original", image),
        ("gray", gray),
        ("enhanced", enhanced),
        ("thresholded", thresholded),
    ]


def _resize(image: np.ndarray, target_width: int = 1800) -> np.ndarray:
    h, w = image.shape[:2]

    if w == target_width:
        return image

    ratio = target_width / w
    new_h = int(h * ratio)

    return cv2.resize(
        image,
        (target_width, new_h),
        interpolation=cv2.INTER_CUBIC,
    )


def _rotate(image: np.ndarray, angle: int) -> np.ndarray:
    if angle == 0:
        return image

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)

    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

    raise ValueError(f"Unsupported angle: {angle}")


def _find_anchor(words: list[dict[str, Any]]) -> dict[str, Any] | None:
    candidates = []

    for word in words:
        text = str(word.get("text", "")).strip()

        if not text:
            continue

        if not _is_anchor(text):
            continue

        bbox = word.get("bbox")

        if not bbox:
            continue

        # Only a real MRP token can be the primary anchor.
        # INCL/NCL are supporting tax-context tokens only.
        if _normalize_token(text) != "mrp":
            continue

        candidates.append(
            {
                "text": text,
                "confidence": float(word.get("confidence", 0)),
                "bbox": bbox,
                "block_num": word.get("block_num"),
                "par_num": word.get("par_num"),
                "line_num": word.get("line_num"),
            }
        )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item["confidence"],
        reverse=True,
    )

    return candidates[0]

def _ocr_words(
    image: np.ndarray,
    psm: int = 11,
) -> list[dict[str, Any]]:
    data = pytesseract.image_to_data(
        image,
        config=f"--oem 3 --psm {psm}",
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
                "confidence": confidence,
                "bbox": {
                    "x": int(data["left"][i]),
                    "y": int(data["top"][i]),
                    "width": int(data["width"][i]),
                    "height": int(data["height"][i]),
                },
                "block_num": int(data["block_num"][i]),
                "par_num": int(data["par_num"][i]),
                "line_num": int(data["line_num"][i]),
            }
        )

    return words


def _find_anchor_line(
    words: list[dict[str, Any]],
    anchor: dict[str, Any],
) -> list[dict[str, Any]]:
    anchor_block = anchor.get("block_num")
    anchor_paragraph = anchor.get("par_num")
    anchor_line = anchor.get("line_num")

    line_words = [
        word
        for word in words
        if word.get("block_num") == anchor_block
        and word.get("par_num") == anchor_paragraph
        and word.get("line_num") == anchor_line
    ]

    line_words.sort(
        key=lambda word: word["bbox"]["x"]
    )

    return line_words


def _crop_word_line(
    image: np.ndarray,
    words: list[dict[str, Any]],
    padding_x: int = 40,
    padding_y: int = 25,
) -> tuple[np.ndarray, dict[str, int]] | None:
    if not words:
        return None

    xs: list[int] = []
    ys: list[int] = []
    x2s: list[int] = []
    y2s: list[int] = []

    for word in words:
        bbox = word["bbox"]

        x = int(bbox["x"])
        y = int(bbox["y"])
        width = int(bbox["width"])
        height = int(bbox["height"])

        xs.append(x)
        ys.append(y)
        x2s.append(x + width)
        y2s.append(y + height)

    x1 = max(0, min(xs) - padding_x)
    y1 = max(0, min(ys) - padding_y)
    x2 = min(image.shape[1], max(x2s) + padding_x)
    y2 = min(image.shape[0], max(y2s) + padding_y)

    if x2 <= x1 or y2 <= y1:
        return None

    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        return None

    return (
        crop,
        {
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
        },
    )


def _find_tax_word(
    words: list[dict[str, Any]],
    anchor: dict[str, Any],
) -> dict[str, Any] | None:
    ab = anchor["bbox"]

    anchor_right = ab["x"] + ab["width"]
    anchor_center_y = ab["y"] + ab["height"] / 2

    candidates = []

    for word in words:
        wb = word["bbox"]
        text = _normalize_token(str(word.get("text", "")))

        if text not in {"of", "incl", "ncl", "inclusive", "all", "taxes"}:
            continue

        if wb["x"] <= anchor_right:
            continue

        center_y = wb["y"] + wb["height"] / 2

        if abs(center_y - anchor_center_y) > 100:
            continue

        distance = wb["x"] - anchor_right

        if distance > 450:
            continue

        candidates.append(
            (
                distance,
                -float(word.get("confidence", 0)),
                word,
            )
        )

    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0], item[1]))
    return candidates[0][2]



def _find_tax_anchor(words: list[dict[str, Any]]) -> dict[str, Any] | None:
    """
    Find INCL/NCL as supporting context when the real MRP token
    is not recognized by OCR.
    """
    candidates = []

    for word in words:
        text = _normalize_token(
            str(word.get("text", ""))
        )

        if text not in {
            "incl",
            "ncl",
            "inclusive",
        }:
            continue

        bbox = word.get("bbox")
        if not bbox:
            continue

        candidates.append(
            {
                "text": str(word.get("text", "")),
                "confidence": float(
                    word.get("confidence", 0)
                ),
                "bbox": bbox,
                "block_num": word.get("block_num"),
                "par_num": word.get("par_num"),
                "line_num": word.get("line_num"),
            }
        )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item["confidence"],
        reverse=True,
    )

    return candidates[0]


def _recover_mrp_from_tax_context(
    image: np.ndarray,
    words: list[dict[str, Any]],
    tax_anchor: dict[str, Any],
) -> dict[str, Any] | None:
    """
    Recover the monetary value immediately before INCL/NCL.

    This is used only when MRP itself was missed by OCR.
    """

    bbox = tax_anchor["bbox"]

    tax_x = bbox["x"]
    tax_center_y = (
        bbox["y"] + bbox["height"] / 2
    )

    # The declaration amount appears immediately before
    # the INCL/NCL token. Try several narrow widths rather
    # than scanning the complete OCR region.
    widths = (90, 120, 160, 210)

    recovered = []

    for width in widths:
        x1 = max(0, tax_x - width)
        x2 = max(0, tax_x - 3)

        y1 = max(
            0,
            int(tax_center_y - 75),
        )
        y2 = min(
            image.shape[0],
            int(tax_center_y + 75),
        )

        crop = image[y1:y2, x1:x2]

        if crop.size == 0:
            continue

        results = _ocr_amount_crop(crop)

        for result in results:
            value = float(result["value"])

            if value <= 0 or value > 100000:
                continue

            recovered.append(
                {
                    **result,
                    "bbox": {
                        "x": x1,
                        "y": y1,
                        "width": x2 - x1,
                        "height": y2 - y1,
                    },
                }
            )

    if not recovered:
        return None

    # Consensus across different crop widths/preprocessing
    # is stronger than a single noisy OCR result.
    frequency: dict[float, int] = {}

    for item in recovered:
        value = round(float(item["value"]), 2)
        frequency[value] = frequency.get(value, 0) + 1

    recovered.sort(
        key=lambda item: (
            frequency.get(
                round(float(item["value"]), 2),
                0,
            ),
            1 if float(item["value"]) >= 1 else 0,
        ),
        reverse=True,
    )

    best = recovered[0]

    return {
        "value": best["value"],
        "raw": best["raw"],
        "variant": best["variant"],
        "psm": best["psm"],
        "bbox": best["bbox"],
        "tax_anchor": tax_anchor["text"],
        "candidate_count": len(recovered),
        "consensus": frequency.get(
            round(float(best["value"]), 2),
            1,
        ),
    }


def _ocr_amount_crop(crop: np.ndarray) -> list[dict[str, Any]]:
    if crop.size == 0:
        return []

    if len(crop.shape) == 3:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = crop

    gray = cv2.resize(
        gray,
        None,
        fx=8,
        fy=8,
        interpolation=cv2.INTER_CUBIC,
    )

    variants = [
        ("gray", gray),
        (
            "otsu",
            cv2.threshold(
                gray,
                0,
                255,
                cv2.THRESH_BINARY + cv2.THRESH_OTSU,
            )[1],
        ),
        (
            "inv_otsu",
            cv2.threshold(
                gray,
                0,
                255,
                cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
            )[1],
        ),
    ]

    configs = [
        (
            6,
            "--oem 3 --psm 6 "
            "-c tessedit_char_whitelist=0123456789.,/-",
        ),
        (
            7,
            "--oem 3 --psm 7 "
            "-c tessedit_char_whitelist=0123456789.,/-",
        ),
        (
            8,
            "--oem 3 --psm 8 "
            "-c tessedit_char_whitelist=0123456789.,/-",
        ),
        (
            13,
            "--oem 3 --psm 13 "
            "-c tessedit_char_whitelist=0123456789.,/-",
        ),
    ]

    results: list[dict[str, Any]] = []

    def extract_numeric(text: str) -> list[float]:
        values: list[float] = []

        for value_text in re.findall(
            r"\d+(?:\.\d{1,2})?",
            text,
        ):
            try:
                value = float(value_text)
            except ValueError:
                continue

            if 0 < value <= 100000:
                values.append(value)

        return values

    # Adaptive order:
    # first try the original grayscale image with the most reliable
    # line-oriented configurations, then progressively stronger
    # preprocessing/fallback configurations.
    attempts = [
        ("gray", gray, 6),
        ("gray", gray, 7),
        ("otsu", variants[1][1], 6),
        ("otsu", variants[1][1], 8),
        ("inv_otsu", variants[2][1], 13),
    ]

    for variant_name, image, psm in attempts:
        config = next(
            config
            for config_psm, config in configs
            if config_psm == psm
        )

        try:
            text = pytesseract.image_to_string(
                image,
                config=config,
            ).strip()
        except Exception:
            continue

        if not text:
            continue

        numeric_values = extract_numeric(text)

        if not numeric_values:
            continue

        for value in numeric_values:
            results.append(
                {
                    "value": value,
                    "raw": text,
                    "variant": variant_name,
                    "psm": psm,
                }
            )

        # A valid numeric candidate from the tight amount ROI is enough
        # to avoid launching further OCR subprocesses.
        break

    return results

def _recover_mrp_amount(
    image: np.ndarray,
    words: list[dict[str, Any]],
    anchor: dict[str, Any],
    anchor_kind: str = "mrp",
) -> dict[str, Any] | None:
    """
    Recover MRP amount from the narrow spatial region between
    the MRP anchor and the following tax declaration.

    This is intentionally separate from whole-ROI OCR because
    Tesseract was merging the ₹5 region with the tax text.
    """

    if anchor_kind == "tax_context":
        return _recover_mrp_from_tax_context(
            image=image,
            words=words,
            tax_anchor=anchor,
        )

    anchor_bbox = anchor["bbox"]
    anchor_right = anchor_bbox["x"] + anchor_bbox["width"]
    anchor_center_y = (
        anchor_bbox["y"] + anchor_bbox["height"] / 2
    )

    tax_word = _find_tax_word(words, anchor)

    if tax_word:
        tax_bbox = tax_word["bbox"]
        right_edge = tax_bbox["x"] - 4
    else:
        right_edge = anchor_right + 140

    left_edge = max(
        0,
        anchor_right - 14,
    )

    top_edge = max(
        0,
        int(anchor_center_y - 75),
    )

    bottom_edge = min(
        image.shape[0],
        int(anchor_center_y + 75),
    )

    if right_edge <= left_edge:
        return None

    crop = image[
        top_edge:bottom_edge,
        left_edge:right_edge,
    ]

    if crop.size == 0:
        return None

    candidates = _ocr_amount_crop(crop)

    if not candidates:
        return None

    # Use OCR consensus instead of the first plausible number.
    frequency = {}

    for candidate in candidates:
        value = round(float(candidate["value"]), 2)
        frequency[value] = frequency.get(value, 0) + 1

    candidates.sort(
        key=lambda item: (
            frequency.get(round(float(item["value"]), 2), 0),
            1 if 1 <= float(item["value"]) <= 100000 else 0,
            1 if float(item["value"]).is_integer() else 0,
        ),
        reverse=True,
    )

    best = candidates[0]

    return {
        "value": best["value"],
        "raw": best["raw"],
        "variant": best["variant"],
        "psm": best["psm"],
        "bbox": {
            "x": left_edge,
            "y": top_edge,
            "width": right_edge - left_edge,
            "height": bottom_edge - top_edge,
        },
        "tax_anchor": (
            tax_word["text"] if tax_word else None
        ),
        "candidate_count": len(candidates),
    }


def _extract_candidates(text: str) -> list[dict[str, Any]]:
    text = text.replace("₹", " Rs ")
    text = re.sub(r"\s+", " ", text)

    candidates = []

    currency_pattern = re.compile(
        r"(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d{1,2})?)",
        re.IGNORECASE,
    )

    for match in currency_pattern.finditer(text):
        value_text = match.group(1)
        end_context = text[match.end():match.end() + 8].lower()

        if re.search(r"/\s*[a-zA-Z]+", end_context):
            continue

        candidates.append(
            {
                "value": float(value_text),
                "raw": match.group(0),
                "position": match.start(),
                "kind": "currency",
            }
        )

    plain_pattern = re.compile(
        r"\b(\d+(?:\.\d{1,2})?)\s*/-",
        re.IGNORECASE,
    )

    for match in plain_pattern.finditer(text):
        candidates.append(
            {
                "value": float(match.group(1)),
                "raw": match.group(0),
                "position": match.start(),
                "kind": "declaration",
            }
        )

    context_pattern = re.compile(
        r"\b(\d+(?:\.\d{1,2})?)\s*(?:\+|-)?\s*"
        r"\(?\s*(?:incl|ncl|inclusive)\b",
        re.IGNORECASE,
    )

    for match in context_pattern.finditer(text):
        candidates.append(
            {
                "value": float(match.group(1)),
                "raw": match.group(0),
                "position": match.start(),
                "kind": "contextual",
            }
        )

    return candidates


def _candidate_has_mrp_context(
    text: str,
    candidate: dict[str, Any],
) -> bool:
    lower = text.lower()
    position = candidate["position"]

    before = lower[
        max(0, position - 120):
        position
    ]

    after = lower[
        position:
        position + 140
    ]

    has_mrp = "mrp" in before or "mrp" in lower[:position + 20]
    has_tax = any(
        term in after
        for term in ("incl", "ncl", "inclusive", "tax", "taxes")
    )

    return has_mrp and has_tax


def extract_mrp_from_image(
    image_path: str,
    orientation_hint: int | None = None,
) -> dict[str, Any] | None:
    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Image not found: {path}"
        )

    original = cv2.imread(str(path))

    if original is None:
        raise ValueError(
            f"Unable to read image: {path}"
        )

    best_result = None

    if orientation_hint in (0, 90, 180, 270):
        angles = (int(orientation_hint),)
    else:
        angles = (0, 90, 180, 270)

    for angle in angles:
        rotated = _rotate(original, angle)
        resized = _resize(rotated)

        for variant_name, variant in _preprocess_variants(resized):
            for psm in (6, 11):

                words = _ocr_words(
                    variant,
                    psm=psm,
                )

                anchor = _find_anchor(words)
                anchor_kind = "mrp"

                if not anchor:
                    anchor = _find_tax_anchor(words)
                    anchor_kind = "tax_context"

                if not anchor:
                    continue

                recovered = _recover_mrp_amount(
                    variant,
                    words,
                    anchor,
                    anchor_kind=anchor_kind,
                )

                if recovered:
                    value = recovered["value"]

                    if (
                        value > 0
                        and value <= 100000
                    ):
                        tax_bonus = (
                            100
                            if recovered["tax_anchor"]
                            else 0
                        )

                        score = (
                            tax_bonus
                            + min(
                                anchor["confidence"],
                                100,
                            ) * 0.35
                            + 40
                        )

                        result = {
                            "field": "mrp",
                            "normalized_value": value,
                            "currency": "INR",
                            "raw_value": recovered["raw"],
                            "anchor": anchor["text"],
                            "anchor_confidence": anchor["confidence"],
                            "orientation": angle,
                            "preprocess": variant_name,
                            "psm": psm,
                            "roi": recovered["bbox"],
                            "amount_recovery": recovered,
                            "score": round(score, 2),
                        }

                        if (
                            best_result is None
                            or result["score"]
                            > best_result["score"]
                        ):
                            best_result = result

                        # Fast path for an already-oriented image.
                        # Once a high-confidence MRP has independent tax
                        # context and repeated amount consensus, further
                        # preprocessing/PSM passes are unnecessary.
                        if (
                            orientation_hint in (0, 90, 180, 270)
                            and recovered.get("tax_anchor")
                            and float(anchor.get("confidence", 0)) >= 70.0
                            and int(recovered.get("consensus", 1)) >= 2
                        ):
                            return best_result

                        # The dedicated amount recovery already produced a
                        # valid MRP candidate. Do not run the expensive
                        # whole-ROI fallback OCR for this same anchor.
                        if value > 0 and value <= 100000:
                            continue

                # Existing whole-ROI OCR remains as a fallback,
                # but only candidates with explicit MRP + tax
                # context are allowed.
                bbox = anchor["bbox"]

                ax = bbox["x"]
                ay = bbox["y"]
                aw = bbox["width"]
                ah = bbox["height"]

                x1 = max(
                    0,
                    ax - 650,
                )
                y1 = max(
                    0,
                    ay - 130,
                )

                x2 = min(
                    variant.shape[1],
                    ax + aw + 650,
                )

                y2 = min(
                    variant.shape[0],
                    ay + ah + 130,
                )

                roi = variant[
                    y1:y2,
                    x1:x2,
                ]

                if roi.size == 0:
                    continue

                local_texts = []

                for local_psm in (6, 7, 11):
                    text = pytesseract.image_to_string(
                        roi,
                        config=(
                            f"--oem 3 --psm "
                            f"{local_psm}"
                        ),
                    )

                    if text.strip():
                        local_texts.append(text)

                combined_text = " ".join(local_texts)

                candidates = _extract_candidates(
                    combined_text
                )

                for candidate in candidates:
                    if not _candidate_has_mrp_context(
                        combined_text,
                        candidate,
                    ):
                        continue

                    distance = abs(
                        candidate["position"]
                        - combined_text.lower().find(
                            _normalize_token(
                                anchor["text"]
                            )
                        )
                    )

                    nearby = combined_text[
                        max(
                            0,
                            candidate["position"] - 20,
                        ):
                        candidate["position"] + 120
                    ].lower()

                    context_score = sum(
                        1
                        for term in TAX_TERMS
                        if term in nearby
                    )

                    score = (
                        context_score * 100
                        - min(distance, 1000) * 0.05
                        + min(
                            anchor["confidence"],
                            100,
                        ) * 0.25
                    )

                    result = {
                        "field": "mrp",
                        "normalized_value": candidate["value"],
                        "currency": "INR",
                        "raw_value": candidate["raw"],
                        "anchor": anchor["text"],
                        "anchor_confidence": anchor["confidence"],
                        "orientation": angle,
                        "preprocess": variant_name,
                        "psm": psm,
                        "roi": {
                            "x": x1,
                            "y": y1,
                            "width": x2 - x1,
                            "height": y2 - y1,
                        },
                        "ocr_context": combined_text.strip(),
                        "score": round(score, 2),
                    }

                    if (
                        best_result is None
                        or result["score"]
                        > best_result["score"]
                    ):
                        best_result = result

    return best_result
