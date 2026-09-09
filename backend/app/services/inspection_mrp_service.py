from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Inspection,
    InspectionImage,
    MRPFinding,
    ProductMRPReference,
)
from app.services.mrp_image_detector import extract_mrp_from_image
from app.services.mrp_tamper_detector import analyze_mrp_tampering


def _db_safe(value: Any) -> Any:
    """
    PostgreSQL development server uses WIN1252.
    Convert unsupported Unicode characters before JSONB persistence.
    """
    if isinstance(value, dict):
        return {
            key: _db_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [_db_safe(item) for item in value]

    if isinstance(value, tuple):
        return tuple(_db_safe(item) for item in value)

    if isinstance(value, str):
        return (
            value
            .replace("₹", "INR ")
            .encode("cp1252", errors="replace")
            .decode("cp1252")
        )

    return value



def _find_reference(
    db: Session,
    product_id: int,
    pack_quantity: float | None,
    pack_unit: str | None,
    variant: str | None,
) -> ProductMRPReference | None:

    references = list(
        db.scalars(
            select(ProductMRPReference).where(
                ProductMRPReference.product_id == product_id
            )
        ).all()
    )

    if not references:
        return None

    candidates = references

    if pack_quantity is not None and pack_unit:
        normalized_unit = pack_unit.strip().lower()

        exact_pack = [
            ref
            for ref in references
            if ref.pack_quantity is not None
            and float(ref.pack_quantity) == float(pack_quantity)
            and (ref.pack_unit or "").strip().lower()
            == normalized_unit
        ]

        if exact_pack:
            candidates = exact_pack
        else:
            # Do not compare against a different pack size.
            return None

    if variant:
        normalized_variant = variant.strip().lower()

        exact_variant = [
            ref
            for ref in candidates
            if (ref.variant or "").strip().lower()
            == normalized_variant
        ]

        if exact_variant:
            candidates = exact_variant

    return sorted(
        candidates,
        key=lambda ref: ref.created_at,
        reverse=True,
    )[0]


def _upsert_finding(
    db: Session,
    inspection: Inspection,
    image: InspectionImage | None,
    declared_mrp: float | None,
    reference: ProductMRPReference | None,
    tamper: dict[str, Any],
    mrp_detection: dict[str, Any] | None,
) -> MRPFinding:

    finding = db.scalar(
        select(MRPFinding)
        .where(
            MRPFinding.inspection_id == inspection.id
        )
        .order_by(MRPFinding.id.asc())
        .limit(1)
    )

    if declared_mrp is None:
        price_status = "NO_DECLARED_MRP"
        difference = None
        reference_value = (
            float(reference.reference_mrp)
            if reference is not None
            else None
        )
        decision = "REVIEW"

        reason = (
            "MRP could not be reliably extracted "
            "from the inspection images."
        )

    elif reference is None:
        price_status = "NO_REFERENCE"
        reference_value = None
        difference = None
        decision = "REVIEW"

        reason = (
            "Declared MRP was detected, but no exact trusted "
            "reference MRP was found for the matched product/package."
        )

    else:
        declared_value = float(declared_mrp)
        reference_value = float(reference.reference_mrp)

        difference = round(
            declared_value - reference_value,
            2,
        )

        if abs(difference) < 0.001:
            price_status = "MATCH"
            decision = (
                "REVIEW"
                if tamper["status"] in {
                    "SUSPECTED",
                    "HIGH_RISK",
                }
                else "CLEAR"
            )

            if decision == "CLEAR":
                reason = (
                    "Declared MRP matches the trusted reference "
                    "MRP for the matched product/package."
                )
            else:
                reason = (
                    "Declared MRP matches the trusted reference, "
                    "but visual tamper signals require review."
                )

        else:
            price_status = "MISMATCH"
            decision = "REVIEW"

            reason = (
                f"Declared MRP INR {declared_value:.2f} differs from "
                f"reference MRP INR {reference_value:.2f}."
            )

    evidence = {
        "mrp_detection": mrp_detection,
        "reference": (
            {
                "reference_id": reference.id,
                "reference_mrp": float(reference.reference_mrp),
                "currency": reference.currency,
                "source_type": reference.source_type,
                "source_reference": reference.source_reference,
                "pack_quantity": (
                    float(reference.pack_quantity)
                    if reference.pack_quantity is not None
                    else None
                ),
                "pack_unit": reference.pack_unit,
                "variant": reference.variant,
                "version": reference.version,
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
            if reference is not None
            else None
        ),
        "tamper_analysis": tamper,
    }

    if finding is None:
        finding = MRPFinding(
            inspection_id=inspection.id,
        )

        db.add(finding)

    finding.image_id = (
        image.id
        if image is not None
        else None
    )

    finding.declared_mrp = (
        declared_mrp
        if declared_mrp is not None
        else None
    )

    finding.reference_mrp = (
        float(reference.reference_mrp)
        if reference is not None
        else None
    )

    finding.price_status = price_status
    finding.difference_amount = difference

    finding.reference_source = (
        reference.source_reference
        if reference is not None
        else None
    )

    finding.tamper_status = tamper["status"]
    finding.tamper_risk_score = float(
        tamper["risk_score"]
    )

    finding.decision = decision
    finding.reason = _db_safe(reason)
    finding.evidence = _db_safe(evidence)

    db.commit()

    return finding


def process_inspection_mrp(
    db: Session,
    inspection_id: int,
    pack_quantity: float | None = None,
    pack_unit: str | None = None,
    variant: str | None = None,
) -> MRPFinding:

    inspection = db.get(
        Inspection,
        inspection_id,
    )

    if inspection is None:
        raise LookupError(
            "Inspection not found."
        )

    if inspection.product_id is None:
        raise LookupError(
            "Inspection is not linked to a product."
        )

    images = list(
        db.scalars(
            select(InspectionImage)
            .where(
                InspectionImage.inspection_id
                == inspection_id
            )
            .order_by(InspectionImage.id.asc())
        ).all()
    )

    best_image = None
    best_detection = None

    for image in images:
        if not Path(image.file_path).exists():
            continue

        detection = extract_mrp_from_image(
            image.file_path
        )

        if detection is None:
            continue

        if (
            best_detection is None
            or detection["score"]
            > best_detection["score"]
        ):
            best_detection = detection
            best_image = image

    declared_mrp = (
        float(best_detection["normalized_value"])
        if best_detection is not None
        else None
    )

    reference = _find_reference(
        db=db,
        product_id=inspection.product_id,
        pack_quantity=pack_quantity,
        pack_unit=pack_unit,
        variant=variant,
    )

    tamper = {
        "status": "NOT_SUSPECTED",
        "risk_score": 0.0,
        "signals": [],
    }

    if best_image is not None and best_detection is not None:

        image = cv2.imread(
            best_image.file_path
        )

        if image is not None:
            roi_data = best_detection["roi"]

            roi = (
                roi_data["x"],
                roi_data["y"],
                roi_data["width"],
                roi_data["height"],
            )

            tamper = analyze_mrp_tampering(
                image=image,
                mrp_roi=roi,
                declared_mrp=declared_mrp,
                reference_mrp=(
                    float(reference.reference_mrp)
                    if reference is not None
                    else None
                ),
            )

    return _upsert_finding(
        db=db,
        inspection=inspection,
        image=best_image,
        declared_mrp=declared_mrp,
        reference=reference,
        tamper=tamper,
        mrp_detection=best_detection,
    )

