"""
Readability validator for the LG-LEGIBILITY compliance rule.

Evaluates the ``declaration_legibility`` declaration that is computed
during analysis (analysis_service._compute_legibility) and returns a
structured verdict that the rule engine can use.

No additional OCR pass is performed here.  All signals are derived from
the declarations already persisted in the database.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.declaration import Declaration


# Mandatory fields that must be readable for a label to pass legibility.
REQUIRED_LEGIBILITY_FIELDS: tuple[str, ...] = (
    "mrp",
    "net_quantity",
    "manufacturing_date",
    "manufacturer",
    "consumer_care",
)

# Confidence below this value is treated as low-quality even if present.
LOW_CONFIDENCE_THRESHOLD: float = 40.0

# Score gates (same as analysis_service constants – kept in sync).
PASS_SCORE: float = 70.0
REVIEW_SCORE: float = 40.0


def validate_legibility(
    declarations: dict[str, "Declaration"],
) -> dict[str, Any]:
    """
    Derive a legibility verdict from already-persisted declarations.

    Parameters
    ----------
    declarations:
        Mapping of field_name → Declaration row (as produced by
        compliance_service._declaration_map).

    Returns
    -------
    dict with keys:
        status        – "pass" | "review" | "fail"
        score         – float 0–100
        avg_confidence – float
        evidence      – list[dict] per required field
    """
    evidence: list[dict[str, Any]] = []
    score: float = 0.0
    confidence_values: list[float] = []

    for field_name in REQUIRED_LEGIBILITY_FIELDS:
        declaration = declarations.get(field_name)

        if declaration is None:
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": 0,
                    "reason": "missing",
                }
            )
            continue

        value = (
            declaration.normalized_value
            or declaration.extracted_value
        )
        confidence = float(declaration.confidence or 0.0)

        if not value or not declaration.is_present:
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": round(confidence, 2),
                    "reason": "not_found",
                }
            )
            continue

        confidence_values.append(confidence)

        if confidence >= LOW_CONFIDENCE_THRESHOLD:
            score += 15.0
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": round(confidence, 2),
                    "reason": "readable",
                }
            )
        else:
            score += 7.0
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": round(confidence, 2),
                    "reason": "low_confidence",
                }
            )

    # Incorporate confidence from non-required found fields as bonus signal.
    for field_name, declaration in declarations.items():
        if field_name in REQUIRED_LEGIBILITY_FIELDS:
            continue

        if declaration is None:
            continue

        confidence = float(declaration.confidence or 0.0)

        if declaration.is_present and confidence > 0:
            confidence_values.append(confidence)

    avg_confidence = (
        sum(confidence_values) / len(confidence_values)
        if confidence_values
        else 0.0
    )

    # Blend average OCR confidence into score (up to 25 bonus pts).
    score += avg_confidence * 0.25
    score = min(score, 100.0)

    if score >= PASS_SCORE:
        verdict = "pass"
    elif score >= REVIEW_SCORE:
        verdict = "review"
    else:
        verdict = "fail"

    return {
        "status": verdict,
        "score": round(score, 2),
        "avg_confidence": round(avg_confidence, 2),
        "evidence": evidence,
    }
