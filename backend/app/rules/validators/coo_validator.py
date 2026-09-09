"""
Country of Origin validator for LG-COO compliance rule.

Evaluates origin-related declarations (country_of_origin, imported, importer)
and provides structured validation verdicts for the compliance engine.

Under Legal Metrology (Packaged Commodities) Rules, 2011 Rule 6(1)(aa):
- Country of origin declaration is mandatory for imported products.
- Where origin is declared (domestic or imported), it must be legible and verified.
- Non-imported/domestic packages without origin declarations are NOT_APPLICABLE.
- Packages with indeterminate import/origin status remain in REVIEW for officer decision.

No additional OCR passes are performed. All signals are derived from the
declarations already persisted in the database.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.declaration import Declaration


LOW_COO_CONFIDENCE_THRESHOLD: float = 35.0


def validate_country_of_origin(
    declarations: dict[str, "Declaration"],
) -> dict[str, Any]:
    """
    Validate country of origin declaration (LG-COO).

    Returns
    -------
    dict with keys:
        status     – "pass" | "review" | "fail" | "not_applicable"
        field_name – "country_of_origin" | "imported" | None
        value      – str | None
        confidence – float | None
        evidence   – str
    """
    coo_decl = declarations.get("country_of_origin")
    has_coo = (
        coo_decl is not None
        and coo_decl.is_present
        and bool(coo_decl.normalized_value or coo_decl.extracted_value)
    )

    imported_decl = declarations.get("imported")
    is_imported: bool | None = None
    if imported_decl is not None:
        val = str(
            imported_decl.normalized_value or imported_decl.extracted_value or ""
        ).strip().lower()
        if val == "true":
            is_imported = True
        elif val == "false":
            is_imported = False

    # 1. Country of Origin declaration is present on package
    if has_coo and coo_decl is not None:
        conf = float(coo_decl.confidence or 0.0)
        val = coo_decl.normalized_value or coo_decl.extracted_value
        if conf >= LOW_COO_CONFIDENCE_THRESHOLD:
            return {
                "status": "pass",
                "field_name": "country_of_origin",
                "value": val,
                "confidence": conf,
                "evidence": f"Applicable country of origin declaration identified: {val} (conf={conf}%)",
            }
        return {
            "status": "review",
            "field_name": "country_of_origin",
            "value": val,
            "confidence": conf,
            "evidence": f"Low-confidence country of origin declaration identified: {val} (conf={conf}%)",
        }

    # 2. Origin is not declared, and product is explicitly imported -> Mandatory violation
    if is_imported is True:
        return {
            "status": "fail",
            "field_name": "country_of_origin",
            "value": None,
            "confidence": None,
            "evidence": "Country of origin was not identified for an imported commodity",
        }

    # 3. Origin is not declared, and product is explicitly domestic / not imported -> Rule not applicable
    if is_imported is False:
        return {
            "status": "not_applicable",
            "field_name": None,
            "value": None,
            "confidence": None,
            "evidence": "Commodity is domestic/non-imported; country of origin declaration is not mandatory",
        }

    # 4. Origin is not declared, and import status cannot be determined -> Officer review
    return {
        "status": "review",
        "field_name": "country_of_origin",
        "value": None,
        "confidence": None,
        "evidence": "Applicability of country of origin could not be safely determined without importer declaration",
    }
