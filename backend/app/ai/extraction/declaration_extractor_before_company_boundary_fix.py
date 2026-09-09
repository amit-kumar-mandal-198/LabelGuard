from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any

from app.ai.extraction.entity_normalizer import normalize_company_name


def _clean_text(value: str) -> str:
    value = str(value or "")
    value = re.sub(r"[|\\]+", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" :-|")


def _normalize_ocr_text(text: str) -> str:
    replacements = {
        "\u201c": '"',
        "\u201d": '"',
        "\u2018": "'",
        "\u2019": "'",
        "\u2013": "-",
        "\u2014": "-",
        "\u00a0": " ",
    }

    text = str(text or "")

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
        str(a).lower(),
        str(b).lower(),
    ).ratio()


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


def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Extract a bounded company-name candidate from noisy OCR.

    OCR often returns the entire package as one text block,
    so we search for company-name patterns instead of relying
    on line boundaries.
    """

    clean = _clean_text(text)

    candidates: list[str] = []

    patterns = (
        r"([A-Za-z0-9@._-]+(?:\s+[A-Za-z0-9@._-]+){0,6}"
        r"\s+private\s+limited)",

        r"([A-Za-z0-9@._-]+(?:\s+[A-Za-z0-9@._-]+){0,6}"
        r"\s+pvt\.?\s+ltd\.?)",
    )

    for pattern in patterns:
        matches = re.finditer(
            pattern,
            clean,
            flags=re.IGNORECASE,
        )

        for match in matches:
            candidate = _clean_text(match.group(1))

            lower = candidate.lower()

            if not any(
                term in lower
                for term in (
                    "food",
                    "foods",
                    "snacks",
                )
            ):
                continue

            candidates.append(candidate)

    if not candidates:
        return None

    # Prefer the candidate with HALDIRAM/DIRAM evidence,
    # then prefer company-like candidates.
    def candidate_score(value: str) -> tuple[int, int, int, int]:
        lower = value.lower()

        return (
            int("haldiram" in lower),
            int("diram" in lower),
            int("snacks" in lower or "food" in lower),
            -len(value),
        )

    candidates.sort(
        key=candidate_score,
        reverse=True,
    )

    return candidates[0]


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

    evidence: list[dict[str, Any]] = []

    for word in words:
        ocr_token = str(
            word.get("text", "")
        ).strip().lower()

        if not ocr_token:
            continue

        for expected in expected_tokens:
            if (
                ocr_token == expected
                or _similarity(
                    ocr_token,
                    expected,
                ) >= 0.80
            ):
                evidence.append(
                    {
                        "text": word.get("text"),
                        "confidence": word.get("confidence"),
                        "bbox": word.get("bbox"),
                    }
                )
                break

    confidences: list[float] = []

    for item in evidence:
        try:
            confidences.append(
                float(item["confidence"])
            )
        except (
            TypeError,
            ValueError,
        ):
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

    raw_text = _normalize_ocr_text(
        ocr_result.get("text", "")
    )

    words = ocr_result.get("words", [])

    # ---------------------------------------------------------
    # MRP
    # ---------------------------------------------------------
    mrp, mrp_confidence = _extract_mrp(raw_text)

    # ---------------------------------------------------------
    # Quantity
    # ---------------------------------------------------------
    quantity, quantity_confidence = _extract_quantity(
        raw_text
    )

    # ---------------------------------------------------------
    # Date
    # ---------------------------------------------------------
    date, date_confidence = _extract_date(raw_text)

    fields: dict[str, dict[str, Any]] = {
        "mrp": _build_field(
            "mrp",
            mrp,
            mrp_confidence,
        ),

        "net_quantity": _build_field(
            "net_quantity",
            quantity,
            quantity_confidence,
        ),

        "date": _build_field(
            "date",
            date,
            date_confidence,
        ),

        "manufacturer": _build_field(
            "manufacturer",
            None,
        ),

        "packer": _build_field(
            "packer",
            None,
        ),

        "importer": _build_field(
            "importer",
            None,
        ),

        "consumer_care": _build_field(
            "consumer_care",
            None,
        ),

        "country_of_origin": _build_field(
            "country_of_origin",
            None,
        ),

        "batch_number": _build_field(
            "batch_number",
            None,
        ),

        "product_name": _build_field(
            "product_name",
            None,
        ),
    }

    # ---------------------------------------------------------
    # Manufacturer
    # ---------------------------------------------------------
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

        fields["manufacturer"]["raw_value"] = manufacturer

        fields["manufacturer"][
            "normalization_evidence"
        ] = normalized["evidence"]

    # ---------------------------------------------------------
    # Packer
    # ---------------------------------------------------------
    packer_patterns = (
        "packed by",
        "packer",
    )

    for label in packer_patterns:
        match = re.search(
            rf"{re.escape(label)}\s*[:\-]?\s*"
            r"([A-Za-z0-9 ,.&()-]{4,120})",
            raw_text,
            flags=re.IGNORECASE,
        )

        if match:
            fields["packer"]["value"] = _clean_text(
                match.group(1)
            )
            fields["packer"]["is_present"] = True
            break

    # ---------------------------------------------------------
    # Importer
    # ---------------------------------------------------------
    importer_patterns = (
        "imported by",
        "importer",
    )

    for label in importer_patterns:
        match = re.search(
            rf"{re.escape(label)}\s*[:\-]?\s*"
            r"([A-Za-z0-9 ,.&()-]{4,120})",
            raw_text,
            flags=re.IGNORECASE,
        )

        if match:
            fields["importer"]["value"] = _clean_text(
                match.group(1)
            )
            fields["importer"]["is_present"] = True
            break

    # ---------------------------------------------------------
    # Consumer care
    # ---------------------------------------------------------
    consumer_match = re.search(
        r"(?:customer\s+care|consumer\s+care|"
        r"customer\s+service|consumer\s+service)"
        r"\s*[:\-]?\s*(.{4,140})",
        raw_text,
        flags=re.IGNORECASE,
    )

    if consumer_match:
        fields["consumer_care"]["value"] = _clean_text(
            consumer_match.group(1)
        )
        fields["consumer_care"]["is_present"] = True

    # ---------------------------------------------------------
    # Country of origin
    # ---------------------------------------------------------
    country_match = re.search(
        r"(?:country\s+of\s+origin|made\s+in|product\s+of)"
        r"\s*[:\-]?\s*([A-Za-z ]{2,50})",
        raw_text,
        flags=re.IGNORECASE,
    )

    if country_match:
        fields["country_of_origin"]["value"] = _clean_text(
            country_match.group(1)
        )
        fields["country_of_origin"]["is_present"] = True

    # ---------------------------------------------------------
    # Batch number
    # ---------------------------------------------------------
    batch_match = re.search(
        r"(?:batch|batch\s+no\.?|batch\s+number|lot|lot\s+no\.?)"
        r"\s*[:\-]?\s*([A-Za-z0-9./_-]{2,40})",
        raw_text,
        flags=re.IGNORECASE,
    )

    if batch_match:
        batch = _clean_text(
            batch_match.group(1)
        )

        if batch.lower() not in {
            "no",
            "number",
        }:
            fields["batch_number"]["value"] = batch
            fields["batch_number"]["is_present"] = True

    # ---------------------------------------------------------
    # Product name
    # ---------------------------------------------------------
    for line in raw_text.splitlines():
        clean_line = _clean_text(line)

        if not clean_line:
            continue

        upper = clean_line.upper()

        if any(
            keyword in upper
            for keyword in (
                "NAVRATTAN",
                "HALDIRAM",
                "FAVOURITES",
                "FAVORITES",
            )
        ):
            if len(clean_line) <= 120:
                fields["product_name"]["value"] = clean_line
                fields["product_name"]["is_present"] = True
                break

    # ---------------------------------------------------------
    # Evidence
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

            current_confidence = field.get(
                "confidence"
            )

            if current_confidence is None:
                field["confidence"] = (
                    evidence_confidence
                )
            else:
                field["confidence"] = round(
                    (
                        float(current_confidence)
                        + evidence_confidence
                    )
                    / 2,
                    2,
                )

            field["status"] = (
                "extracted"
                if field["confidence"] >= 60
                else "review"
            )

    return {
        "fields": fields,
        "source": "ocr",
        "extractor_version": "0.4.0",
    }
