from pathlib import Path
from typing import Any
import re

import cv2

from app.ai.ocr.ocr_engine import run_ocr


ROTATIONS = (0, 90, 180, 270)

LEGAL_METROLOGY_KEYWORDS = {
    "mrp",
    "rs",
    "₹",
    "net",
    "qty",
    "quantity",
    "weight",
    "volume",
    "manufactured",
    "manufacturing",
    "manufacturer",
    "packed",
    "packer",
    "importer",
    "address",
    "consumer",
    "customer",
    "care",
    "date",
    "batch",
    "ingredients",
    "country",
    "origin",
    "product",
    "price",
    "inclusive",
    "taxes",
    "unit",
}

COMMON_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "food",
    "india",
    "limited",
    "private",
    "please",
    "information",
    "contact",
    "service",
    "manufactured",
}


def rotate_image(image, angle: int):
    """Rotate image clockwise by 0/90/180/270 degrees."""
    if angle == 0:
        return image

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)

    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

    raise ValueError(f"Unsupported rotation: {angle}")


def _normalize_token(value: str) -> str:
    """Normalize OCR token for scoring."""
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9₹.%/-]", "", value)
    return value


def _is_meaningful_token(token: str) -> bool:
    """Reject obvious OCR noise."""
    token = _normalize_token(token)

    if not token:
        return False

    # Single character tokens are usually noise,
    # except useful symbols.
    if len(token) == 1 and token not in {"₹", "%"}:
        return token.isdigit()

    # Require some alphabetic/numeric content.
    return bool(re.search(r"[a-z0-9₹]", token))


def _quality_score(ocr_result: dict[str, Any]) -> float:
    """
    Domain-aware OCR quality score.

    The score rewards:
    - readable tokens
    - higher OCR confidence
    - legal-metrology relevant terminology
    - common natural-language words
    - numeric/date/currency patterns

    And penalizes:
    - zero-confidence tokens
    - obvious symbol garbage
    """

    words = ocr_result.get("words", [])

    if not words:
        return 0.0

    total = 0
    meaningful = 0
    high_confidence = 0
    keyword_hits = 0
    common_word_hits = 0
    numeric_hits = 0
    garbage = 0

    confidence_values = []

    for word in words:
        total += 1

        raw_text = str(word.get("text", "")).strip()
        token = _normalize_token(raw_text)

        try:
            confidence = float(word.get("confidence", 0))
        except (TypeError, ValueError):
            confidence = 0.0

        confidence_values.append(max(confidence, 0.0))

        if not _is_meaningful_token(token):
            garbage += 1
            continue

        meaningful += 1

        if confidence >= 50:
            high_confidence += 1

        if token in LEGAL_METROLOGY_KEYWORDS:
            keyword_hits += 1

        if token in COMMON_WORDS:
            common_word_hits += 1

        if re.fullmatch(r"\d+(?:[.,]\d+)?", token):
            numeric_hits += 1

        # Tokens made almost entirely of strange punctuation
        # are treated as noise.
        if not re.search(r"[a-z0-9₹]", token):
            garbage += 1

    avg_confidence = (
        sum(confidence_values) / len(confidence_values)
        if confidence_values
        else 0.0
    )

    meaningful_ratio = meaningful / max(total, 1)
    high_conf_ratio = high_confidence / max(total, 1)
    garbage_ratio = garbage / max(total, 1)

    # Scoring weights are intentionally simple and transparent.
    score = 0.0

    score += avg_confidence * 0.45
    score += meaningful_ratio * 20.0
    score += high_conf_ratio * 20.0
    score += keyword_hits * 4.0
    score += common_word_hits * 1.5
    score += min(numeric_hits, 20) * 0.8

    # Strong penalty for OCR garbage.
    score -= garbage_ratio * 15.0

    return round(max(score, 0.0), 2)


def detect_best_orientation(image_path: str | Path) -> dict[str, Any]:
    """
    Try 0°, 90°, 180°, and 270° and select the best OCR orientation.

    Returns:
        {
            "best_angle": int,
            "score": float,
            "ocr": dict,
            "candidates": [...]
        }
    """

    image_path = str(image_path)

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Unable to load image: {image_path}")

    candidates = []

    # Most product labels are upright or upside-down. Test those first,
    # then fall back to the 90° orientations only when the result remains
    # ambiguous.
    angle_order = (0, 180, 90, 270)

    for angle in angle_order:
        rotated = rotate_image(image, angle)

        temp_path = Path(image_path).with_name(
            f".orientation_{angle}.png"
        )

        success = cv2.imwrite(str(temp_path), rotated)

        if not success:
            raise RuntimeError(
                f"Failed to create temporary image for {angle}°"
            )

        try:
            ocr_result = run_ocr(str(temp_path))
            score = _quality_score(ocr_result)
            word_count = len(
                ocr_result.get("words", [])
            )

            candidates.append(
                {
                    "angle": angle,
                    "score": score,
                    "word_count": word_count,
                    "ocr": ocr_result,
                }
            )

            # Stop early when the orientation is clearly readable.
            # Keep a conservative threshold so difficult labels still
            # fall through to the remaining rotations.
            if (
                score >= 85.0
                and word_count >= 20
            ):
                break

        finally:
            temp_path.unlink(missing_ok=True)

    best = max(candidates, key=lambda item: item["score"])

    return {
        "best_angle": best["angle"],
        "score": best["score"],
        "ocr": best["ocr"],
        "candidates": [
            {
                "angle": item["angle"],
                "score": item["score"],
                "word_count": item["word_count"],
            }
            for item in candidates
        ],
    }