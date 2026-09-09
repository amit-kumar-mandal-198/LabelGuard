from __future__ import annotations

import re
from typing import Any

from app.ai.extraction.entity_normalizer import normalize_company_name


FIELD_PATTERNS = {
    "mrp": [
        r"\b(?:mrp|m\.r\.p\.?)\s*(?:rs\.?|₹)?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"(?:rs\.?|₹)\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
    "net_quantity": [
        r"\b(?:net\s*(?:qty|quantity)|quantity)\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:g|kg|ml|l|mg|cm|mm|m|nos?|pcs?))",
    ],
    "date": [
        r"\b(?:date|packed|packing|mfg|manufactured|manufacturing)\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})",
        r"\b([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})\b",
    ],
    "batch_number": [
        r"\b(?:batch|batch\s*no\.?|lot|lot\s*no\.?)\s*[:\-]?\s*([A-Z0-9][A-Z0-9./_-]{2,})",
    ],
}


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def _find_pattern(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _clean_text(match.group(1))
    return None


def _find_line_value(
    text: str,
    labels: tuple[str, ...],
) -> str | None:
    for line in text.splitlines():
        cleaned = _clean_text(line)
        lower = cleaned.lower()

        for label in labels:
            if label in lower:
                parts = re.split(
                    rf"{re.escape(label)}\s*[:\-]?",
                    cleaned,
                    maxsplit=1,
                    flags=re.IGNORECASE,
                )

                if len(parts) == 2:
                    value = _clean_text(parts[1])
                    if value:
                        return value

    return None


def _build_field(
    name: str,
    value: str | None,
) -> dict[str, Any]:
    return {
        "field_name": name,
        "value": value,
        "is_present": bool(value),
        "confidence": None,
        "evidence": [],
    }




def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Detect a likely company/manufacturer line even when
    OCR misses the declaration label.
    """

    lines = [
        _clean_text(line)
        for line in text.splitlines()
        if _clean_text(line)
    ]

    candidates = []

    for line in lines:
        lower = line.lower()

        company_signal = any(
            term in lower
            for term in (
                "private limited",
                "pvt ltd",
                "limited",
                "manufacturing",
                "manufacturer",
            )
        )

        food_signal = any(
            term in lower
            for term in (
                "snacks",
                "food",
                "foods",
                "industries",
            )
        )

        if company_signal and food_signal:
            candidates.append(line)

    if not candidates:
        return None

    candidates.sort(
        key=lambda value: (
            len(value) > 140,
            len(value),
        )
    )

    return candidates[0]

def extract_declarations(
    ocr_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Extract candidate packaged-commodity declarations from OCR.

    This is an extraction layer only.
    Final compliance decisions belong to the deterministic rule engine.
    """

    raw_text = str(ocr_result.get("text", ""))
    text = _clean_text(raw_text)
    words = ocr_result.get("words", [])

    result = {
        "product_name": _build_field("product_name", None),
        "manufacturer": _build_field("manufacturer", None),
        "packer": _build_field("packer", None),
        "importer": _build_field("importer", None),
        "address": _build_field("address", None),
        "net_quantity": _build_field(
            "net_quantity",
            _find_pattern(text, FIELD_PATTERNS["net_quantity"]),
        ),
        "mrp": _build_field(
            "mrp",
            _find_pattern(text, FIELD_PATTERNS["mrp"]),
        ),
        "date": _build_field(
            "date",
            _find_pattern(text, FIELD_PATTERNS["date"]),
        ),
        "batch_number": _build_field(
            "batch_number",
            _find_pattern(text, FIELD_PATTERNS["batch_number"]),
        ),
        "consumer_care": _build_field(
            "consumer_care",
            _find_line_value(
                raw_text,
                (
                    "customer care",
                    "consumer care",
                    "customer service",
                    "consumer service",
                ),
            ),
        ),
        "country_of_origin": _build_field(
            "country_of_origin",
            _find_line_value(
                raw_text,
                (
                    "country of origin",
                    "made in",
                    "product of",
                ),
            ),
        ),
    }

    manufacturer = _find_line_value(
        raw_text,
        (
            "manufactured by",
            "manufactured",
            "manufacturer",
        ),
    )

    # OCR may miss the declaration label completely.
    # Fall back to company-name context.
    if not manufacturer:
        manufacturer = _detect_manufacturer_candidate(
            raw_text
        )

    if manufacturer:
        normalized_manufacturer = normalize_company_name(
            manufacturer,
            raw_text,
        )

        result["manufacturer"] = _build_field(
            "manufacturer",
            normalized_manufacturer["normalized_value"],
            normalized_manufacturer["confidence"],
        )

        result["manufacturer"]["raw_value"] = (
            normalized_manufacturer["raw_value"]
        )

        result["manufacturer"]["normalization_evidence"] = (
            normalized_manufacturer["evidence"]
        )

    packer = _find_line_value(
        raw_text,
        (
            "packed by",
            "packer",
        ),
    )
    if packer:
        result["packer"] = _build_field(
            "packer",
            packer,
        )

    importer = _find_line_value(
        raw_text,
        (
            "imported by",
            "importer",
        ),
    )
    if importer:
        result["importer"] = _build_field(
            "importer",
            importer,
        )

    address = _find_line_value(
        raw_text,
        (
            "address",
            "noida",
            "gurugram",
            "delhi",
        ),
    )
    if address:
        result["address"] = _build_field(
            "address",
            address,
        )

    for field in result.values():
        value = field["value"]

        if not value:
            continue

        value_tokens = {
            token.lower()
            for token in re.findall(
                r"[A-Za-z0-9₹./_-]+",
                value,
            )
        }

        evidence = []

        for word in words:
            token = str(word.get("text", "")).strip().lower()

            if token in value_tokens:
                evidence.append(
                    {
                        "text": word.get("text"),
                        "confidence": word.get("confidence"),
                        "bbox": word.get("bbox"),
                    }
                )

        field["evidence"] = evidence

        confidences = [
            float(item["confidence"])
            for item in evidence
            if item.get("confidence") is not None
        ]

        if confidences:
            field["confidence"] = round(
                sum(confidences) / len(confidences),
                2,
            )

    return {
        "fields": result,
        "source": "ocr",
        "extractor_version": "0.1.0",
    }



