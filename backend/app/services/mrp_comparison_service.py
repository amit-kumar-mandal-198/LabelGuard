from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.mrp_finding import MRPFinding
from app.models.product_mrp_reference import ProductMRPReference


def compare_mrp(
    db: Session,
    inspection_id: int,
    image_id: int | None,
    product_id: int,
    declared_mrp: float | None,
    pack_quantity: float | None = None,
    pack_unit: str | None = None,
    variant: str | None = None,
    tamper_status: str = "NOT_SUSPECTED",
    tamper_risk_score: float = 0.0,
    tamper_evidence: dict[str, Any] | None = None,
) -> MRPFinding:

    if declared_mrp is None:
        finding = MRPFinding(
            inspection_id=inspection_id,
            image_id=image_id,
            declared_mrp=None,
            reference_mrp=None,
            price_status="NO_DECLARED_MRP",
            difference_amount=None,
            reference_source=None,
            tamper_status=tamper_status,
            tamper_risk_score=tamper_risk_score,
            decision="REVIEW",
            reason="MRP could not be reliably extracted from the package image.",
            evidence=tamper_evidence,
        )

        db.add(finding)
        db.commit()
        db.refresh(finding)

        return finding

    statement = select(ProductMRPReference).where(
        ProductMRPReference.product_id == product_id
    )

    references = list(
        db.scalars(statement).all()
    )

    # Prefer matching pack size.
    candidates = references

    if pack_quantity is not None and pack_unit:
        normalized_unit = pack_unit.strip().lower()

        matching_pack = [
            ref
            for ref in references
            if ref.pack_quantity is not None
            and float(ref.pack_quantity) == float(pack_quantity)
            and (ref.pack_unit or "").strip().lower()
            == normalized_unit
        ]

        if matching_pack:
            candidates = matching_pack

    # Prefer matching variant when provided.
    if variant:
        variant_lower = variant.strip().lower()

        matching_variant = [
            ref
            for ref in candidates
            if (ref.variant or "").strip().lower()
            == variant_lower
        ]

        if matching_variant:
            candidates = matching_variant

    # No trusted reference.
    if not candidates:
        finding = MRPFinding(
            inspection_id=inspection_id,
            image_id=image_id,
            declared_mrp=Decimal(str(declared_mrp)),
            reference_mrp=None,
            price_status="NO_REFERENCE",
            difference_amount=None,
            reference_source=None,
            tamper_status=tamper_status,
            tamper_risk_score=tamper_risk_score,
            decision="REVIEW",
            reason=(
                "No trusted reference MRP was found "
                "for the matched product/package."
            ),
            evidence=tamper_evidence,
        )

        db.add(finding)
        db.commit()
        db.refresh(finding)

        return finding

    # Use the most recently created reference.
    reference = sorted(
        candidates,
        key=lambda item: item.created_at,
        reverse=True,
    )[0]

    reference_value = float(reference.reference_mrp)
    declared_value = float(declared_mrp)

    difference = round(
        declared_value - reference_value,
        2,
    )

    if abs(difference) < 0.001:
        price_status = "MATCH"
        decision = "CLEAR"
        reason = (
            "Declared MRP matches the trusted reference MRP "
            "for the matched product/package."
        )
    else:
        price_status = "MISMATCH"
        decision = "REVIEW"
        reason = (
            f"Declared MRP ₹{declared_value:.2f} differs from "
            f"reference MRP ₹{reference_value:.2f}."
        )

    evidence = dict(tamper_evidence or {})

    evidence["reference"] = {
        "reference_id": reference.id,
        "source_type": reference.source_type,
        "source_reference": reference.source_reference,
        "version": reference.version,
        "pack_quantity": (
            float(reference.pack_quantity)
            if reference.pack_quantity is not None
            else None
        ),
        "pack_unit": reference.pack_unit,
        "variant": reference.variant,
        "effective_from": (
            reference.effective_from.isoformat()
            if reference.effective_from
            else None
        ),
        "effective_to": (
            reference.effective_to.isoformat()
            if reference.effective_to
            else None
        ),
    }

    finding = MRPFinding(
        inspection_id=inspection_id,
        image_id=image_id,
        declared_mrp=Decimal(str(declared_value)),
        reference_mrp=Decimal(str(reference_value)),
        price_status=price_status,
        difference_amount=Decimal(str(difference)),
        reference_source=(
            reference.source_reference
            or reference.source_type
        ),
        tamper_status=tamper_status,
        tamper_risk_score=tamper_risk_score,
        decision=decision,
        reason=reason,
        evidence=evidence,
    )

    db.add(finding)
    db.commit()
    db.refresh(finding)

    return finding
