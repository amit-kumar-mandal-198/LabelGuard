from __future__ import annotations

import re
from typing import Any


MRP_CONTEXT_PATTERNS = (
    r"\bmrp\b",
    r"\bm\.r\.p\.?\b",
    r"\bincl\.?\s+of\s+all\s+taxes\b",
    r"\binclusive\s+of\s+all\s+taxes\b",
)


def _parse_number(value: str) -> float | None:
    value = value.replace(",", ".").strip()

    try:
        return float(value)
    except ValueError:
        return None


def _candidate_score(
    raw: str,
    context: str,
) -> float:
    score = 0.0

    lower = context.lower()

    if re.search(r"\bmrp\b|\bm\.r\.p\.?\b", lower):
        score += 60.0

    if re.search(
        r"\bincl\.?\s+of\s+all\s+taxes\b"
        r"|\binclusive\s+of\s+all\s+taxes\b",
        lower,
    ):
        score += 30.0

    if re.search(r"(?:₹|rs\.?)", raw, re.I):
        score += 10.0

    return score


def extract_mrp_candidates(
    text: str,
) -> list[dict[str, Any]]:
    """
    Generic MRP candidate generation.

    No product-specific price is hardcoded.
    """

    clean = str(text or "")

    candidates: list[dict[str, Any]] = []

    # ---------------------------------------------------------
    # Candidate type 1:
    # Explicit MRP label
    # ---------------------------------------------------------
    explicit_pattern = re.compile(
        r"(?:mrp|m\.r\.p\.?)\s*"
        r"[:.]?\s*"
        r"(?:₹|rs\.?)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",
        re.IGNORECASE,
    )

    for match in explicit_pattern.finditer(clean):
        raw_number = match.group(1)

        value = _parse_number(raw_number)

        if value is None:
            continue

        start = max(
            0,
            match.start() - 60,
        )

        end = min(
            len(clean),
            match.end() + 100,
        )

        context = clean[start:end]

        candidates.append(
            {
                "value": value,
                "raw_value": match.group(0),
                "context": context,
                "score": _candidate_score(
                    match.group(0),
                    context,
                ),
                "source": "explicit_mrp_label",
            }
        )

    # ---------------------------------------------------------
    # Candidate type 2:
    # Price + tax context
    #
    # Examples:
    # 5/- (INCL. OF ALL TAXES)
    # ₹ 120 (INCLUSIVE OF ALL TAXES)
    # ---------------------------------------------------------
    tax_pattern = re.compile(
        r"(?:₹|rs\.?)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
        r"\s*[/+\-]?\s*"
        r"\(?\s*"
        r"(?:incl\.?\s*(?:of\s*)?all\s+taxes|"
        r"inclusive\s+of\s+all\s+taxes)"
        r"\)?",
        re.IGNORECASE,
    )

    for match in tax_pattern.finditer(clean):
        raw_number = match.group(1)

        value = _parse_number(raw_number)

        if value is None:
            continue

        context = match.group(0)

        candidates.append(
            {
                "value": value,
                "raw_value": context,
                "context": context,
                "score": 100.0,
                "source": "tax_context",
            }
        )

    # Highest confidence candidates first.
    candidates.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return candidates


def extract_mrp_candidate(
    ocr_text: str,
    words: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Select the strongest generic MRP candidate and attach
    OCR evidence where possible.
    """

    candidates = extract_mrp_candidates(
        ocr_text
    )

    if not candidates:
        return {
            "value": None,
            "raw_value": None,
            "confidence": None,
            "context_confirmed": False,
            "evidence": [],
        }

    best = candidates[0]

    evidence: list[dict[str, Any]] = []

    numeric_value = str(best["value"])

    for word in words:
        token = str(
            word.get("text", "")
        ).strip()

        if not token:
            continue

        normalized = token.lower().replace(
            ",",
            ".",
        )

        if (
            normalized == numeric_value
            or "mrp" in normalized
            or "incl" in normalized
            or "tax" in normalized
            or re.fullmatch(
                r"(?:₹|rs\.?)?\s*[0-9.,]+",
                normalized,
            )
        ):
            evidence.append(
                {
                    "text": token,
                    "confidence": word.get(
                        "confidence"
                    ),
                    "bbox": word.get("bbox"),
                }
            )

    confidence_values = []

    for item in evidence:
        try:
            confidence_values.append(
                float(item["confidence"])
            )
        except (
            TypeError,
            ValueError,
        ):
            continue

    if confidence_values:
        confidence = round(
            sum(confidence_values)
            / len(confidence_values),
            2,
        )
    else:
        confidence = best["score"]

    return {
        "value": round(
            float(best["value"]),
            2,
        ),
        "raw_value": best["raw_value"],
        "confidence": confidence,
        "context_confirmed": (
            best["source"] == "tax_context"
            or best["score"] >= 60
        ),
        "source": best["source"],
        "context": best["context"],
        "evidence": evidence,
    }
