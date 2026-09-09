from __future__ import annotations

import re
from typing import Any


MRP_CONTEXT_TERMS = (
    "incl",
    "inclusive",
    "taxes",
    "all taxes",
)


def _parse_mrp_amount(text: str) -> float | None:
    """
    Extract numeric MRP from a short OCR candidate.
    """

    match = re.search(
        r"(?:₹|rs\.?|mrp\s*)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",
        text,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    try:
        return float(
            match.group(1).replace(",", ".")
        )
    except ValueError:
        return None


def extract_mrp_candidate(
    ocr_text: str,
    words: list[dict[str, Any]],
) -> dict[str, Any]:

    text = str(ocr_text or "")

    # Strong MRP context in OCR.
    has_mrp_label = bool(
        re.search(
            r"\bmrp\b|\bm\.r\.p\.?\b",
            text,
            flags=re.IGNORECASE,
        )
    )

    has_tax_context = all(
        term in text.lower()
        for term in (
            "incl",
            "tax",
        )
    )

    candidates = []

    # ---------------------------------------------------------
    # Candidate: explicit MRP label
    # ---------------------------------------------------------
    for match in re.finditer(
        r"\b(?:mrp|m\.r\.p\.?)\s*"
        r"[:.]?\s*(?:₹|rs\.?)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",
        text,
        flags=re.IGNORECASE,
    ):
        amount = _parse_mrp_amount(
            match.group(0)
        )

        if amount is not None:
            candidates.append(
                {
                    "amount": amount,
                    "raw": match.group(0),
                    "score": 90.0,
                }
            )

    # ---------------------------------------------------------
    # Candidate: "(INCL. OF ALL TAXES)" context
    # ---------------------------------------------------------
    tax_match = re.search(
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
        r"\s*[/+\-]?\s*"
        r"\(?\s*INCL\.?\s*\.?"
        r"\s*(?:OF\s+)?ALL\s+TAXES",
        text,
        flags=re.IGNORECASE,
    )

    if tax_match:
        amount = _parse_mrp_amount(
            tax_match.group(1)
        )

        if amount is not None:
            candidates.append(
                {
                    "amount": amount,
                    "raw": tax_match.group(0),
                    "score": 100.0,
                }
            )

    # ---------------------------------------------------------
    # Reject likely unrelated decimal OCR readings
    # ---------------------------------------------------------
    if not candidates:
        return {
            "value": None,
            "raw_value": None,
            "confidence": None,
            "context_confirmed": False,
            "evidence": [],
        }

    best = max(
        candidates,
        key=lambda item: item["score"],
    )

    evidence = []

    amount_text = str(
        best["amount"]
    )

    # Locate OCR words related to the candidate.
    for word in words:
        token = str(
            word.get("text", "")
        ).strip()

        if not token:
            continue

        normalized = token.replace(
            ",",
            ".",
        )

        if (
            amount_text == normalized
            or "incl" in token.lower()
            or "tax" in token.lower()
        ):
            evidence.append(
                {
                    "text": token,
                    "confidence": word.get("confidence"),
                    "bbox": word.get("bbox"),
                }
            )

    evidence_confidences = []

    for item in evidence:
        try:
            evidence_confidences.append(
                float(item["confidence"])
            )
        except (
            TypeError,
            ValueError,
        ):
            pass

    confidence = (
        round(
            sum(evidence_confidences)
            / len(evidence_confidences),
            2,
        )
        if evidence_confidences
        else best["score"]
    )

    return {
        "value": round(
            float(best["amount"]),
            2,
        ),
        "raw_value": best["raw"],
        "confidence": confidence,
        "context_confirmed": (
            has_mrp_label
            or has_tax_context
        ),
        "evidence": evidence,
    }
