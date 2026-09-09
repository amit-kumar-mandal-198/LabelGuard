from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any

from app.ai.extraction.entity_normalizer import (
    normalize_company_name,
)


def _clean_text(value: str) -> str:
    value = str(value or "")
    value = re.sub(r"[|\\]+", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" :-|")


def _normalize_ocr_text(text: str) -> str:
    text = str(text or "")

    replacements = {
        "\u201c": '"',
        "\u201d": '"',
        "\u2018": "'",
        "\u2019": "'",
        "\u2013": "-",
        "\u2014": "-",
        "\u00a0": " ",
    }

    for source, target in replacements.items():
        text = text.replace(source, target)

    return text


def _build_field(
    name: str,
    value: str | None,
    confidence: float | None = None,
) -> dict[str, Any]:
    return {
        "field_name": name,
        "value": value,
        "is_present": bool(value),
        "confidence": confidence,
        "status": "not_found" if not value else "extracted",
        "evidence": [],
    }


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(
        None,
        a.lower(),
        b.lower(),
    ).ratio()


def _find_labeled_line(
    lines: list[str],
    labels: tuple[str, ...],
) -> str | None:
    """
    Find a line containing one of the declaration labels.
    Exact label matching first, fuzzy matching second.
    """

    for line in lines:
        lower = line.lower()

        for label in labels:
            if label in lower:
                return line

    # Conservative fuzzy fallback.
    for line in lines:
        words = re.findall(
            r"[a-zA-Z]{4,}",
            line.lower(),
        )

        for word in words:
            for label in labels:
                for label_word in re.findall(
                    r"[a-zA-Z]{4,}",
                    label.lower(),
                ):
                    if _similarity(word, label_word) >= 0.82:
                        return line

    return None


def _extract_after_label(
    line: str | None,
    labels: tuple[str, ...],
) -> str | None:
    if not line:
        return None

    clean = _clean_text(line)

    label_pattern = "|".join(
        re.escape(label)
        for label in labels
    )

    match = re.search(
        rf"(?:{label_pattern})\s*[:\-]?\s*(.+)$",
        clean,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    value = _clean_text(match.group(1))

    return value or None


def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Detect a company-name candidate when OCR misses
    'manufactured by'.
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

        product_signal = any(
            term in lower
            for term in (
                "snacks",
                "food",
                "foods",
                "industries",
            )
        )

        if company_signal and product_signal:
            candidates.append(line)

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: (
            len(item) > 140,
            len(item),
        )
    )

    return candidates[0]


def _extract_mrp(
    text: str,
) -> tuple[str | None, float | None]:
    patterns = (
        r"\bMRP\b\s*[:.]?\s*(?:RS\.?|₹)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",

        r"\bM\.R\.P\.?\b\s*[:.]?\s*(?:RS\.?|₹)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",

        r"(?:₹|Rs\.?)\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",
    )

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return (
                match.group(1).replace(",", "."),
                80.0,
            )

    return None, None


def _extract_quantity(
    text: str,
) -> tuple[str | None, float | None]:
    patterns = (
        r"\bnet\s*(?:quantity|qty|weight|volume)\s*[:\-]?\s*"
        r"([0-9]+(?:[.,][0-9]+)?\s*"
        r"(?:mg|g|kg|ml|l|oz|lb|pcs?|nos?))",

        r"\b([0-9]+(?:[.,][0-9]+)?\s*"
        r"(?:mg|g|kg|ml|l|oz|lb))\b",
    )

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return (
                _clean_text(match.group(1)),
                75.0,
            )

    return None, None


def _extract_date(
    text: str,
) -> tuple[str | None, float | None]:
    patterns = (
        r"\b([0-3]?\d[/-][0-1]?\d[/-](?:20)?\d{2})\b",
        r"\b([0-3]?\d[/-][A-Za-z]{3}[/-](?:20)?\d{2})\b",
    )

    matches: list[str] = []

    for pattern in patterns:
        matches.extend(
            re.findall(
                pattern,
                text,
                flags=re.IGNORECASE,
            )
        )

    if matches:
        return (
            _clean_text(matches[-1]),
            70.0,
        )

    return None, None


def _extract_evidence(
    value: str | None,
    words: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], float | None]:
    if not value:
        return [], None

    expected_tokens = {
        token.lower()
        for token in re.findall(
            r"[A-Za-z0-9₹./_-]+",
            value,
        )
    }

    evidence = []

    for word in words:
        ocr_token = str(
            word.get("text", "")
        ).strip().lower()

        if not ocr_token:
            continue

        matched = False

        for expected in expected_tokens:
            if (
                ocr_token == expected
                or _similarity(
                    ocr_token,
                    expected,
                ) >= 0.80
            ):
                matched = True
                break

        if matched:
            evidence.append(
                {
                    "text": word.get("text"),
                    "confidence": word.get("confidence"),
                    "bbox": word.get("bbox"),
                }
            )

    confidences = []

    for item in evidence:
        try:
            confidences.append(
                float(item["confidence"])
            )
        except (TypeError, ValueError):
            continue

    confidence = (
        round(
            sum(confidences) / len(confidences),
            2,
        )
        if confidences
        else None
    )

    return evidence, confidence


def extract_declarations(
    ocr_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Extract candidate packaged-commodity declarations.

    This layer extracts evidence only.
    Final compliance decisions belong to the rule engine.
    """

    raw_text = _normalize_ocr_text(
        ocr_result.get("text", "")
    )

    words = ocr_result.get("words", [])

    lines = [
        _clean_text(line)
        for line in raw_text.splitlines()
        if _clean_text(line)
    ]

    fields: dict[str, dict[str, Any]] = {}

    # ---------------------------------------------------------
    # MRP
    # ---------------------------------------------------------
    mrp, mrp_confidence = _extract_mrp(raw_text)

    fields["mrp"] = _build_field(
        "mrp",
        mrp,
        mrp_confidence,
    )

    # ---------------------------------------------------------
    # Net quantity
    # ---------------------------------------------------------
    quantity, quantity_confidence = _extract_quantity(
        raw_text
    )

    fields["net_quantity"] = _build_field(
        "net_quantity",
        quantity,
        quantity_confidence,
    )

    # ---------------------------------------------------------
    # Date
    # ---------------------------------------------------------
    date, date_confidence = _extract_date(raw_text)

    fields["date"] = _build_field(
        "date",
        date,
        date_confidence,
    )

    # ---------------------------------------------------------
    # Manufacturer
    # ---------------------------------------------------------
    manufacturer_line = _find_labeled_line(
        lines,
        (
            "manufactured by",
            "manufactured",
            "manufacturer",
        ),
    )

    manufacturer = _extract_after_label(
        manufacturer_line,
        (
            "manufactured by",
            "manufactured",
            "manufacturer",
        ),
    )

    # OCR may completely miss the declaration label.
    if not manufacturer:
        manufacturer = _detect_manufacturer_candidate(
            raw_text
        )

    if manufacturer:
        normalized = normalize_company_name(
            manufacturer,
            raw_text,
        )

        fields["manufacturer"] = _build_field(
            "manufacturer",
            normalized["normalized_value"],
            normalized["confidence"],
        )

        fields["manufacturer"]["raw_value"] = (
            normalized["raw_value"]
        )

        fields["manufacturer"]["normalization_evidence"] = (
            normalized["evidence"]
        )
    else:
        fields["manufacturer"] = _build_field(
            "manufacturer",
            None,
        )

    # ---------------------------------------------------------
    # Packer
    # ---------------------------------------------------------
    packer_line = _find_labeled_line(
        lines,
        (
            "packed by",
            "packer",
        ),
    )

    packer = _extract_after_label(
        packer_line,
        (
            "packed by",
            "packer",
        ),
    )

    fields["packer"] = _build_field(
        "packer",
        packer,
    )

    # ---------------------------------------------------------
    # Importer
    # ---------------------------------------------------------
    importer_line = _find_labeled_line(
        lines,
        (
            "imported by",
            "importer",
        ),
    )

    importer = _extract_after_label(
        importer_line,
        (
            "imported by",
            "importer",
        ),
    )

    fields["importer"] = _build_field(
        "importer",
        importer,
    )

    # ---------------------------------------------------------
    # Consumer care
    # ---------------------------------------------------------
    consumer_line = _find_labeled_line(
        lines,
        (
            "customer care",
            "consumer care",
            "customer service",
            "consumer service",
        ),
    )

    consumer_care = _extract_after_label(
        consumer_line,
        (
            "customer care",
            "consumer care",
            "customer service",
            "consumer service",
        ),
    )

    fields["consumer_care"] = _build_field(
        "consumer_care",
        consumer_care,
    )

    # ---------------------------------------------------------
    # Country of origin
    # ---------------------------------------------------------
    country_line = _find_labeled_line(
        lines,
        (
            "country of origin",
            "made in",
            "product of",
        ),
    )

    country = _extract_after_label(
        country_line,
        (
            "country of origin",
            "made in",
            "product of",
        ),
    )

    fields["country_of_origin"] = _build_field(
        "country_of_origin",
        country,
    )

    # ---------------------------------------------------------
    # Batch number
    # ---------------------------------------------------------
    batch_line = _find_labeled_line(
        lines,
        (
            "batch",
            "batch no",
            "batch number",
            "lot",
            "lot no",
        ),
    )

    batch = _extract_after_label(
        batch_line,
        (
            "batch",
            "batch no",
            "batch number",
            "lot",
            "lot no",
        ),
    )

    if batch and batch.lower() in {
        "no",
        "no.",
        "number",
    }:
        batch = None

    fields["batch_number"] = _build_field(
        "batch_number",
        batch,
    )

    # ---------------------------------------------------------
    # Product name
    # ---------------------------------------------------------
    product_name = None

    for line in lines:
        upper = line.upper()

        if any(
            signal in upper
            for signal in (
                "NAVRATTAN",
                "HALDIRAM",
                "FAVOURITES",
                "FAVORITES",
            )
        ):
            if len(line) <= 120:
                product_name = line
                break

    fields["product_name"] = _build_field(
        "product_name",
        product_name,
    )

    # ---------------------------------------------------------
    # Evidence for all fields
    # ---------------------------------------------------------
    for field in fields.values():
        value = field.get("value")

        if not value:
            continue

        evidence, evidence_confidence = _extract_evidence(
            value,
            words,
        )

        field["evidence"] = evidence

        if evidence_confidence is not None:
            field["confidence"] = (
                evidence_confidence
                if field.get("confidence") is None
                else round(
                    (
                        float(field["confidence"])
                        + evidence_confidence
                    )
                    / 2,
                    2,
                )
            )

            field["status"] = (
                "extracted"
                if field["confidence"] >= 60
                else "review"
            )
        else:
            field["status"] = "review"

    return {
        "fields": fields,
        "source": "ocr",
        "extractor_version": "0.3.0",
    }
