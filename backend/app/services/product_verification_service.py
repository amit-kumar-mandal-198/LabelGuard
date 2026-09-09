from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""

    text = str(value).upper()

    replacements = {
        "&": " AND ",
        "PVT.": "PRIVATE",
        "PVT": "PRIVATE",
        "LTD.": "LIMITED",
        "LTD": "LIMITED",
    }

    for source, target in replacements.items():
        text = text.replace(
            source,
            target,
        )

    text = re.sub(
        r"[^A-Z0-9]+",
        " ",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def _similarity(
    left: str,
    right: str,
) -> float:
    if not left or not right:
        return 0.0

    return round(
        SequenceMatcher(
            None,
            left,
            right,
        ).ratio()
        * 100.0,
        2,
    )


def verify_manufacturer_identity(
    ocr_manufacturer: str | None,
    barcode_manufacturer: str | None,
) -> dict[str, Any]:

    ocr_normalized = _normalize_text(
        ocr_manufacturer
    )

    barcode_normalized = _normalize_text(
        barcode_manufacturer
    )

    if not ocr_normalized:
        return {
            "status": "NOT_VERIFIED",
            "reason": "OCR manufacturer not available",
            "ocr_value": ocr_manufacturer,
            "reference_value": barcode_manufacturer,
            "similarity": None,
        }

    if not barcode_normalized:
        return {
            "status": "NOT_VERIFIED",
            "reason": "Barcode product master manufacturer not available",
            "ocr_value": ocr_manufacturer,
            "reference_value": barcode_manufacturer,
            "similarity": None,
        }

    similarity = _similarity(
        ocr_normalized,
        barcode_normalized,
    )

    if ocr_normalized == barcode_normalized:
        status = "MATCH"
    elif similarity >= 90.0:
        status = "MATCH"
    elif similarity >= 70.0:
        status = "PARTIAL_MATCH"
    else:
        status = "CONFLICT"

    return {
        "status": status,
        "reason": (
            "Manufacturer identity corroborated"
            if status == "MATCH"
            else "Manufacturer identity requires review"
            if status == "PARTIAL_MATCH"
            else "Manufacturer identity conflicts"
            if status == "CONFLICT"
            else "Manufacturer identity not verified"
        ),
        "ocr_value": ocr_manufacturer,
        "reference_value": barcode_manufacturer,
        "ocr_normalized": ocr_normalized,
        "reference_normalized": barcode_normalized,
        "similarity": similarity,
    }


def verify_manufacturer_address(
    ocr_address: str | None,
    reference_address: str | None,
) -> dict[str, Any]:

    if not ocr_address:
        return {
            "status": "NOT_VERIFIED",
            "reason": "Manufacturer address not printed or not extracted",
            "ocr_value": None,
            "reference_value": reference_address,
            "similarity": None,
        }

    if not reference_address:
        return {
            "status": "NOT_VERIFIED",
            "reason": "No trusted reference address available",
            "ocr_value": ocr_address,
            "reference_value": None,
            "similarity": None,
        }

    ocr_normalized = _normalize_text(
        ocr_address
    )

    reference_normalized = _normalize_text(
        reference_address
    )

    similarity = _similarity(
        ocr_normalized,
        reference_normalized,
    )

    if ocr_normalized == reference_normalized:
        status = "MATCH"
    elif similarity >= 85.0:
        status = "MATCH"
    elif similarity >= 65.0:
        status = "PARTIAL_MATCH"
    else:
        status = "CONFLICT"

    return {
        "status": status,
        "reason": (
            "Manufacturer address corroborated"
            if status == "MATCH"
            else "Manufacturer address requires review"
            if status == "PARTIAL_MATCH"
            else "Manufacturer address conflicts"
            if status == "CONFLICT"
            else "Manufacturer address not verified"
        ),
        "ocr_value": ocr_address,
        "reference_value": reference_address,
        "ocr_normalized": ocr_normalized,
        "reference_normalized": reference_normalized,
        "similarity": similarity,
    }


def cross_validate_product_identity(
    ocr_manufacturer: str | None,
    ocr_address: str | None,
    barcode_product: dict[str, Any] | None,
) -> dict[str, Any]:

    if barcode_product is None:
        return {
            "overall_status": "NOT_VERIFIED",
            "reason": "Barcode is decoded but no product-master mapping exists",
            "manufacturer": verify_manufacturer_identity(
                ocr_manufacturer,
                None,
            ),
            "manufacturer_address": verify_manufacturer_address(
                ocr_address,
                None,
            ),
        }

    source_type = (
        str(
            barcode_product.get(
                "source_type",
                "",
            )
        ).upper()
    )

    # Internal/demo mappings are useful for development and product
    # association, but they must never be presented as independently
    # trusted verification evidence.
    trusted_sources = {
        "OFFICIAL",
        "OFFICIAL_WEBSITE",
        "AUTHORIZED_SOURCE",
        "AUTHORIZED_RECORD",
        "GS1",
        "GOVERNMENT",
        "REGULATORY",
    }

    is_trusted_reference = (
        source_type in trusted_sources
    )

    manufacturer_result = verify_manufacturer_identity(
        ocr_manufacturer,
        barcode_product.get(
            "manufacturer_name"
        ),
    )

    address_result = verify_manufacturer_address(
        ocr_address,
        barcode_product.get(
            "manufacturer_address"
        ),
    )

    if not is_trusted_reference:
        return {
            "overall_status": "NOT_VERIFIED",
            "reason": (
                "Barcode mapping exists, but its source "
                f"'{source_type or 'UNKNOWN'}' is not a trusted "
                "verification source"
            ),
            "barcode_value": barcode_product.get(
                "barcode_value"
            ),
            "barcode_source_type": source_type or None,
            "barcode_source_reference": barcode_product.get(
                "source_reference"
            ),
            "product_id": barcode_product.get(
                "product_id"
            ),
            "product_name": barcode_product.get(
                "product_name"
            ),
            "manufacturer": manufacturer_result,
            "manufacturer_address": address_result,
        }

    if manufacturer_result["status"] == "CONFLICT":
        overall_status = "CONFLICT"
    elif manufacturer_result["status"] == "PARTIAL_MATCH":
        overall_status = "REVIEW"
    elif manufacturer_result["status"] == "MATCH":
        overall_status = "CORROBORATED"
    else:
        overall_status = "NOT_VERIFIED"

    return {
        "overall_status": overall_status,
        "barcode_value": barcode_product.get(
            "barcode_value"
        ),
        "barcode_source_type": source_type,
        "barcode_source_reference": barcode_product.get(
            "source_reference"
        ),
        "product_id": barcode_product.get(
            "product_id"
        ),
        "product_name": barcode_product.get(
            "product_name"
        ),
        "manufacturer": manufacturer_result,
        "manufacturer_address": address_result,
    }
