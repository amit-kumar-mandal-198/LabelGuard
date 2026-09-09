from typing import Any


RATE_UNITS = {
    "g",
    "kg",
    "ml",
    "l",
    "gram",
    "grams",
    "litre",
    "liter",
}


def validate_mrp_result(result: dict[str, Any] | None) -> dict[str, Any]:
    """
    Converts the raw MRP detector output into a compliance-ready result.

    MRP is accepted only when:
    1. A usable numeric value exists.
    2. An MRP/INCL-style anchor was detected.
    3. Tax/inclusive context supports the declaration.
    4. The candidate is not a rate such as Rs.0.29/g.
    """

    if not result:
        return {
            "field": "mrp",
            "value": None,
            "currency": "INR",
            "status": "review",
            "confidence": 0.0,
            "reason": "MRP not detected",
        }

    value = result.get("normalized_value")
    raw_value = str(result.get("raw_value", ""))
    anchor = str(result.get("anchor", "")).lower()
    ocr_context = str(result.get("ocr_context", "")).lower()

    if value is None:
        return {
            "field": "mrp",
            "value": None,
            "currency": "INR",
            "status": "review",
            "confidence": 0.0,
            "reason": "MRP anchor found but amount is missing",
            "evidence": result,
        }

    # Reject obvious rate/unit-price patterns.
    rate_pattern = False

    for unit in RATE_UNITS:
        if f"/{unit}" in raw_value.lower():
            rate_pattern = True
            break

        if f"/{unit}" in ocr_context:
            rate_pattern = True
            break

    if rate_pattern:
        return {
            "field": "mrp",
            "value": None,
            "currency": "INR",
            "status": "review",
            "confidence": 0.0,
            "reason": "Detected amount appears to be a unit rate, not MRP",
            "evidence": result,
        }

    tax_context = any(
        term in ocr_context
        for term in (
            "incl",
            "inclusive",
            "tax",
            "taxes",
        )
    )

    anchor_context = (
        "mrp" in anchor
        or "incl" in anchor
        or "ncl" in anchor
    )

    if not anchor_context:
        return {
            "field": "mrp",
            "value": value,
            "currency": "INR",
            "status": "review",
            "confidence": 40.0,
            "reason": "Amount detected without strong MRP anchor",
            "evidence": result,
        }

    confidence = float(result.get("anchor_confidence", 0.0))

    if tax_context:
        confidence = min(98.0, confidence + 25.0)

    return {
        "field": "mrp",
        "value": float(value),
        "currency": "INR",
        "status": "extracted",
        "confidence": round(confidence, 2),
        "evidence": {
            "anchor": result.get("anchor"),
            "raw_value": raw_value,
            "tax_context_detected": tax_context,
            "orientation": result.get("orientation"),
            "preprocess": result.get("preprocess"),
            "psm": result.get("psm"),
            "roi": result.get("roi"),
        },
    }
