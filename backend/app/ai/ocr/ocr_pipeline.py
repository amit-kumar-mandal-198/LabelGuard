from pathlib import Path
from typing import Any
import re

import cv2

from app.ai.preprocessing.image_preprocessor import (
    load_image,
    preprocess_for_ocr,
)
from app.ai.preprocessing.orientation_detector import rotate_image
from app.ai.ocr.ocr_engine import run_ocr


ROTATIONS = (0, 90, 180, 270)

USEFUL_DECLARATION_TERMS = {
    "mrp",
    "rs",
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
    "lic",
    "fssai",
}


def _normalize_token(value: str) -> str:
    value = str(value or "").strip().lower()
    return re.sub(r"[^a-z0-9₹.%/-]", "", value)


def _calculate_quality(result: dict[str, Any]) -> dict[str, Any]:
    words = result.get("words", [])

    if not words:
        return {
            "score": 0.0,
            "usable_words": 0,
            "high_confidence_words": 0,
            "keyword_hits": 0,
            "numeric_hits": 0,
            "avg_confidence": 0.0,
            "quality_status": "poor",
        }

    usable_words = 0
    high_confidence_words = 0
    keyword_hits = 0
    numeric_hits = 0
    confidence_values = []

    for item in words:
        raw = str(item.get("text", "")).strip()
        token = _normalize_token(raw)

        try:
            confidence = float(item.get("confidence", 0))
        except (TypeError, ValueError):
            confidence = 0.0

        confidence_values.append(max(confidence, 0.0))

        if len(token) >= 2 and re.search(r"[a-z0-9]", token):
            usable_words += 1

        if confidence >= 50:
            high_confidence_words += 1

        if token in USEFUL_DECLARATION_TERMS:
            keyword_hits += 1

        if re.fullmatch(r"\d+(?:[.,]\d+)?", token):
            numeric_hits += 1

    total = len(words)

    avg_confidence = sum(confidence_values) / total
    usable_ratio = usable_words / total
    high_confidence_ratio = high_confidence_words / total

    score = (
        avg_confidence * 0.50
        + usable_ratio * 25
        + high_confidence_ratio * 25
        + min(keyword_hits, 15) * 4
        + min(numeric_hits, 20) * 0.5
    )

    score = round(score, 2)

    if score >= 70:
        quality_status = "good"
    elif score >= 45:
        quality_status = "usable_with_review"
    else:
        quality_status = "poor"

    return {
        "score": score,
        "usable_words": usable_words,
        "high_confidence_words": high_confidence_words,
        "keyword_hits": keyword_hits,
        "numeric_hits": numeric_hits,
        "avg_confidence": round(avg_confidence, 2),
        "quality_status": quality_status,
    }


def run_preprocessed_ocr(
    image_path: str | Path,
) -> dict[str, Any]:
    image_path = str(image_path)

    image = load_image(image_path)

    candidates = []

    for angle in ROTATIONS:
        rotated = rotate_image(image, angle)
        processed = preprocess_for_ocr(rotated)

        for variant_name, processed_image in processed.items():
            temp_path = Path(image_path).with_name(
                f".ocr_{angle}_{variant_name}.png"
            )

            if not cv2.imwrite(str(temp_path), processed_image):
                raise RuntimeError(
                    f"Failed to write OCR candidate: {temp_path}"
                )

            try:
                result = run_ocr(str(temp_path))
                quality = _calculate_quality(result)

                candidates.append(
                    {
                        "angle": angle,
                        "variant": variant_name,
                        "score": quality["score"],
                        "word_count": len(result.get("words", [])),
                        "quality": quality,
                        "ocr": result,
                    }
                )
            finally:
                temp_path.unlink(missing_ok=True)

    best = max(candidates, key=lambda item: item["score"])

    return {
        "best_angle": best["angle"],
        "best_variant": best["variant"],
        "score": best["score"],
        "quality": best["quality"],
        "ocr": best["ocr"],
        "candidates": [
            {
                "angle": item["angle"],
                "variant": item["variant"],
                "score": item["score"],
                "word_count": item["word_count"],
                "quality_status": item["quality"]["quality_status"],
            }
            for item in candidates
        ],
    }
