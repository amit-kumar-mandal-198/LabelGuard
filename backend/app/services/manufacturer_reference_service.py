from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.manufacturer_reference_repository import (
    create_manufacturer_reference,
    get_manufacturer_reference,
    get_manufacturer_reference_for_product,
)
from app.services.product_verification_service import (
    cross_validate_product_identity,
)


def add_manufacturer_reference(
    db: Session,
    manufacturer_name: str,
    manufacturer_address: str,
    source_type: str,
    source_reference: str | None = None,
    product_id: int | None = None,
):
    return create_manufacturer_reference(
        db=db,
        data={
            "product_id": product_id,
            "manufacturer_name": manufacturer_name,
            "manufacturer_address": manufacturer_address,
            "source_type": source_type,
            "source_reference": source_reference,
            "verified_at": datetime.now(
                timezone.utc
            ),
        },
    )


def get_reference_for_product(
    db: Session,
    product_id: int,
):
    return get_manufacturer_reference_for_product(
        db=db,
        product_id=product_id,
    )


def get_reference_for_manufacturer(
    db: Session,
    manufacturer_name: str,
):
    return get_manufacturer_reference(
        db=db,
        manufacturer_name=manufacturer_name,
    )


def verify_against_reference(
    db: Session,
    ocr_manufacturer: str | None,
    ocr_address: str | None,
    product_id: int | None = None,
    manufacturer_name: str | None = None,
) -> dict[str, Any]:

    reference = None

    if product_id is not None:
        reference = get_manufacturer_reference_for_product(
            db=db,
            product_id=product_id,
        )

    if (
        reference is None
        and manufacturer_name
    ):
        reference = get_manufacturer_reference(
            db=db,
            manufacturer_name=manufacturer_name,
        )

    if reference is None:
        return {
            "status": "NOT_VERIFIED",
            "reason": "No trusted manufacturer reference available",
            "reference": None,
            "verification": {
                "overall_status": "NOT_VERIFIED",
                "manufacturer": {
                    "status": "NOT_VERIFIED",
                },
                "manufacturer_address": {
                    "status": "NOT_VERIFIED",
                },
            },
        }

    barcode_product = {
        "product_id": reference.product_id,
        "manufacturer_name": reference.manufacturer_name,
        "manufacturer_address": reference.manufacturer_address,
    }

    verification = cross_validate_product_identity(
        ocr_manufacturer=ocr_manufacturer,
        ocr_address=ocr_address,
        barcode_product=barcode_product,
    )

    return {
        "status": verification[
            "overall_status"
        ],
        "reference": {
            "id": reference.id,
            "manufacturer_name": reference.manufacturer_name,
            "manufacturer_address": reference.manufacturer_address,
            "source_type": reference.source_type,
            "source_reference": reference.source_reference,
            "verified_at": reference.verified_at,
        },
        "verification": verification,
    }
