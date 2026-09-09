"""
Date and Best-Before/Expiry validator for LG-DATE and LG-BBE compliance rules.

Evaluates date-related declarations (manufacturing_date, packing_date,
expiry_date, best_before, date_sensitive_commodity) and provides structured
validation verdicts for the compliance engine.

No additional OCR passes are performed. All signals are derived from the
declarations already persisted in the database.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.declaration import Declaration


LOW_DATE_CONFIDENCE_THRESHOLD: float = 40.0


def validate_date_presence(
    declarations: dict[str, "Declaration"],
) -> dict[str, Any]:
    """
    Validate presence of a date of manufacture/packing/import (LG-DATE).
    """
    for field_name in ("manufacturing_date", "packing_date", "import_date"):
        decl = declarations.get(field_name)
        if decl and decl.is_present and (decl.normalized_value or decl.extracted_value):
            conf = float(decl.confidence or 0.0)
            if conf >= LOW_DATE_CONFIDENCE_THRESHOLD:
                return {
                    "status": "pass",
                    "field_name": field_name,
                    "value": decl.normalized_value or decl.extracted_value,
                    "confidence": conf,
                    "evidence": f"Valid {field_name} declaration identified",
                }
            return {
                "status": "review",
                "field_name": field_name,
                "value": decl.normalized_value or decl.extracted_value,
                "confidence": conf,
                "evidence": f"Low-confidence {field_name} declaration identified",
            }

    return {
        "status": "fail",
        "field_name": "manufacturing_date",
        "value": None,
        "confidence": None,
        "evidence": "No manufacturing or packing date identified",
    }


def validate_best_before(
    declarations: dict[str, "Declaration"],
) -> dict[str, Any]:
    """
    Validate best-before or expiry declaration for applicable commodities (LG-BBE).

    Returns
    -------
    dict with keys:
        status     – "pass" | "review" | "fail" | "not_applicable"
        field_name – "best_before" | "expiry_date" | None
        value      – str | None
        confidence – float | None
        evidence   – str
    """
    date_sensitive = declarations.get("date_sensitive_commodity")
    is_date_sensitive: bool | None = None

    if date_sensitive is not None:
        val = str(
            date_sensitive.normalized_value or date_sensitive.extracted_value or ""
        ).strip().lower()
        if val == "true":
            is_date_sensitive = True
        elif val == "false":
            is_date_sensitive = False

    # If explicitly non-date-sensitive commodity, rule is not applicable
    if is_date_sensitive is False:
        return {
            "status": "not_applicable",
            "field_name": None,
            "value": None,
            "confidence": None,
            "evidence": "Commodity is not date-sensitive (non-perishable)",
        }

    # Check for best_before or expiry_date declarations
    for field_name in ("expiry_date", "best_before"):
        decl = declarations.get(field_name)
        if decl and decl.is_present and (decl.normalized_value or decl.extracted_value):
            conf = float(decl.confidence or 0.0)
            val = decl.normalized_value or decl.extracted_value
            if conf >= LOW_DATE_CONFIDENCE_THRESHOLD:
                return {
                    "status": "pass",
                    "field_name": field_name,
                    "value": val,
                    "confidence": conf,
                    "evidence": f"Applicable {field_name} declaration identified: {val} (conf={conf}%)",
                }
            return {
                "status": "review",
                "field_name": field_name,
                "value": val,
                "confidence": conf,
                "evidence": f"Ambiguous/low-confidence {field_name} declaration identified: {val} (conf={conf}%)",
            }

    # If we don't know whether the commodity is date-sensitive, review is appropriate
    if is_date_sensitive is None:
        return {
            "status": "review",
            "field_name": "best_before",
            "value": None,
            "confidence": None,
            "evidence": "Commodity date-sensitivity could not be automatically determined",
        }

    # Applicable date-sensitive commodity with missing BBE/expiry declaration
    return {
        "status": "fail",
        "field_name": "best_before",
        "value": None,
        "confidence": None,
        "evidence": "Applicable best-before or use-by declaration was not identified",
    }
