from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np


@dataclass
class TamperSignal:
    name: str
    score: float
    reason: str


def _clip(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _roi_stats(image: np.ndarray, roi: tuple[int, int, int, int]) -> dict[str, float] | None:
    x, y, w, h = roi

    x1 = max(0, x)
    y1 = max(0, y)
    x2 = min(image.shape[1], x + w)
    y2 = min(image.shape[0], y + h)

    if x2 <= x1 or y2 <= y1:
        return None

    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        return None

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    edges = cv2.Canny(gray, 80, 160)

    return {
        "mean": float(np.mean(gray)),
        "std": float(np.std(gray)),
        "edge_density": float(np.mean(edges > 0)),
        "area": float(crop.shape[0] * crop.shape[1]),
    }


def _detect_rectangular_overlay(
    image: np.ndarray,
    roi: tuple[int, int, int, int],
) -> TamperSignal | None:

    x, y, w, h = roi

    x1 = max(0, x)
    y1 = max(0, y)
    x2 = min(image.shape[1], x + w)
    y2 = min(image.shape[0], y + h)

    if x2 <= x1 or y2 <= y1:
        return None

    crop = image[y1:y2, x1:x2]

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_LIST,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    crop_area = crop.shape[0] * crop.shape[1]

    best_score = 0.0
    best_reason = ""

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < crop_area * 0.03:
            continue

        if area > crop_area * 0.95:
            continue

        perimeter = cv2.arcLength(contour, True)

        if perimeter == 0:
            continue

        approx = cv2.approxPolyDP(
            contour,
            0.04 * perimeter,
            True,
        )

        if len(approx) not in (4, 5):
            continue

        rx, ry, rw, rh = cv2.boundingRect(contour)

        if rw == 0 or rh == 0:
            continue

        aspect_ratio = rw / rh

        if aspect_ratio < 0.25 or aspect_ratio > 8.0:
            continue

        rectangularity = area / float(rw * rh)

        score = (
            min(rectangularity * 60.0, 60.0)
            + min(area / crop_area * 100.0, 40.0)
        )

        if score > best_score:
            best_score = score
            best_reason = (
                f"rectangular local region detected "
                f"(rectangularity={rectangularity:.2f})"
            )

    if best_score < 45:
        return None

    return TamperSignal(
        name="mrp_region_overlay_suspected",
        score=_clip(best_score),
        reason=best_reason,
    )


def _detect_local_texture_anomaly(
    image: np.ndarray,
    roi: tuple[int, int, int, int],
) -> TamperSignal | None:

    x, y, w, h = roi

    stats = _roi_stats(image, roi)

    if stats is None:
        return None

    # Compare central MRP region against a surrounding ring.
    pad = max(10, int(min(w, h) * 0.35))

    outer = (
        max(0, x - pad),
        max(0, y - pad),
        min(image.shape[1] - max(0, x - pad), w + 2 * pad),
        min(image.shape[0] - max(0, y - pad), h + 2 * pad),
    )

    outer_stats = _roi_stats(image, outer)

    if outer_stats is None:
        return None

    mean_difference = abs(
        stats["mean"] - outer_stats["mean"]
    )

    std_difference = abs(
        stats["std"] - outer_stats["std"]
    )

    edge_difference = abs(
        stats["edge_density"] - outer_stats["edge_density"]
    )

    anomaly = (
        min(mean_difference * 1.2, 35.0)
        + min(std_difference * 0.8, 35.0)
        + min(edge_difference * 120.0, 30.0)
    )

    if anomaly < 30:
        return None

    return TamperSignal(
        name="local_print_texture_anomaly",
        score=_clip(anomaly),
        reason=(
            f"MRP region differs from surrounding packaging "
            f"(mean={mean_difference:.1f}, "
            f"texture={std_difference:.1f}, "
            f"edges={edge_difference:.3f})"
        ),
    )


def _price_mismatch_signal(
    declared_mrp: float | None,
    reference_mrp: float | None,
) -> TamperSignal | None:

    if declared_mrp is None or reference_mrp is None:
        return None

    if abs(declared_mrp - reference_mrp) < 0.001:
        return None

    difference = abs(declared_mrp - reference_mrp)

    return TamperSignal(
        name="reference_price_mismatch",
        score=70.0,
        reason=(
            f"declared MRP ₹{declared_mrp:.2f} "
            f"does not match reference MRP ₹{reference_mrp:.2f} "
            f"(difference ₹{difference:.2f})"
        ),
    )


def analyze_mrp_tampering(
    image: np.ndarray,
    mrp_roi: tuple[int, int, int, int] | None,
    declared_mrp: float | None,
    reference_mrp: float | None,
) -> dict[str, Any]:

    signals: list[TamperSignal] = []

    mismatch = _price_mismatch_signal(
        declared_mrp,
        reference_mrp,
    )

    if mismatch:
        signals.append(mismatch)

    if mrp_roi:
        rectangle = _detect_rectangular_overlay(
            image,
            mrp_roi,
        )

        if rectangle:
            signals.append(rectangle)

        texture = _detect_local_texture_anomaly(
            image,
            mrp_roi,
        )

        if texture:
            signals.append(texture)

    if not signals:
        return {
            "status": "NOT_SUSPECTED",
            "risk_score": 0.0,
            "signals": [],
        }

    # Combine independent evidence without simply summing to >100.
    probability_like = 1.0

    for signal in signals:
        probability_like *= 1.0 - (
            min(signal.score, 99.0) / 100.0
        )

    risk_score = _clip(
        (1.0 - probability_like) * 100.0
    )

    if risk_score >= 75:
        status = "HIGH_RISK"
    elif risk_score >= 45:
        status = "SUSPECTED"
    else:
        status = "LOW_RISK"

    return {
        "status": status,
        "risk_score": round(risk_score, 2),
        "signals": [
            {
                "name": signal.name,
                "score": round(signal.score, 2),
                "reason": signal.reason,
            }
            for signal in signals
        ],
    }
