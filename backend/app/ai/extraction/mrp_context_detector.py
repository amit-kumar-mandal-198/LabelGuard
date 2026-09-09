from __future__ import annotations

import re
from typing import Any


CONTEXT_WORDS = {
    "mrp",
    "m.r.p",
    "incl",
    "inclusive",
    "taxes",
    "tax",
    "rs",
}


def _clean(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        str(value or "").strip(),
    )


def _is_numeric_token(text: str) -> bool:
    return bool(
        re.fullmatch(
            r"(?:₹|rs\.?)?\s*[0-9]+(?:[.,][0-9]+)?(?:/-)?",
            text,
            flags=re.IGNORECASE,
        )
    )


def _number_from_token(text: str) -> float | None:
    cleaned = re.sub(
        r"(?:₹|rs\.?)",
        "",
        str(text),
        flags=re.IGNORECASE,
    )

    cleaned = cleaned.replace(
        "/-",
        "",
    )

    cleaned = cleaned.strip()

    match = re.search(
        r"[0-9]+(?:[.,][0-9]+)?",
        cleaned,
    )

    if not match:
        return None

    try:
        return float(
            match.group(0).replace(",", ".")
        )
    except ValueError:
        return None


def find_mrp_candidates(
    words: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Generic MRP candidate detection based on OCR words,
    spatial proximity and MRP-related context.

    No product-specific price is hardcoded.
    """

    candidates = []

    normalized_words = []

    for index, word in enumerate(words):
        raw = str(
            word.get("text", "")
        ).strip()

        if not raw:
            continue

        normalized_words.append(
            {
                "index": index,
                "text": raw,
                "lower": raw.lower().strip(
                    ".,:;()[]"
                ),
                "confidence": float(
                    word.get("confidence", 0)
                    or 0
                ),
                "bbox": word.get(
                    "bbox",
                    {},
                ),
            }
        )

    for current in normalized_words:

        if current["lower"] not in CONTEXT_WORDS:
            continue

        cx = (
            current["bbox"].get("x", 0)
            + current["bbox"].get("width", 0) / 2
        )

        cy = (
            current["bbox"].get("y", 0)
            + current["bbox"].get("height", 0) / 2
        )

        nearby = []

        for other in normalized_words:

            if other["index"] == current["index"]:
                continue

            if not _is_numeric_token(
                other["text"]
            ):
                continue

            ox = (
                other["bbox"].get("x", 0)
                + other["bbox"].get("width", 0) / 2
            )

            oy = (
                other["bbox"].get("y", 0)
                + other["bbox"].get("height", 0) / 2
            )

            dx = abs(ox - cx)
            dy = abs(oy - cy)

            # Same region / nearby text.
            if dx <= 450 and dy <= 250:
                nearby.append(
                    (
                        dx + dy,
                        other,
                    )
                )

        nearby.sort(
            key=lambda item: item[0]
        )

        for distance, numeric in nearby[:5]:

            value = _number_from_token(
                numeric["text"]
            )

            if value is None:
                continue

            score = 0.0

            # Strong MRP anchors.
            if current["lower"] in {
                "mrp",
                "m.r.p",
            }:
                score += 70

            if current["lower"] in {
                "incl",
                "inclusive",
                "taxes",
                "tax",
            }:
                score += 40

            if current["lower"] in {
                "rs",
            }:
                score += 45

            # OCR confidence.
            score += min(
                numeric["confidence"],
                100,
            ) * 0.25

            # Spatial proximity.
            score += max(
                0,
                20 - distance / 100,
            )

            candidates.append(
                {
                    "value": round(
                        value,
                        2,
                    ),
                    "raw_value": numeric["text"],
                    "context_word": current["text"],
                    "context_confidence": current[
                        "confidence"
                    ],
                    "numeric_confidence": numeric[
                        "confidence"
                    ],
                    "score": round(
                        score,
                        2,
                    ),
                    "evidence": [
                        {
                            "text": current["text"],
                            "confidence": current[
                                "confidence"
                            ],
                            "bbox": current["bbox"],
                        },
                        {
                            "text": numeric["text"],
                            "confidence": numeric[
                                "confidence"
                            ],
                            "bbox": numeric["bbox"],
                        },
                    ],
                }
            )

    # Remove duplicate numeric/context combinations.
    unique = {}

    for candidate in candidates:
        key = (
            candidate["value"],
            candidate["context_word"].lower(),
            tuple(
                sorted(
                    (
                        e["bbox"].get("x", 0),
                        e["bbox"].get("y", 0),
                    )
                    for e in candidate["evidence"]
                )
            ),
        )

        previous = unique.get(key)

        if (
            previous is None
            or candidate["score"]
            > previous["score"]
        ):
            unique[key] = candidate

    result = list(unique.values())

    result.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return result


def select_mrp_candidate(
    words: list[dict[str, Any]],
) -> dict[str, Any]:
    candidates = find_mrp_candidates(words)

    if not candidates:
        return {
            "value": None,
            "raw_value": None,
            "confidence": None,
            "context_confirmed": False,
            "evidence": [],
            "candidates": [],
        }

    best = candidates[0]

    confidence = round(
        (
            best["numeric_confidence"]
            + best["context_confidence"]
        ) / 2,
        2,
    )

    return {
        "value": best["value"],
        "raw_value": best["raw_value"],
        "confidence": confidence,
        "context_confirmed": (
            best["score"] >= 70
        ),
        "evidence": best["evidence"],
        "candidates": candidates[:10],
    }
