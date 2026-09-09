import re
from typing import Any


MRP_ANCHORS = (
    "mrp",
    "m.r.p",
    "m.r.p.",
)

TAX_CONTEXTS = (
    "incl",
    "inclusive",
    "tax",
    "taxes",
)


def _clean_text(value: str) -> str:
    value = value.replace("₹", "Rs.")
    value = value.replace("/-", "")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _parse_amount(text: str) -> float | None:
    text = text.replace(",", "")

    patterns = [
        r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)",
        r"\b(\d+(?:\.\d{1,2})?)\s*/-",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None

    return None


def extract_mrp_from_text(raw_text: str) -> dict[str, Any] | None:
    """
    Generic MRP extraction from OCR text.

    Important:
    - Does NOT hardcode any product price.
    - Requires an MRP anchor.
    - Prefers INR amount close to the MRP declaration.
    - Uses tax wording as supporting evidence.
    """

    if not raw_text:
        return None

    cleaned = _clean_text(raw_text)

    # Find the MRP declaration first.
    anchor_match = None

    for anchor in MRP_ANCHORS:
        match = re.search(
            rf"\b{re.escape(anchor)}\b",
            cleaned,
            flags=re.IGNORECASE,
        )
        if match:
            anchor_match = match
            break

    if not anchor_match:
        return None

    # Inspect only the local declaration after MRP.
    local_text = cleaned[anchor_match.start():]
    local_text = local_text[:160]

    amount = _parse_amount(local_text)

    if amount is None:
        return {
            "field": "mrp",
            "raw_value": local_text,
            "normalized_value": None,
            "currency": "INR",
            "confidence": 0.0,
            "status": "review",
            "reason": "MRP anchor found but amount could not be reliably extracted",
        }

    lower_local = local_text.lower()

    context_hits = sum(
        1 for context in TAX_CONTEXTS
        if context in lower_local
    )

    confidence = 0.80

    if context_hits >= 2:
        confidence = 0.95
    elif context_hits == 1:
        confidence = 0.88

    return {
        "field": "mrp",
        "raw_value": local_text,
        "normalized_value": amount,
        "currency": "INR",
        "confidence": round(confidence * 100, 2),
        "status": "extracted",
        "context_confirmed": context_hits > 0,
        "evidence": {
            "anchor": "MRP",
            "tax_context_hits": context_hits,
        },
    }
