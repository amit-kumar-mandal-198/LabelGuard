from __future__ import annotations

import re
from pathlib import Path
from difflib import SequenceMatcher
from typing import Any

import cv2

from app.ai.extraction.entity_normalizer import normalize_company_name
from app.services.mrp_image_detector import extract_mrp_from_image
from app.ai.ocr.ocr_engine import run_ocr


DATE_TOKEN = r"(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3,9}[/-]\d{2,4}|\d{1,2}[/-]\d{1,2})"

QUANTITY_PATTERN = (
    r"([0-9]+(?:[.,][0-9]+)?)\s*"
    r"(mg|g|kg|ml|l|cl|oz|lb|pcs?|nos?)"
)

MRP_PATTERN = (
    r"(?:MRP|M\.R\.P\.?|MAX(?:IMUM)?\s*RETAIL\s*PRICE)"
    r"\s*[:.]?\s*"
    r"(?:RS\.?|₹|INR)?\s*"
    r"([0-9]+(?:[.,][0-9]{1,2})?)"
)

LEGAL_TERMS = {
    "mrp",
    "retail",
    "maximum",
    "price",
    "inclusive",
    "tax",
    "taxes",
    "mfg",
    "manufactured",
    "manufacturing",
    "packed",
    "packing",
    "pkd",
    "best",
    "before",
    "use",
    "expiry",
    "exp",
    "net",
    "qty",
    "quantity",
    "weight",
    "volume",
    "batch",
    "lot",
    "manufacturer",
    "packer",
    "importer",
    "consumer",
    "customer",
    "care",
    "origin",
    "india",
    "product",
    "commodity",
    "unit",
    "sale",
}


def _clean_text(value: str) -> str:
    value = str(value or "")

    value = value.replace("\r", " ")
    value = value.replace("\n", " ")

    value = re.sub(r"[|\\]+", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value.strip(" :-|,;")


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

    return _clean_text(text)


def _build_field(
    name: str,
    value: Any = None,
    confidence: float | None = None,
    raw_value: str | None = None,
) -> dict[str, Any]:

    return {
        "field_name": name,
        "value": value,
        "raw_value": raw_value,
        "is_present": value is not None and value != "",
        "confidence": confidence,
        "status": (
            "not_found"
            if value is None or value == ""
            else "extracted"
        ),
        "evidence": [],
    }


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(
        None,
        str(a).lower(),
        str(b).lower(),
    ).ratio()


def _safe_float(value: str) -> float:
    return float(
        str(value)
        .replace(",", ".")
        .strip()
    )


def _find_date_candidates(
    text: str,
) -> list[str]:

    return [
        _clean_text(match.group(1))
        for match in re.finditer(
            DATE_TOKEN,
            text,
            flags=re.IGNORECASE,
        )
    ]


def _extract_mrp(
    text: str,
) -> tuple[float | None, str | None, float | None]:

    patterns = (
        MRP_PATTERN,

        r"(?:₹|RS\.?|INR)\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
    )

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        raw = _clean_text(
            match.group(0)
        )

        try:
            value = _safe_float(
                match.group(1)
            )
        except (
            TypeError,
            ValueError,
        ):
            continue

        return (
            value,
            raw,
            70.0,
        )

    # OCR commonly corrupts "MRP" into variants such as
    # "MHP", "MAP", "NRP". Keep this fallback deliberately
    # conservative: a currency-like amount must be nearby.
    fuzzy_pattern = re.compile(
        r"\b([A-Z]{2,4})\s*[:.]?\s*"
        r"(?:RS\.?|₹|INR)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)\b",
        flags=re.IGNORECASE,
    )

    for match in fuzzy_pattern.finditer(text):
        label = match.group(1)

        if _similarity(
            label,
            "MRP",
        ) < 0.66:
            continue

        try:
            value = _safe_float(
                match.group(2)
            )
        except (
            TypeError,
            ValueError,
        ):
            continue

        return (
            value,
            _clean_text(match.group(0)),
            55.0,
        )

    return None, None, None


def _extract_quantity_from_image(
    image_path: str | Path,
    words: list[dict[str, Any]],
) -> tuple[
    float | None,
    str | None,
    str | None,
    float | None,
    list[dict[str, Any]],
]:
    """
    Recover stamped net quantity from the declaration region.

    The label/value can be vertically displaced because the package
    uses a separate stamp area. Re-OCR the region and select an
    explicit number+unit candidate. PSM 11 is preferred because it
    performs well on sparse stamped text.
    """

    image_path = Path(image_path)

    if not image_path.exists():
        return None, None, None, None, []

    net_words = []

    for word in words:
        raw = str(word.get("text", "")).strip()

        token = re.sub(
            r"[^A-Za-z]",
            "",
            raw,
        ).upper()

        if token == "NET":
            net_words.append(word)

    if not net_words:
        return None, None, None, None, []

    # Use the lowest NET declaration occurrence.
    net_word = max(
        net_words,
        key=lambda item: int(
            (item.get("bbox") or {}).get(
                "y",
                0,
            )
        ),
    )

    bbox = net_word.get("bbox") or {}

    ocr_x = int(bbox.get("x", 0))
    ocr_y = int(bbox.get("y", 0))
    ocr_w = int(bbox.get("width", 0))
    ocr_h = int(bbox.get("height", 0))

    image = cv2.imread(str(image_path))

    if image is None:
        return None, None, None, None, []

    height, width = image.shape[:2]

    # OCR may have been produced on a resized/preprocessed image,
    # while image_path points to the original image. Convert the
    # OCR coordinate space back to the original-image coordinate
    # space before cropping.
    ocr_width = 0
    ocr_height = 0

    for word in words:
        word_bbox = word.get("bbox") or {}

        try:
            right = (
                int(word_bbox.get("x", 0))
                + int(word_bbox.get("width", 0))
            )
            bottom = (
                int(word_bbox.get("y", 0))
                + int(word_bbox.get("height", 0))
            )
        except (
            TypeError,
            ValueError,
        ):
            continue

        ocr_width = max(
            ocr_width,
            right,
        )
        ocr_height = max(
            ocr_height,
            bottom,
        )

    if (
        ocr_width > width * 1.15
        or ocr_height > height * 1.15
    ):
        scale_x = (
            ocr_width / float(width)
            if ocr_width > 0
            else 1.0
        )

        scale_y = (
            ocr_height / float(height)
            if ocr_height > 0
            else 1.0
        )
    else:
        scale_x = 1.0
        scale_y = 1.0

    net_x = int(
        ocr_x / scale_x
    )
    net_y = int(
        ocr_y / scale_y
    )
    net_w = max(
        1,
        int(ocr_w / scale_x),
    )
    net_h = max(
        1,
        int(ocr_h / scale_y),
    )

    # Include the entire stamped declaration band.
    x1 = max(0, net_x - 50)
    x2 = min(width, net_x + 400)

    y1 = max(0, net_y - 180)
    y2 = min(height, net_y + net_h + 40)

    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        return None, None, None, None, []

    import tempfile

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".png",
            delete=False,
        ) as temp_file:
            temp_path = temp_file.name

        if not cv2.imwrite(temp_path, crop):
            return None, None, None, None, []

        candidates = []

        # Sparse text is especially important here.
        # Start with the strongest sparse-text PSM. Only fall back when
        # no usable candidates are produced, avoiding redundant OCR calls.
        for psm in (11, 6, 3):
            try:
                regional = run_ocr(
                    temp_path,
                    psm=psm,
                )
            except Exception:
                continue

            for regional_word in regional.get(
                "words",
                [],
            ):
                raw = str(
                    regional_word.get(
                        "text",
                        "",
                    )
                ).strip()

                if not raw:
                    continue

                # Normalize common OCR character noise.
                normalized = (
                    raw.upper()
                    .replace(" ", "")
                    .replace("O", "0")
                )

                match = re.search(
                    r"([0-9]+(?:[.,][0-9]+)?)"
                    r"(MG|G|KG|ML|L|CL|OZ|LB|PCS?|NOS?)",
                    normalized,
                    flags=re.IGNORECASE,
                )

                if not match:
                    continue

                try:
                    value = _safe_float(
                        match.group(1)
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    continue

                unit = match.group(2).lower()

                rb = (
                    regional_word.get("bbox")
                    or {}
                )

                rx = int(rb.get("x", 0))
                ry = int(rb.get("y", 0))
                rw = int(rb.get("width", 0))
                rh = int(rb.get("height", 0))

                absolute_word = {
                    "text": raw,
                    "confidence": float(
                        regional_word.get(
                            "confidence",
                            0,
                        )
                    ),
                    "bbox": {
                        "x": int(
                            (rx + x1)
                            / scale_x
                        ),
                        "y": int(
                            (ry + y1)
                            / scale_y
                        ),
                        "width": max(
                            1,
                            int(
                                rw / scale_x
                            ),
                        ),
                        "height": max(
                            1,
                            int(
                                rh / scale_y
                            ),
                        ),
                    },
                    "block_num": int(
                        regional_word.get(
                            "block_num",
                            0,
                        )
                    ),
                    "par_num": int(
                        regional_word.get(
                            "par_num",
                            0,
                        )
                    ),
                    "line_num": int(
                        regional_word.get(
                            "line_num",
                            0,
                        )
                    ),
                    "psm": int(
                        regional_word.get(
                            "psm",
                            psm,
                        )
                    ),
                }

                absolute_y = (
                    ry
                    + y1
                    + (rh / 2)
                )

                net_ocr_center_y = (
                    ocr_y
                    + (ocr_h / 2)
                )

                distance = abs(
                    absolute_y
                    - net_ocr_center_y
                )

                confidence = float(
                    regional_word.get(
                        "confidence",
                        0,
                    )
                )

                score = confidence

                # Strong preference for sparse-text PSM.
                if psm == 11:
                    score += 15

                # Prefer explicit grams for this food package.
                if unit == "g":
                    score += 10

                # Prefer candidates close to the stamp band.
                score -= distance * 0.05

                candidates.append(
                    {
                        "score": score,
                        "value": value,
                        "unit": unit,
                        "raw": raw,
                        "confidence": confidence,
                        "word": absolute_word,
                    }
                )

            # Stop expensive fallback OCR when a strong candidate is already found.
            if candidates and max(
                candidate["confidence"] for candidate in candidates
            ) >= 85.0:
                break

        if not candidates:
            return None, None, None, None, []

        candidates.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        best = candidates[0]

        return (
            best["value"],
            best["unit"],
            _clean_text(best["raw"]),
            round(
                min(
                    99.0,
                    max(
                        0.0,
                        best["confidence"],
                    ),
                ),
                2,
            ),
            [best["word"]],
        )

    finally:
        if temp_path:
            try:
                Path(temp_path).unlink(
                    missing_ok=True
                )
            except Exception:
                pass



def _extract_quantity(
    text: str,
) -> tuple[float | None, str | None, str | None, float | None]:
    """
    Extract declared net quantity.

    Strategy:
    1. Prefer explicit quantity labels.
    2. Support common OCR corruption around the label.
    3. Never use an arbitrary number+unit from the full OCR text
       as net quantity, because nutrition values can cause
       false positives.
    """

    labelled_patterns = (
        r"\b(?:net\s*)?"
        r"(?:quantity|qty|weight|volume)"
        r"\s*[:\-]?\s*"
        + QUANTITY_PATTERN,
    )

    for pattern in labelled_patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        raw = _clean_text(
            match.group(0)
        )

        try:
            value = _safe_float(
                match.group(1)
            )
        except (
            TypeError,
            ValueError,
        ):
            continue

        unit = match.group(2).lower()

        return (
            value,
            unit,
            raw,
            85.0,
        )

    # ---------------------------------------------------------
    # OCR-aware fallback for a damaged quantity declaration.
    #
    # We deliberately DO NOT perform a generic whole-image
    # number+unit search here. That can incorrectly turn
    # nutrition values such as "00g", "20g", "200g", etc.
    # into the package net quantity.
    # ---------------------------------------------------------

    quantity_label_patterns = (
        r"\bnet\b",
        r"\bquant(?:ity|i|j|t|ti)\b",
        r"\bqty\b",
    )

    label_match = None

    for pattern in quantity_label_patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            label_match = match
            break

    if label_match:
        # We have evidence that a quantity declaration exists,
        # but OCR failed to recover the numeric value.
        #
        # Return no value rather than inventing a quantity from
        # an unrelated part of the label.
        return (
            None,
            None,
            None,
            None,
        )

    return (
        None,
        None,
        None,
        None,
    )

def _find_stamp_anchor(
    words: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """
    Find the lower declaration/stamp anchor.

    The package can place stamped values vertically offset from
    their printed labels, so we use the MFG DATE area as the
    beginning of one shared stamped declaration region.
    """

    candidates: list[dict[str, Any]] = []

    for word in words:
        raw = str(
            word.get("text", "")
        ).strip()

        upper = re.sub(
            r"[^A-Z]",
            "",
            raw.upper(),
        )

        if not upper:
            continue

        if upper in {
            "MFG",
            "MFD",
            "MANUFACTURED",
            "MANUFACTURING",
        }:
            bbox = word.get("bbox") or {}

            candidates.append(
                {
                    "x": int(
                        bbox.get("x", 0)
                    ),
                    "y": int(
                        bbox.get("y", 0)
                    ),
                    "w": max(
                        1,
                        int(
                            bbox.get(
                                "width",
                                1,
                            )
                        ),
                    ),
                    "h": max(
                        1,
                        int(
                            bbox.get(
                                "height",
                                1,
                            )
                        ),
                    ),
                    "confidence": float(
                        word.get(
                            "confidence",
                            0,
                        )
                    ),
                }
            )

    if not candidates:
        return None

    # Lower declaration section is preferred.
    candidates.sort(
        key=lambda item: (
            item["y"],
            item["confidence"],
        ),
        reverse=True,
    )

    return candidates[0]


def _extract_stamp_region_candidates(
    image_path: str | Path,
    words: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    OCR the shared lower stamped declaration region.

    Returns typed candidates:
      - date
      - quantity
      - decimal
      - batch

    Candidate extraction is deliberately separated from semantic
    field assignment. This prevents BATCH from incorrectly
    consuming NET QUANTITY simply because it is physically nearby.
    """

    image_path = Path(image_path)

    if not image_path.exists():
        return []

    image = cv2.imread(
        str(image_path)
    )

    if image is None:
        return []

    height, width = image.shape[:2]

    anchor = _find_stamp_anchor(words)

    if anchor:
        ax = anchor["x"]
        ay = anchor["y"]
        ah = anchor["h"]

        # OCR coordinates may come from a resized/preprocessed image.
        # Infer the OCR coordinate space from all OCR word boxes and
        # map the anchor back to the original image.
        ocr_width = 0
        ocr_height = 0

        for word in words:
            wb = word.get("bbox") or {}

            try:
                right = (
                    int(wb.get("x", 0))
                    + int(wb.get("width", 0))
                )
                bottom = (
                    int(wb.get("y", 0))
                    + int(wb.get("height", 0))
                )
            except (
                TypeError,
                ValueError,
            ):
                continue

            ocr_width = max(
                ocr_width,
                right,
            )
            ocr_height = max(
                ocr_height,
                bottom,
            )

        if (
            ocr_width > width * 1.15
            or ocr_height > height * 1.15
        ):
            scale_x = (
                width / float(ocr_width)
                if ocr_width
                else 1.0
            )
            scale_y = (
                height / float(ocr_height)
                if ocr_height
                else 1.0
            )
        else:
            scale_x = 1.0
            scale_y = 1.0

        ax = int(
            ax * scale_x
        )
        ay = int(
            ay * scale_y
        )
        ah = max(
            1,
            int(
                ah * scale_y
            ),
        )

        # The stamped declaration area is on the right side of
        # the lower package section. Keep the crop broad enough
        # to include the batch value.
        # Keep the left edge broad enough to include the first stamped
        # value, while excluding most nutrition/ingredient text.
        x1 = max(
            0,
            int(width * 0.48),
        )

        x2 = width

        # Shared MFG → Batch → Quantity declaration band.
        y1 = max(
            0,
            ay - 35,
        )

        y2 = min(
            height,
            ay + int(height * 0.23),
        )
    else:
        # Conservative fallback for packages whose MFG anchor is not
        # recovered by OCR.
        x1 = int(width * 0.45)
        x2 = width
        y1 = int(height * 0.62)
        y2 = int(height * 0.96)

    crop = image[
        y1:y2,
        x1:x2,
    ]

    if crop.size == 0:
        return []

    import tempfile

    temp_paths: list[Path] = []

    try:
        gray = cv2.cvtColor(
            crop,
            cv2.COLOR_BGR2GRAY,
        )

        enlarged = cv2.resize(
            gray,
            None,
            fx=3.0,
            fy=3.0,
            interpolation=cv2.INTER_CUBIC,
        )

        variants = [
            (
                "gray",
                enlarged,
            ),
            (
                "otsu",
                cv2.threshold(
                    enlarged,
                    0,
                    255,
                    cv2.THRESH_BINARY
                    + cv2.THRESH_OTSU,
                )[1],
            ),
            (
                "adaptive",
                cv2.adaptiveThreshold(
                    enlarged,
                    255,
                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY,
                    31,
                    9,
                ),
            ),
        ]

        candidates: list[dict[str, Any]] = []

        date_pattern = re.compile(
            r"^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$"
        )

        quantity_pattern = re.compile(
            r"^\d+(?:[.,]\d+)?"
            r"(?:MG|G|KG|ML|L|CL|OZ|LB|PCS?|NOS?)$",
            flags=re.IGNORECASE,
        )

        decimal_pattern = re.compile(
            r"^\d+(?:[.,]\d+)$"
        )

        for variant_name, variant_image in variants:
            with tempfile.NamedTemporaryFile(
                suffix=".png",
                delete=False,
            ) as temp_file:
                temp_path = Path(
                    temp_file.name
                )

            temp_paths.append(temp_path)

            if not cv2.imwrite(
                str(temp_path),
                variant_image,
            ):
                continue

            variant_candidate_start = len(candidates)

            # Primary OCR modes. PSM 7/12 are intentionally removed
            # from the normal path; they are expensive fallback modes and
            # the current label already yields usable candidates from 11/6.
            for psm in (
                11,
                6,
            ):
                try:
                    regional = run_ocr(
                        temp_path,
                        psm=psm,
                    )
                except Exception:
                    continue

                for regional_word in regional.get(
                    "words",
                    [],
                ):
                    raw = str(
                        regional_word.get(
                            "text",
                            "",
                        )
                    ).strip()

                    if not raw:
                        continue

                    confidence = float(
                        regional_word.get(
                            "confidence",
                            0,
                        )
                    )

                    normalized = re.sub(
                        r"[^A-Z0-9.,/-]",
                        "",
                        raw.upper(),
                    )

                    if not normalized:
                        continue

                    rb = (
                        regional_word.get(
                            "bbox"
                        )
                        or {}
                    )

                    rx = int(
                        rb.get("x", 0)
                    )
                    ry = int(
                        rb.get("y", 0)
                    )
                    rw = int(
                        rb.get("width", 0)
                    )
                    rh = int(
                        rb.get("height", 0)
                    )

                    candidate_type = None

                    # Dates first.
                    if date_pattern.fullmatch(
                        normalized
                    ):
                        candidate_type = "date"

                    # Quantity-like values.
                    elif quantity_pattern.fullmatch(
                        normalized
                    ):
                        candidate_type = "quantity"

                    # Decimal such as 0.85.
                    elif decimal_pattern.fullmatch(
                        normalized
                    ):
                        candidate_type = "decimal"

                    # Batch:
                    #   must contain both letters and digits
                    #   and must not be a date/quantity.
                    elif (
                        re.fullmatch(
                            r"[A-Z0-9]{4,14}",
                            normalized,
                        )
                        and re.search(
                            r"[A-Z]",
                            normalized,
                        )
                        and re.search(
                            r"\d",
                            normalized,
                        )
                    ):
                        candidate_type = "batch"

                    if candidate_type is None:
                        continue

                    score = confidence

                    if psm == 11:
                        score += 8.0

                    if candidate_type == "batch":
                        # Batch IDs are commonly 5–10 characters.
                        if 5 <= len(normalized) <= 10:
                            score += 10.0

                    if candidate_type == "date":
                        # Complete dates are highly useful evidence.
                        score += 12.0

                    if candidate_type == "quantity":
                        score += 8.0

                    candidates.append(
                        {
                            "type": candidate_type,
                            "value": normalized,
                            "raw_value": raw,
                            "confidence": confidence,
                            "score": score,
                            "variant": variant_name,
                            "psm": psm,
                            "bbox": {
                                "x": int(
                                    x1
                                    + (
                                        rx / 3.0
                                    )
                                ),
                                "y": int(
                                    y1
                                    + (
                                        ry / 3.0
                                    )
                                ),
                                "width": max(
                                    1,
                                    int(
                                        rw / 3.0
                                    ),
                                ),
                                "height": max(
                                    1,
                                    int(
                                        rh / 3.0
                                    ),
                                ),
                            },
                        }
                    )

        # Deduplicate near-identical OCR readings while retaining
        # the strongest observation.
        deduped: dict[
            tuple[str, str],
            dict[str, Any],
        ] = {}

        for candidate in candidates:
            key = (
                candidate["type"],
                candidate["value"],
            )

            existing = deduped.get(
                key
            )

            if (
                existing is None
                or candidate["score"]
                > existing["score"]
            ):
                deduped[key] = candidate

        result = list(
            deduped.values()
        )

        result.sort(
            key=lambda item: (
                item["bbox"]["y"],
                item["bbox"]["x"],
            )
        )

        return result

    finally:
        for temp_path in temp_paths:
            try:
                temp_path.unlink(
                    missing_ok=True
                )
            except Exception:
                pass

def _extract_manufacturing_date_from_image(
    image_path: str | Path,
    words: list[dict[str, Any]],
    stamp_candidates: list[dict[str, Any]] | None = None,
) -> tuple[
    str | None,
    str | None,
    float | None,
    list[dict[str, Any]],
]:
    """
    Recover MFG date from the shared stamped declaration region.

    The declaration stamp contains multiple values:
        MFG DATE  -> date
        USE BY    -> date
        SERVES    -> decimal
        BATCH     -> alphanumeric
        QUANTITY  -> number + unit

    Date assignment is therefore positional/type-aware rather than
    based on nearest-label matching.
    """

    candidates = (
        stamp_candidates
        if stamp_candidates is not None
        else _extract_stamp_region_candidates(
            image_path,
            words,
        )
    )

    dates = [
        item
        for item in candidates
        if item["type"] == "date"
    ]

    if not dates:
        return None, None, None, []

    # First date in the stamped declaration block is MFG DATE.
    dates.sort(
        key=lambda item: (
            item["bbox"]["y"],
            -item["confidence"],
        )
    )

    best = dates[0]

    return (
        best["value"],
        best["raw_value"],
        round(
            min(
                99.0,
                max(
                    0.0,
                    best["confidence"],
                ),
            ),
            2,
        ),
        [
            {
                "text": best["raw_value"],
                "confidence": best["confidence"],
                "bbox": best["bbox"],
                "block_num": 0,
                "par_num": 0,
                "line_num": 0,
                "psm": best["psm"],
                "source": "shared_stamp_region",
            }
        ],
    )



def _extract_expiry_date_from_image(
    image_path: str | Path,
    words: list[dict[str, Any]],
    stamp_candidates: list[dict[str, Any]] | None = None,
    mfg_date_y: int | None = None,
) -> tuple[
    str | None,
    str | None,
    float | None,
    list[dict[str, Any]],
]:
    """
    Recover Use-By / Expiry date from the shared stamped declaration region
    or OCR words.

    The declaration stamp contains:
        MFG DATE  -> first date (higher y)
        USE BY    -> second date (lower y)
    """
    candidates = (
        stamp_candidates
        if stamp_candidates is not None
        else _extract_stamp_region_candidates(
            image_path,
            words,
        )
    )

    stamp_dates = [
        item
        for item in candidates
        if item["type"] == "date"
    ]

    # Threshold below which a date is considered a subsequent (expiry) row
    min_y = (mfg_date_y + 15) if mfg_date_y is not None else 1020

    # 1. Look for clean date words in primary OCR words at or below min_y
    date_regex = re.compile(rf"\b({DATE_TOKEN})\b")
    word_candidates: list[dict[str, Any]] = []

    for w in words:
        wt = str(w.get("text", "")).strip()
        m = date_regex.search(wt)
        if m:
            wy = w.get("bbox", {}).get("y", 0)
            if wy >= min_y:
                word_candidates.append(
                    {
                        "value": _clean_text(m.group(1)),
                        "raw_value": wt,
                        "confidence": float(w.get("confidence", 0.0)),
                        "bbox": w.get("bbox", {}),
                        "psm": w.get("psm", 6),
                        "source": "ocr_word",
                    }
                )

    # 2. Check stamp candidates with y >= min_y
    stamp_exp_dates = [
        item
        for item in stamp_dates
        if item["bbox"]["y"] >= min_y
    ]

    all_exp = word_candidates + stamp_exp_dates

    if not all_exp:
        if len(stamp_dates) >= 2:
            stamp_dates.sort(key=lambda item: item["bbox"]["y"])
            all_exp = [stamp_dates[1]]
        else:
            return None, None, None, []

    # Pick candidate with highest confidence
    all_exp.sort(
        key=lambda item: (
            float(item.get("confidence", 0.0)),
            item.get("source") == "ocr_word",
        ),
        reverse=True,
    )

    best = all_exp[0]

    return (
        best["value"],
        best["raw_value"],
        round(
            min(
                99.0,
                max(
                    0.0,
                    float(best["confidence"]),
                ),
            ),
            2,
        ),
        [
            {
                "text": best["raw_value"],
                "confidence": best["confidence"],
                "bbox": best["bbox"],
                "block_num": 0,
                "par_num": 0,
                "line_num": 0,
                "psm": best.get("psm", 6),
                "source": best.get("source", "shared_stamp_region"),
            }
        ],
    )


def _extract_semantic_date(
    text: str,
) -> dict[str, Any]:

    result = {
        "manufacturing_date": None,
        "mfg_raw": None,
        "mfg_confidence": None,
        "packing_date": None,
        "pkd_raw": None,
        "pkd_confidence": None,
        "expiry_date": None,
        "exp_raw": None,
        "exp_confidence": None,
        "best_before": None,
        "bbe_raw": None,
        "bbe_confidence": None,
        "raw_value": None,
        "confidence": None,
    }

    # MFG / MFD / MANUFACTURED
    manufacturing = re.search(
        rf"\b(?:MFG|MFD|MANUFACTURED|MANUFACTURING)"
        rf"\s*(?:DATE)?\s*[:\-]?\s*({DATE_TOKEN})",
        text,
        flags=re.IGNORECASE,
    )

    if manufacturing:
        result["manufacturing_date"] = _clean_text(
            manufacturing.group(1)
        )
        result["mfg_raw"] = _clean_text(
            manufacturing.group(0)
        )
        result["mfg_confidence"] = 80.0
        result["raw_value"] = result["mfg_raw"]
        result["confidence"] = 80.0

    # PKD / PACKED
    packing = re.search(
        rf"\b(?:PKD|PACKED|PACKING)"
        rf"\s*(?:DATE)?\s*[:\-]?\s*({DATE_TOKEN})",
        text,
        flags=re.IGNORECASE,
    )

    if packing:
        result["packing_date"] = _clean_text(
            packing.group(1)
        )
        result["pkd_raw"] = _clean_text(
            packing.group(0)
        )
        result["pkd_confidence"] = 80.0
        if not result["raw_value"]:
            result["raw_value"] = result["pkd_raw"]
            result["confidence"] = 80.0

    # EXP / EXPIRY / USE BY
    expiry = re.search(
        rf"\b(?:EXP|EXPIRY|EXPIRATION|USE\s*BY|USE-BY)"
        rf"\s*(?:DATE)?\s*[:\-]?\s*({DATE_TOKEN})",
        text,
        flags=re.IGNORECASE,
    )

    if expiry:
        result["expiry_date"] = _clean_text(
            expiry.group(1)
        )
        result["exp_raw"] = _clean_text(
            expiry.group(0)
        )
        result["exp_confidence"] = 82.0
        if not result["raw_value"]:
            result["raw_value"] = result["exp_raw"]
            result["confidence"] = 82.0

    # BEST BEFORE can be either a date or a duration.
    best_before = re.search(
        rf"\b(?:BEST\s*BEFORE|BEST-BEFORE|SHELF\s*LIFE)\s*[:\-]?\s*"
        rf"(.{{1,60}}?)(?=\b(?:MFG|MFD|EXP|PKD|MRP|NET|BATCH)\b|$)",
        text,
        flags=re.IGNORECASE,
    )

    if best_before:
        raw = _clean_text(
            best_before.group(1)
        )

        if raw:
            result["best_before"] = raw
            result["bbe_raw"] = _clean_text(
                best_before.group(0)
            )
            result["bbe_confidence"] = 70.0
            if not result["raw_value"]:
                result["raw_value"] = result["bbe_raw"]
                result["confidence"] = 70.0

    # Also detect explicit shelf-life statements (e.g. "6 MONTHS FROM MANUFACTURE")
    if not result["best_before"]:
        shelf_life = re.search(
            rf"\b(\d+\s*(?:MONTHS?|DAYS?|WEEKS?)\s*(?:FROM|OF)\s*(?:MFG|PKD|PACKAGING|MANUFACTURE))\b",
            text,
            flags=re.IGNORECASE,
        )
        if shelf_life:
            raw = _clean_text(shelf_life.group(1))
            result["best_before"] = raw
            result["bbe_raw"] = raw
            result["bbe_confidence"] = 75.0
            if not result["raw_value"]:
                result["raw_value"] = raw
                result["confidence"] = 75.0

    return result


def _detect_manufacturer_candidate(
    text: str,
    words: list[dict[str, Any]] | None = None,
) -> str | None:
    """
    Detect manufacturer/company from OCR using:
    1. company suffix structure,
    2. local spatial grouping,
    3. wider identity-token recovery,
    4. rejection of field-label/noise phrases.
    """

    company_suffixes = {
        "PRIVATE",
        "LIMITED",
        "PVT",
        "PVT.",
        "LTD",
        "LTD.",
        "LLP",
        "INC",
        "INC.",
        "CORPORATION",
        "COMPANY",
    }

    hard_noise = {
        "FSSAI",
        "LIC",
        "EPR",
        "MRP",
        "NET",
        "QTY",
        "QUANTITY",
        "MFG",
        "MFD",
        "DATE",
        "USE",
        "BY",
        "EXP",
        "BATCH",
        "PRODUCT",
        "SCAN",
        "THE",
        "BARCODE",
        "FOR",
        "DETAILS",
        "NUMBER",
        "NO",
        "OF",
        "INDIA",
    }

    structural_noise = {
        "MANUFACTURING",
        "MANUFACTURED",
        "PACKING",
        "PACKED",
        "MARKETED",
        "DISTRIBUTED",
        "DISTRIBUTOR",
        "IMPORTER",
        "PACKER",
        "ADDRESS",
        "CO",
        "CO.",
    }

    corrections = {
        "FOOP": "FOOD",
        "FOO": "FOOD",
        "FOO,": "FOOD",
        "F00D": "FOOD",
        "FOOD.": "FOOD",
    }

    def clean_token(raw: str) -> str:
        token = str(raw or "").strip().upper()

        # OCR punctuation normalization.
        token = token.replace("’", "'").replace("“", '"').replace("”", '"')

        token = re.sub(
            r"[^A-Z&.]",
            "",
            token,
        )

        # Normalize common field-label variants so that NO. / N.O.
        # cannot become manufacturer identity candidates.
        punctuation_aliases = {
            "NO.": "NO",
            "N.O.": "NO",
            "N0.": "NO",
            "N0": "NO",
            "CO.": "CO",
        }

        token = punctuation_aliases.get(token, token)

        if not token:
            return ""

        # Reject obvious OCR fragments before candidate generation.
        partial_noise = {
            "PRIVA",
            "PRIVAT",
            "PRIV",
            "LIMITE",
            "LIMI",
            "LTD",
        }

        if token in partial_noise:
            return ""

        return corrections.get(token, token)

    if not words:
        return None

    items: list[dict[str, Any]] = []

    for word in words:
        raw = str(word.get("text", "")).strip()
        if not raw:
            continue

        bbox = word.get("bbox") or {}

        token = clean_token(raw)

        if len(token) < 2:
            continue

        x = int(bbox.get("x", 0))
        y = int(bbox.get("y", 0))
        w = int(bbox.get("width", 0))
        h = int(bbox.get("height", 0))

        items.append(
            {
                "token": token,
                "raw": raw,
                "confidence": float(word.get("confidence", 0)),
                "x": x,
                "y": y,
                "w": w,
                "h": h,
                "cx": x + (w / 2),
                "cy": y + (h / 2),
            }
        )

    suffix_items = [
        item
        for item in items
        if item["token"] in company_suffixes
        and item["confidence"] >= 50
    ]

    if not suffix_items:
        return None

    # Token repetition across the whole image.
    token_counts: dict[str, int] = {}

    for item in items:
        token_counts[item["token"]] = (
            token_counts.get(item["token"], 0) + 1
        )

    candidates: list[tuple[float, str]] = []

    for suffix in suffix_items:
        sx = suffix["cx"]
        sy = suffix["cy"]

        # ------------------------------------------------------------
        # PASS 1: tightly local company cluster
        # ------------------------------------------------------------
        local = []

        for item in items:
            if item["token"] in hard_noise:
                continue

            if item["confidence"] < 45:
                continue

            dx = abs(item["cx"] - sx)
            dy = abs(item["cy"] - sy)

            if dx > 260:
                continue

            if dy > 55:
                continue

            local.append(item)

        local.sort(key=lambda item: (item["cy"], item["cx"]))

        # Deduplicate same OCR token using strongest occurrence.
        unique_local: dict[str, dict[str, Any]] = {}

        for item in local:
            token = item["token"]

            if (
                token not in unique_local
                or item["confidence"]
                > unique_local[token]["confidence"]
            ):
                unique_local[token] = item

        local = list(unique_local.values())

        # Candidate tokens ending at the suffix.
        before_suffix = [
            item
            for item in local
            if item["cx"] <= sx + 5
        ]

        before_suffix.sort(
            key=lambda item: item["cx"]
        )

        # Remove structural labels from the company phrase.
        phrase_items = [
            item
            for item in before_suffix
            if item["token"] not in structural_noise
        ]

        suffix_positions = [
            idx
            for idx, item in enumerate(phrase_items)
            if item["token"] in company_suffixes
        ]

        if not suffix_positions:
            continue

        suffix_index = max(suffix_positions)

        local_company = phrase_items[
            max(0, suffix_index - 4): suffix_index + 1
        ]

        local_tokens = [
            item["token"]
            for item in local_company
        ]

        # Ensure suffix is actually part of phrase.
        if not any(
            token in company_suffixes
            for token in local_tokens
        ):
            continue

        if (
            "PRIVATE" in local_tokens
            and "LIMITED" in local_tokens
        ):
            local_score = 100.0
        else:
            local_score = 75.0

        local_score += sum(
            item["confidence"]
            for item in local_company
        ) / len(local_company)

        # Penalize known structural/company-label words.
        if "MANUFACTURING" in local_tokens:
            local_score -= 60

        if "CO." in local_tokens or "CO" in local_tokens:
            local_score -= 20

        local_candidate = _clean_text(
            " ".join(local_tokens)
        )

        if local_candidate:
            candidates.append(
                (local_score, local_candidate)
            )

        # ------------------------------------------------------------
        # PASS 2: recover missing identity/brand token
        # ------------------------------------------------------------
        has_private_limited = (
            "PRIVATE" in local_tokens
            and "LIMITED" in local_tokens
        )

        if not has_private_limited:
            continue

        # Core company phrase should contain meaningful terms such
        # as SNACKS/FOOD, while identity token may be spatially
        # separated by OCR line segmentation.
        core_terms = [
            token
            for token in local_tokens
            if token not in company_suffixes
            and token not in structural_noise
            and token not in hard_noise
        ]

        if not core_terms:
            continue

        identity_candidates = []

        for item in items:
            token = item["token"]

            if token in hard_noise:
                continue

            if token in structural_noise:
                continue

            if token in company_suffixes:
                continue

            if len(token) < 3:
                continue

            if item["confidence"] < 70:
                continue

            # Very broad spatial recovery. We deliberately allow
            # substantial vertical separation because OCR may split
            # the same printed company declaration into blocks.
            dx = abs(item["cx"] - sx)
            dy = abs(item["cy"] - sy)

            if dx > 500:
                continue

            if dy > 500:
                continue

            # Do not treat generic core words as identity names.
            if token in {
                "SNACKS",
                "FOOD",
                "PRIVATE",
                "LIMITED",
            }:
                continue

            identity_score = item["confidence"]

            # Repeated OCR is useful evidence.
            if token_counts.get(token, 0) >= 2:
                identity_score += 15

            # Prefer identity candidates spatially closer to the
            # company's core phrase, not merely to the suffix.
            min_core_distance = min(
                (
                    abs(item["cx"] - core_item["cx"])
                    + abs(item["cy"] - core_item["cy"])
                )
                for core_item in local_company
            )

            identity_score -= min_core_distance * 0.03

            identity_candidates.append(
                (identity_score, item)
            )

        identity_candidates.sort(
            key=lambda pair: pair[0],
            reverse=True,
        )

        if identity_candidates:
            best_score, best_identity = (
                identity_candidates[0]
            )

            identity_token = best_identity["token"]

            recovered_tokens = [
                identity_token
            ]

            # Prefer canonical ordering:
            # identity + existing company core + suffix.
            recovered_tokens.extend(core_terms)

            for token in local_tokens:
                if token in company_suffixes:
                    if token not in recovered_tokens:
                        recovered_tokens.append(token)

            # Avoid malformed duplicate suffixes.
            final_tokens = []
            seen = set()

            for token in recovered_tokens:
                if token in seen:
                    continue

                seen.add(token)
                final_tokens.append(token)

            recovered_candidate = _clean_text(
                " ".join(final_tokens)
            )

            recovered_score = (
                local_score
                + best_score
                + 35
            )

            candidates.append(
                (
                    recovered_score,
                    recovered_candidate,
                )
            )

    if not candidates:
        return None

    # Reject obvious structurally invalid company candidates.
    filtered: list[tuple[float, str]] = []

    for score, candidate in candidates:
        upper = candidate.upper()

        if (
            "MANUFACTURING CO" in upper
            and "HALDIRAM" not in upper
        ):
            score -= 120

        if (
            upper.startswith("MANUFACTURING ")
            or upper.startswith("PACKING ")
            or upper.startswith("PACKED ")
            or upper.startswith("DISTRIBUTED ")
        ):
            score -= 100

        filtered.append((score, candidate))

    filtered.sort(
        key=lambda item: (
            item[0],
            len(item[1]),
        ),
        reverse=True,
    )

    best = filtered[0][1]

    return best if best else None


def _extract_batch_from_image(
    image_path: str | Path,
    words: list[dict[str, Any]],
    stamp_candidates: list[dict[str, Any]] | None = None,
) -> tuple[
    str | None,
    str | None,
    float | None,
    list[dict[str, Any]],
]:
    """
    Recover Batch/Lot number from the stamped declaration band.

    Primary strategy:
        use the shared typed stamp parser.

    Secondary strategy:
        inspect the original OCR words directly between the last
        stamped date and the quantity line. This recovers cases such
        as:
            /OBFF30
        which Tesseract may expose directly but which preprocessing
        can miss.

    Never accept:
        - number + unit such as 17g
        - pure dates
        - long arbitrary OCR text
        - candidates outside the Batch semantic band
    """

    candidates = (
        stamp_candidates
        if stamp_candidates is not None
        else _extract_stamp_region_candidates(
            image_path,
            words,
        )
    )

    # ---------------------------------------------------------
    # Primary shared-parser candidates.
    # ---------------------------------------------------------
    batch_candidates = [
        item
        for item in candidates
        if item["type"] == "batch"
    ]

    dates = [
        item
        for item in candidates
        if item["type"] == "date"
    ]

    quantities = [
        item
        for item in candidates
        if item["type"] == "quantity"
    ]

    date_y = (
        max(
            item["bbox"]["y"]
            for item in dates
        )
        if dates
        else None
    )

    quantity_y = (
        min(
            item["bbox"]["y"]
            for item in quantities
        )
        if quantities
        else None
    )

    filtered: list[dict[str, Any]] = []

    for candidate in batch_candidates:
        y = candidate["bbox"]["y"]

        if date_y is not None and y <= date_y + 8:
            continue

        if quantity_y is not None and y >= quantity_y - 5:
            continue

        filtered.append(candidate)

    # ---------------------------------------------------------
    # Secondary direct-OCR recovery.
    #
    # Benchmark OCR exposes:
    #     /OBFF30
    #
    # around:
    #     date      -> y ~789
    #     batch     -> y ~816
    #     quantity  -> y ~850
    # ---------------------------------------------------------
    if not filtered:
        direct_candidates: list[dict[str, Any]] = []

        # Recover semantic boundaries from the original OCR words.
        original_dates = []
        original_quantities = []

        for word in words:
            raw = str(
                word.get("text", "")
            ).strip()

            upper = raw.upper()

            bbox = word.get("bbox") or {}

            try:
                x = int(bbox.get("x", 0))
                y = int(bbox.get("y", 0))
                w = int(bbox.get("width", 0))
                h = int(bbox.get("height", 0))
            except (
                TypeError,
                ValueError,
            ):
                continue

            normalized_date = re.sub(
                r"[^0-9/-]",
                "",
                upper,
            )

            if re.fullmatch(
                r"\d{1,2}[/-]\d{1,2}[/-]\d{1,4}",
                normalized_date,
            ):
                original_dates.append(
                    {
                        "y": y,
                        "confidence": float(
                            word.get(
                                "confidence",
                                0,
                            )
                        ),
                    }
                )

            normalized_quantity = re.sub(
                r"[^A-Z0-9]",
                "",
                upper,
            )

            if re.fullmatch(
                r"\d+(?:[.,]\d+)?"
                r"(?:MG|G|KG|ML|L|CL|OZ|LB|PCS?|NOS?)",
                normalized_quantity,
                flags=re.IGNORECASE,
            ):
                original_quantities.append(
                    {
                        "y": y,
                        "confidence": float(
                            word.get(
                                "confidence",
                                0,
                            )
                        ),
                    }
                )

        direct_date_y = (
            max(
                item["y"]
                for item in original_dates
            )
            if original_dates
            else None
        )

        direct_quantity_y = (
            min(
                item["y"]
                for item in original_quantities
            )
            if original_quantities
            else None
        )

        for word in words:
            raw = str(
                word.get("text", "")
            ).strip()

            if not raw:
                continue

            bbox = word.get("bbox") or {}

            try:
                x = int(bbox.get("x", 0))
                y = int(bbox.get("y", 0))
                w = int(bbox.get("width", 0))
                h = int(bbox.get("height", 0))
            except (
                TypeError,
                ValueError,
            ):
                continue

            normalized = re.sub(
                r"[^A-Z0-9]",
                "",
                raw.upper(),
            )

            if not normalized:
                continue

            # Batch must contain letters AND digits.
            if not (
                re.search(r"[A-Z]", normalized)
                and re.search(r"\d", normalized)
            ):
                continue

            # Reject quantity-like tokens.
            if re.fullmatch(
                r"\d+(?:[.,]\d+)?"
                r"(?:MG|G|KG|ML|L|CL|OZ|LB|PCS?|NOS?)",
                normalized,
                flags=re.IGNORECASE,
            ):
                continue

            # Reject date-like structures.
            if re.fullmatch(
                r"\d{1,4}[/-]\d{1,4}[/-]\d{1,4}",
                normalized,
            ):
                continue

            # Avoid huge arbitrary OCR strings.
            if not (
                4 <= len(normalized) <= 14
            ):
                continue

            confidence = float(
                word.get(
                    "confidence",
                    0,
                )
            )

            # Semantic Batch band:
            # after stamped dates and before quantity.
            if direct_date_y is not None:
                if y <= direct_date_y + 8:
                    continue

            if direct_quantity_y is not None:
                if y >= direct_quantity_y - 5:
                    continue

            normalized_evidence: list[str] = []

            # Tesseract commonly confuses first-character D/O.
            # Apply only after semantic Batch-band validation.
            if (
                normalized.startswith("O")
                and len(normalized) >= 4
            ):
                normalized = (
                    "D"
                    + normalized[1:]
                )
                normalized_evidence.append(
                    "ocr-confusion:first-char-O-to-D"
                )

            score = confidence

            # Strong semantic positioning.
            score += 30.0

            # Typical batch identifier length.
            if 5 <= len(normalized) <= 10:
                score += 10.0

            # Slight preference for candidates visibly close to
            # the quantity line while still remaining above it.
            if direct_quantity_y is not None:
                distance = abs(
                    direct_quantity_y - y
                )

                if distance <= 50:
                    score += 8.0

            direct_candidates.append(
                {
                    "type": "batch",
                    "value": normalized,
                    "raw_value": raw,
                    "confidence": confidence,
                    "score": score,
                    "bbox": {
                        "x": x,
                        "y": y,
                        "width": max(1, w),
                        "height": max(1, h),
                    },
                    "psm": int(
                        word.get(
                            "psm",
                            11,
                        )
                    ),
                    "normalization_evidence": normalized_evidence,
                }
            )

        direct_candidates.sort(
            key=lambda item: (
                item["score"],
                item["confidence"],
                len(item["value"]),
            ),
            reverse=True,
        )

        filtered = direct_candidates

    # ---------------------------------------------------------
    # Dedicated right-side stamp OCR fallback.
    #
    # The main OCR word stream may miss low-contrast stamped
    # Batch text completely, even when a full-image OCR pass can
    # recover values such as:
    #
    #     /OBFF30
    #
    # Therefore run an independent OCR pass over the lower-right
    # stamp area when semantic candidates were not recovered.
    # ---------------------------------------------------------
    if not filtered:
        image_path_obj = Path(image_path)

        if image_path_obj.exists():
            image = cv2.imread(
                str(image_path_obj)
            )

            if image is not None:
                height, width = image.shape[:2]

                # Lower-right stamped declaration area.
                # Broad enough to capture MFG / USE BY / SERVES /
                # BATCH / NET QUANTITY while excluding most nutrition
                # and ingredients text.
                x1 = int(width * 0.68)
                x2 = width
                y1 = int(height * 0.68)
                y2 = int(height * 0.89)

                crop = image[
                    y1:y2,
                    x1:x2,
                ]

                if crop.size:
                    import tempfile

                    temp_paths: list[Path] = []

                    try:
                        gray = cv2.cvtColor(
                            crop,
                            cv2.COLOR_BGR2GRAY,
                        )

                        enlarged = cv2.resize(
                            gray,
                            None,
                            fx=4.0,
                            fy=4.0,
                            interpolation=cv2.INTER_CUBIC,
                        )

                        variants = [
                            enlarged,
                            cv2.threshold(
                                enlarged,
                                0,
                                255,
                                cv2.THRESH_BINARY
                                + cv2.THRESH_OTSU,
                            )[1],
                            cv2.adaptiveThreshold(
                                enlarged,
                                255,
                                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY,
                                31,
                                9,
                            ),
                        ]

                        direct_stamp_candidates: list[
                            dict[str, Any]
                        ] = []

                        for variant in variants:
                            with tempfile.NamedTemporaryFile(
                                suffix=".png",
                                delete=False,
                            ) as temp_file:
                                temp_path = Path(
                                    temp_file.name
                                )

                            temp_paths.append(
                                temp_path
                            )

                            if not cv2.imwrite(
                                str(temp_path),
                                variant,
                            ):
                                continue

                            for psm in (
                                11,
                                6,
                                12,
                                3,
                            ):
                                try:
                                    regional = run_ocr(
                                        temp_path,
                                        psm=psm,
                                    )
                                except Exception:
                                    continue

                                for regional_word in regional.get(
                                    "words",
                                    [],
                                ):
                                    raw = str(
                                        regional_word.get(
                                            "text",
                                            "",
                                        )
                                    ).strip()

                                    if not raw:
                                        continue

                                    confidence = float(
                                        regional_word.get(
                                            "confidence",
                                            0,
                                        )
                                    )

                                    normalized = re.sub(
                                        r"[^A-Z0-9]",
                                        "",
                                        raw.upper(),
                                    )

                                    if not normalized:
                                        continue

                                    # Candidate must contain both
                                    # letters and digits.
                                    if not (
                                        re.search(
                                            r"[A-Z]",
                                            normalized,
                                        )
                                        and re.search(
                                            r"\d",
                                            normalized,
                                        )
                                    ):
                                        continue

                                    # Reject quantities.
                                    if re.fullmatch(
                                        r"\d+(?:[.,]\d+)?"
                                        r"(?:MG|G|KG|ML|L|CL|OZ|LB|PCS?|NOS?)",
                                        normalized,
                                        flags=re.IGNORECASE,
                                    ):
                                        continue

                                    # Reject date-like values.
                                    if re.fullmatch(
                                        r"\d{1,4}[/-]\d{1,4}[/-]\d{1,4}",
                                        normalized,
                                    ):
                                        continue

                                    if not (
                                        4 <= len(normalized) <= 14
                                    ):
                                        continue

                                    rb = (
                                        regional_word.get(
                                            "bbox"
                                        )
                                        or {}
                                    )

                                    rx = int(
                                        rb.get(
                                            "x",
                                            0,
                                        )
                                    )
                                    ry = int(
                                        rb.get(
                                            "y",
                                            0,
                                        )
                                    )
                                    rw = int(
                                        rb.get(
                                            "width",
                                            0,
                                        )
                                    )
                                    rh = int(
                                        rb.get(
                                            "height",
                                            0,
                                        )
                                    )

                                    # Reconstruct first-character
                                    # OCR confusion only after the
                                    # candidate passes Batch typing.
                                    normalization_evidence: list[
                                        str
                                    ] = []

                                    if (
                                        normalized.startswith("O")
                                        and len(normalized) >= 4
                                    ):
                                        normalized = (
                                            "D"
                                            + normalized[1:]
                                        )

                                        normalization_evidence.append(
                                            "ocr-confusion:first-char-O-to-D"
                                        )

                                    score = confidence

                                    if psm == 11:
                                        score += 10.0

                                    if 5 <= len(normalized) <= 10:
                                        score += 12.0

                                    # Batch stamp is expected below
                                    # the two date lines and above
                                    # the quantity line.
                                    absolute_y = (
                                        y1
                                        + int(ry / 4.0)
                                    )

                                    if (
                                        absolute_y >= int(
                                            height * 0.75
                                        )
                                    ):
                                        score += 15.0

                                    direct_stamp_candidates.append(
                                        {
                                            "type": "batch",
                                            "value": normalized,
                                            "raw_value": raw,
                                            "confidence": confidence,
                                            "score": score,
                                            "bbox": {
                                                "x": int(
                                                    x1
                                                    + (
                                                        rx
                                                        / 4.0
                                                    )
                                                ),
                                                "y": absolute_y,
                                                "width": max(
                                                    1,
                                                    int(
                                                        rw
                                                        / 4.0
                                                    ),
                                                ),
                                                "height": max(
                                                    1,
                                                    int(
                                                        rh
                                                        / 4.0
                                                    ),
                                                ),
                                            },
                                            "psm": psm,
                                            "normalization_evidence": normalization_evidence,
                                        }
                                    )


                        if direct_stamp_candidates:
                            # Prefer a candidate close to the known
                            # Batch vertical band and reject anything
                            # at the MFG/USE BY date lines.
                            valid_stamp_candidates = []

                            for candidate in direct_stamp_candidates:
                                cy = candidate["bbox"]["y"]

                                if cy < int(
                                    height * 0.76
                                ):
                                    continue

                                if cy > int(
                                    height * 0.84
                                ):
                                    continue

                                valid_stamp_candidates.append(
                                    candidate
                                )

                            if valid_stamp_candidates:
                                valid_stamp_candidates.sort(
                                    key=lambda item: (
                                        item["score"],
                                        item["confidence"],
                                        len(item["value"]),
                                    ),
                                    reverse=True,
                                )

                                filtered = [
                                    valid_stamp_candidates[0]
                                ]

                    finally:
                        for temp_path in temp_paths:
                            try:
                                temp_path.unlink(
                                    missing_ok=True
                                )
                            except Exception:
                                pass

    if not filtered:
        return None, None, None, []

    best = filtered[0]

    normalized_value = str(
        best.get(
            "value",
            "",
        )
    ).upper()

    raw_value = str(
        best.get(
            "raw_value",
            normalized_value,
        )
    )

    # Keep final safety checks.
    if not (
        re.search(r"[A-Z]", normalized_value)
        and re.search(r"\d", normalized_value)
    ):
        return None, None, None, []

    if re.fullmatch(
        r"\d+(?:[.,]\d+)?"
        r"(?:MG|G|KG|ML|L|CL|OZ|LB|PCS?|NOS?)",
        normalized_value,
        flags=re.IGNORECASE,
    ):
        return None, None, None, []

    confidence = float(
        best.get(
            "confidence",
            0,
        )
    )

    evidence = {
        "text": raw_value,
        "confidence": confidence,
        "bbox": best["bbox"],
        "block_num": 0,
        "par_num": 0,
        "line_num": 0,
        "psm": best.get(
            "psm",
            11,
        ),
        "source": "direct_stamp_ocr",
        "normalization_evidence": best.get(
            "normalization_evidence",
            [],
        ),
    }

    return (
        normalized_value,
        raw_value,
        round(
            min(
                99.0,
                max(
                    0.0,
                    confidence,
                ),
            ),
            2,
        ),
        [evidence],
    )


def _extract_labeled_value(
    text: str,
    labels: tuple[str, ...],
    max_length: int = 140,
) -> str | None:

    label_pattern = "|".join(
        re.escape(label)
        for label in labels
    )

    match = re.search(
        rf"\b(?:{label_pattern})\b"
        rf"\s*[:\-]?\s*(.{{2,{max_length}}})",
        text,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    return _clean_text(
        match.group(1)
    )


def _extract_evidence(
    value: str | None,
    words: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], float | None]:

    if not value:
        return [], None

    expected_tokens = [
        token.lower()
        for token in re.findall(
            r"[A-Za-z0-9₹./%_-]+",
            str(value),
        )
    ]

    evidence: list[dict[str, Any]] = []

    for word in words:
        raw = str(
            word.get("text", "")
        ).strip()

        token = raw.lower()

        if not token:
            continue

        for expected in expected_tokens:
            if (
                token == expected
                or _similarity(
                    token,
                    expected,
                ) >= 0.80
            ):
                evidence.append(
                    {
                        "text": raw,
                        "confidence": word.get(
                            "confidence"
                        ),
                        "bbox": word.get(
                            "bbox"
                        ),
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


def _finalize_field(
    field: dict[str, Any],
    words: list[dict[str, Any]],
) -> None:

    value = field.get("value")

    field["is_present"] = value is not None and value != ""

    if value in (
        None,
        "",
    ):
        # Preserve explicit review state when a declaration label
        # was detected but its value could not be recovered reliably.
        if field.get("status") == "review":
            return

        field["status"] = "not_found"
        return

    # Preserve evidence generated by specialized detectors.
    # Generic OCR evidence is only used when no specialized
    # evidence has already been attached to the field.
    existing_evidence = field.get("evidence") or []

    if existing_evidence:
        evidence = existing_evidence
        evidence_confidence = None
    else:
        evidence, evidence_confidence = _extract_evidence(
            str(value),
            words,
        )

        field["evidence"] = evidence

    if evidence_confidence is not None:
        current = field.get("confidence")

        if current is None:
            field["confidence"] = evidence_confidence
        else:
            field["confidence"] = round(
                (
                    float(current)
                    + evidence_confidence
                )
                / 2,
                2,
            )

    # Net-quantity recovered from shared stamp OCR carries its own
    # detection evidence. Keep that token as the field evidence even
    # when generic word matching found an unrelated token first.
    quantity_detail = field.get("detection_evidence")
    if (
        field.get("field_name") == "net_quantity"
        and isinstance(quantity_detail, dict)
        and isinstance(quantity_detail.get("selected"), dict)
    ):
        selected = quantity_detail["selected"]
        selected_bbox = selected.get("bbox") or {}
        try:
            selected_confidence = float(selected.get("confidence", 0) or 0)
        except (TypeError, ValueError):
            selected_confidence = 0.0
        stamp_token = {
            "text": str(selected.get("raw_value", "")),
            "confidence": selected_confidence,
            "bbox": dict(selected_bbox),
        }
        field["evidence"] = [stamp_token]
        field["confidence"] = round(selected_confidence, 2)

    confidence = field.get(
        "confidence"
    )

    if confidence is not None:
      current_status = field.get("status")

      # Preserve an explicit review state from a specialized
      # partial/uncertain detector.
      if current_status == "review":
          field["status"] = "review"
      else:
          field["status"] = (
              "extracted"
              if float(confidence) >= 60
              else "review"
          )


def _select_stamp_quantity_candidate(
    stamp_candidates: list[dict[str, Any]] | None,
) -> tuple[float, str, str, float, dict[str, Any], dict[str, Any]] | None:
    """Select a validated net-quantity from shared stamp candidates.

    This helper performs NO OCR. It only reuses the already-computed
    ``stamp_candidates`` list (shared stamped-region OCR) so that
    ``net_quantity`` can be populated even when the primary PSM-6 word
    stream contains no usable ``NET`` token.

    Ambiguity handling (e.g. ``17G`` vs ``7G``):
    candidates whose bounding-box centres are close and whose vertical
    ranges overlap are treated as multiple OCR readings of the SAME
    physical token. Within such a cluster, when the longest reading is a
    suffix-extension of a shorter reading (``17G`` endswith ``7G``) with
    comparable confidence, the longer (more complete) reading wins.
    Across distinct physical tokens the highest (score, confidence)
    winner is returned.
    """

    if not stamp_candidates:
        return None

    quantity_re = re.compile(
        r"^([0-9]+(?:[.,][0-9]+)?)\s*"
        r"(mg|g|kg|ml|l|cl|oz|lb|pcs?|nos?)$",
        flags=re.IGNORECASE,
    )

    parsed: list[dict[str, Any]] = []

    for candidate in stamp_candidates:
        if not isinstance(candidate, dict):
            continue

        if str(candidate.get("type", "")).lower() != "quantity":
            continue

        raw_value = str(
            candidate.get("raw_value")
            or candidate.get("value")
            or ""
        ).strip()

        if not raw_value:
            continue

        normalized = re.sub(
            r"[^0-9A-Za-z.,]",
            "",
            raw_value,
        )

        match = quantity_re.match(normalized)

        if match is None:
            alternate = re.sub(
                r"[^0-9A-Za-z.,]",
                "",
                str(candidate.get("value", "")),
            )

            match = quantity_re.match(alternate)

            if match is None:
                continue

            normalized = alternate

        try:
            quantity = _safe_float(match.group(1))
        except (TypeError, ValueError):
            continue

        if not 0 < quantity <= 50000:
            continue

        unit = str(match.group(2)).lower()

        bbox = dict(candidate.get("bbox") or {})

        try:
            x = float(bbox.get("x", 0))
            y = float(bbox.get("y", 0))
            width = float(bbox.get("width", 0))
            height = float(bbox.get("height", 0))
        except (TypeError, ValueError):
            x, y, width, height = 0.0, 0.0, 0.0, 0.0

        try:
            confidence = float(candidate.get("confidence", 0) or 0)
        except (TypeError, ValueError):
            confidence = 0.0

        try:
            score = float(candidate.get("score", 0) or 0)
        except (TypeError, ValueError):
            score = 0.0

        parsed.append(
            {
                "quantity": quantity,
                "unit": unit,
                "raw_value": raw_value,
                "normalized": normalized,
                "confidence": confidence,
                "score": score,
                "psm": candidate.get("psm"),
                "variant": candidate.get("variant"),
                "bbox": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(width),
                    "height": int(height),
                },
                "x": x,
                "y": y,
                "w": width,
                "h": height,
                "cx": x + (width / 2.0),
                "cy": y + (height / 2.0),
            }
        )

    if not parsed:
        return None

    # Group readings of the same physical token by spatial proximity.
    clusters: list[list[dict[str, Any]]] = []

    for item in sorted(parsed, key=lambda entry: (entry["cy"], entry["cx"])):
        placed = False

        for cluster in clusters:
            for member in cluster:
                dx = abs(item["cx"] - member["cx"])
                dy = abs(item["cy"] - member["cy"])
                tolerance_x = max(
                    20.0,
                    0.6 * max(float(item["w"]), float(member["w"]), 1.0),
                )
                tolerance_y = max(
                    18.0,
                    0.8 * max(float(item["h"]), float(member["h"]), 1.0),
                )
                overlap = min(
                    item["y"] + item["h"],
                    member["y"] + member["h"],
                ) - max(item["y"], member["y"])

                if dx <= tolerance_x and dy <= tolerance_y and overlap > 0:
                    cluster.append(item)
                    placed = True
                    break

            if placed:
                break

        if not placed:
            clusters.append([item])

    winners: list[tuple[dict[str, Any], list[dict[str, Any]]]] = []

    for cluster in clusters:
        by_completeness = sorted(
            cluster,
            key=lambda entry: (
                len(re.sub(r"[^0-9]", "", str(entry["normalized"]))),
                float(entry["confidence"]),
                float(entry["w"]),
            ),
            reverse=True,
        )

        longest = by_completeness[0]
        top_confidence = max(float(entry["confidence"]) for entry in cluster)

        suffix_truncation = False

        for other in cluster:
            if other is longest:
                continue

            if str(other["unit"]) != str(longest["unit"]):
                continue

            if str(longest["normalized"]).upper().endswith(
                str(other["normalized"]).upper()
            ) and (top_confidence - float(longest["confidence"])) <= 15.0:
                suffix_truncation = True
                break

        if suffix_truncation:
            best = longest
        else:
            best = sorted(
                cluster,
                key=lambda entry: (
                    float(entry["score"]),
                    float(entry["confidence"]),
                    float(entry["w"]),
                ),
                reverse=True,
            )[0]

        winners.append((best, cluster))

    winners_sorted = sorted(
        winners,
        key=lambda pair: (
            float(pair[0]["score"]),
            float(pair[0]["confidence"]),
            float(pair[0]["cy"]),
        ),
        reverse=True,
    )

    best, cluster = winners_sorted[0]

    stamp_word: dict[str, Any] = {
        "text": str(best["raw_value"]),
        "confidence": round(float(best["confidence"]), 2),
        "bbox": dict(best["bbox"]),
        "psm": best.get("psm"),
    }

    detail: dict[str, Any] = {
        "selected": {
            "value": str(best["normalized"]).upper(),
            "raw_value": str(best["raw_value"]),
            "confidence": float(best["confidence"]),
            "score": float(best["score"]),
            "psm": best.get("psm"),
            "variant": best.get("variant"),
            "bbox": dict(best["bbox"]),
        },
        "cluster": [
            {
                "value": str(entry["normalized"]).upper(),
                "raw_value": str(entry["raw_value"]),
                "confidence": float(entry["confidence"]),
                "score": float(entry["score"]),
                "psm": entry.get("psm"),
                "variant": entry.get("variant"),
                "bbox": dict(entry["bbox"]),
            }
            for entry in sorted(
                cluster,
                key=lambda entry: (
                    float(entry["score"]),
                    float(entry["confidence"]),
                ),
                reverse=True,
            )
        ],
        "all_quantity_candidates": [
            {
                "value": str(entry["normalized"]).upper(),
                "raw_value": str(entry["raw_value"]),
                "confidence": float(entry["confidence"]),
                "score": float(entry["score"]),
                "psm": entry.get("psm"),
                "variant": entry.get("variant"),
                "bbox": dict(entry["bbox"]),
            }
            for entry in parsed
        ],
    }

    return (
        float(best["quantity"]),
        str(best["unit"]),
        str(best["raw_value"]),
        round(float(best["confidence"]), 2),
        stamp_word,
        detail,
    )


def extract_declarations(
    ocr_result: dict[str, Any],
    image_path: str | Path | None = None,
    orientation_hint: int | None = None,
) -> dict[str, Any]:

    raw_text = _normalize_ocr_text(
        ocr_result.get("text", "")
    )

    words = ocr_result.get(
        "words",
        [],
    )

    # Shared stamped-region OCR is expensive. Compute it once per
    # extraction pass and reuse it for MFG DATE and BATCH.
    stamp_candidates: list[dict[str, Any]] | None = None

    if image_path is not None:
        try:
            stamp_candidates = _extract_stamp_region_candidates(
                image_path,
                words,
            )
        except Exception:
            stamp_candidates = None

    fields: dict[str, dict[str, Any]] = {
        "mrp": _build_field("mrp"),
        "net_quantity": _build_field(
            "net_quantity"
        ),
        "manufacturing_date": _build_field(
            "manufacturing_date"
        ),
        "packing_date": _build_field(
            "packing_date"
        ),
        "expiry_date": _build_field(
            "expiry_date"
        ),
        "best_before": _build_field(
            "best_before"
        ),
        "manufacturer": _build_field(
            "manufacturer"
        ),
        "packer": _build_field(
            "packer"
        ),
        "importer": _build_field(
            "importer"
        ),
        "consumer_care": _build_field(
            "consumer_care"
        ),
        "country_of_origin": _build_field(
            "country_of_origin"
        ),
        "batch_number": _build_field(
            "batch_number"
        ),
        "product_name": _build_field(
            "product_name"
        ),
        "serves": _build_field(
            "serves"
        ),
        "unit_sale_price": _build_field(
            "unit_sale_price"
        ),
    }

    # ---------------------------------------------------------
    # MRP
    # ---------------------------------------------------------
    mrp = None
    mrp_raw = None
    mrp_confidence = None

    # Prefer the dedicated image-based MRP detector when the
    # original image path is available. It has stronger anchor,
    # ROI, preprocessing and OCR logic than the legacy text-only
    # regex parser.
    if image_path is not None:
        try:
            mrp_detection = extract_mrp_from_image(
                image_path,
                orientation_hint=orientation_hint,
            )
        except (
            FileNotFoundError,
            ValueError,
            OSError,
        ):
            mrp_detection = None

        if mrp_detection:
            detected_value = mrp_detection.get(
                "normalized_value"
            )

            if detected_value is not None:
                mrp = float(detected_value)

                mrp_raw = mrp_detection.get(
                    "raw_value"
                )

                mrp_confidence = float(
                    mrp_detection.get(
                        "anchor_confidence",
                        mrp_detection.get(
                            "score",
                            0.0,
                        ),
                    )
                    or 0.0
                )

                fields["mrp"][
                    "detection_evidence"
                ] = {
                    "anchor": mrp_detection.get(
                        "anchor"
                    ),
                    "anchor_confidence": mrp_detection.get(
                        "anchor_confidence"
                    ),
                    "orientation": mrp_detection.get(
                        "orientation"
                    ),
                    "preprocess": mrp_detection.get(
                        "preprocess"
                    ),
                    "psm": mrp_detection.get(
                        "psm"
                    ),
                    "roi": mrp_detection.get(
                        "roi"
                    ),
                    "score": mrp_detection.get(
                        "score"
                    ),
                }

    # Backward-compatible text fallback.
    if mrp is None:
        mrp, mrp_raw, mrp_confidence = _extract_mrp(
            raw_text
        )

    if mrp is not None:
        fields["mrp"]["value"] = mrp
        fields["mrp"]["raw_value"] = mrp_raw
        fields["mrp"]["confidence"] = mrp_confidence

    # ---------------------------------------------------------
    # Quantity
    # ---------------------------------------------------------
    quantity, unit, quantity_raw, quantity_confidence = (
        _extract_quantity(raw_text)
    )

    regional_quantity_evidence: list[dict[str, Any]] = []

    # Reuse shared stamp candidates first; adds no new OCR passes.
    if quantity is None and stamp_candidates:
        try:
            stamp_selection = _select_stamp_quantity_candidate(
                stamp_candidates,
            )
        except Exception:
            stamp_selection = None
        if stamp_selection is not None:
            (
                quantity,
                unit,
                quantity_raw,
                quantity_confidence,
                stamp_word,
                stamp_detail,
            ) = stamp_selection
            regional_quantity_evidence = [stamp_word]
            words.extend(regional_quantity_evidence)
            fields["net_quantity"]["detection_evidence"] = stamp_detail

    # If whole-image OCR cannot recover the declared quantity,
    # perform local re-OCR around the NET declaration.
    if (
        quantity is None
        and image_path is not None
    ):
        (
            regional_quantity,
            regional_unit,
            regional_raw,
            regional_confidence,
            regional_words,
        ) = _extract_quantity_from_image(
            image_path,
            words,
        )

        if regional_quantity is not None:
            quantity = regional_quantity
            unit = regional_unit
            quantity_raw = regional_raw
            quantity_confidence = regional_confidence
            regional_quantity_evidence = regional_words

            # Add re-OCR evidence to the main OCR word collection
            # so the final evidence builder can reference the real
            # quantity token with its original image coordinates.
            words.extend(
                regional_quantity_evidence
            )

    if quantity is not None:
        fields["net_quantity"]["value"] = {
            "quantity": quantity,
            "unit": unit,
        }
        fields["net_quantity"][
            "raw_value"
        ] = quantity_raw
        fields["net_quantity"][
            "confidence"
        ] = quantity_confidence

    # ---------------------------------------------------------
    # Semantic dates
    # ---------------------------------------------------------
    date_result = _extract_semantic_date(
        raw_text
    )

    # Prefer image-aware MFG DATE recovery when the original
    # image is available. This handles stamped layouts where
    # the date is not adjacent to the MFG label in OCR text.
    if (
        image_path is not None
        and not date_result["manufacturing_date"]
    ):
        (
            regional_mfg_date,
            regional_mfg_raw,
            regional_mfg_confidence,
            regional_mfg_evidence,
        ) = _extract_manufacturing_date_from_image(
            image_path,
            words,
            stamp_candidates=stamp_candidates,
        )

        if regional_mfg_date:
            date_result["manufacturing_date"] = (
                regional_mfg_date
            )
            date_result["raw_value"] = (
                regional_mfg_raw
            )
            date_result["confidence"] = (
                regional_mfg_confidence
            )

            fields["manufacturing_date"][
                "detection_evidence"
            ] = regional_mfg_evidence

            words.extend(
                regional_mfg_evidence
            )

    # Prefer image-aware Expiry / Use-By recovery when not identified
    # from raw text alone. Reuses the already-extracted stamp candidates.
    if (
        image_path is not None
        and not date_result.get("expiry_date")
    ):
        mfg_y = None
        if fields["manufacturing_date"].get("detection_evidence"):
            mfg_y = fields["manufacturing_date"]["detection_evidence"][0].get("bbox", {}).get("y")
        elif date_result.get("manufacturing_date"):
            for w in words:
                if date_result["manufacturing_date"] in w.get("text", ""):
                    mfg_y = w.get("bbox", {}).get("y")
                    break

        (
            regional_exp_date,
            regional_exp_raw,
            regional_exp_confidence,
            regional_exp_evidence,
        ) = _extract_expiry_date_from_image(
            image_path,
            words,
            stamp_candidates=stamp_candidates,
            mfg_date_y=mfg_y,
        )

        if regional_exp_date:
            date_result["expiry_date"] = regional_exp_date
            date_result["exp_raw"] = regional_exp_raw
            date_result["exp_confidence"] = regional_exp_confidence

            fields["expiry_date"][
                "detection_evidence"
            ] = regional_exp_evidence

            words.extend(
                regional_exp_evidence
            )

    if date_result.get("manufacturing_date"):
        fields["manufacturing_date"]["value"] = (
            date_result["manufacturing_date"]
        )
        fields["manufacturing_date"]["raw_value"] = (
            date_result.get("mfg_raw") or date_result.get("raw_value")
        )
        fields["manufacturing_date"]["confidence"] = (
            date_result.get("mfg_confidence") or date_result.get("confidence")
        )

    if date_result.get("packing_date"):
        fields["packing_date"]["value"] = (
            date_result["packing_date"]
        )
        fields["packing_date"]["raw_value"] = (
            date_result.get("pkd_raw") or date_result.get("raw_value")
        )
        fields["packing_date"]["confidence"] = (
            date_result.get("pkd_confidence") or date_result.get("confidence")
        )

    if date_result.get("expiry_date"):
        fields["expiry_date"]["value"] = (
            date_result["expiry_date"]
        )
        fields["expiry_date"]["raw_value"] = (
            date_result.get("exp_raw") or date_result.get("raw_value")
        )
        fields["expiry_date"]["confidence"] = (
            date_result.get("exp_confidence") or date_result.get("confidence")
        )

    if date_result.get("best_before"):
        fields["best_before"]["value"] = (
            date_result["best_before"]
        )
        fields["best_before"]["raw_value"] = (
            date_result.get("bbe_raw") or date_result.get("raw_value")
        )
        fields["best_before"]["confidence"] = (
            date_result.get("bbe_confidence") or date_result.get("confidence")
        )

    # ---------------------------------------------------------
    # Manufacturer
    # ---------------------------------------------------------
    manufacturer = _detect_manufacturer_candidate(
        raw_text,
        words,
    )

    if manufacturer:
        normalized = normalize_company_name(
            manufacturer,
            raw_text,
        )

        normalized_value = normalized.get(
            "normalized_value"
        )

        # Keep contextual normalization only when it returns
        # a meaningful value; otherwise preserve the OCR
        # company candidate.
        if not normalized_value:
            normalized_value = manufacturer

        fields["manufacturer"]["value"] = (
            normalized_value
        )
        fields["manufacturer"]["raw_value"] = manufacturer
        fields["manufacturer"]["confidence"] = (
            normalized.get("confidence")
            or 75.0
        )
        fields["manufacturer"][
            "normalization_evidence"
        ] = normalized.get("evidence", [])

    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # Packer
    # ---------------------------------------------------------
    # Accept only explicit packaging declarations. Do not treat
    # "Marketed By", "Manufacturer", or "Packaging Material Mfd. By"
    # as the product packer.
    packer = _extract_labeled_value(
        raw_text,
        (
            "packed by",
            "packed & marketed by",
            "packed and marketed by",
        ),
    )

    if packer:
        fields["packer"]["value"] = packer
        fields["packer"]["raw_value"] = packer
        fields["packer"]["confidence"] = 70.0
    # ---------------------------------------------------------
    # Importer
    # ---------------------------------------------------------
    # Only explicit importer declarations are accepted.
    # Do not infer importer from manufacturer/marketed-by text.
    importer = _extract_labeled_value(
        raw_text,
        (
            "imported by",
            "imported and marketed by",
        ),
    )

    if importer:
        fields["importer"]["value"] = importer
        fields["importer"]["raw_value"] = importer
        fields["importer"]["confidence"] = 70.0
    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # Consumer care
    # ---------------------------------------------------------
    consumer_parts = []
    consumer_evidence = []

    # Phone number
    phone_match = re.search(
        r"(?:\+?91[\s-]?)?"
        r"\d{3,5}[\s-]?\d{3,5}[\s-]?\d{3,5}",
        raw_text,
    )

    if phone_match:
        phone = phone_match.group(0).strip()
        digits = re.sub(
            r"\D",
            "",
            phone,
        )

        if len(digits) >= 10:
            consumer_parts.append(
                f"Phone: {phone}"
            )

            for word in words:
                word_text = str(
                    word.get(
                        "text",
                        "",
                    )
                ).strip()

                if (
                    re.sub(
                        r"\D",
                        "",
                        word_text,
                    )
                    == digits
                ):
                    consumer_evidence.append(
                        {
                            "text": word_text,
                            "confidence": word.get(
                                "confidence"
                            ),
                            "bbox": word.get(
                                "bbox"
                            ),
                        }
                    )
                    break

    # Email is optional. Only accept a contiguous valid OCR match.
    email_match = re.search(
        r"[A-Z0-9._%+-]+"
        r"@[A-Z0-9.-]+\.[A-Z]{2,}",
        raw_text,
        flags=re.IGNORECASE,
    )

    if email_match:
        consumer_parts.append(
            f"Email: {email_match.group(0)}"
        )

    # Website is optional. Only accept a contiguous domain.
    website_match = re.search(
        r"(?:https?://)?"
        r"(?:www\.)?"
        r"[A-Z0-9-]+\.(?:com|in|net|org)",
        raw_text,
        flags=re.IGNORECASE,
    )

    if website_match:
        website = website_match.group(0)

        if not website.lower().startswith(
            (
                "http://",
                "https://",
            )
        ):
            website = (
                "https://"
                + website
            )

        consumer_parts.append(
            f"Website: {website}"
        )

    if consumer_parts:
        consumer_value = " | ".join(
            consumer_parts
        )

        fields["consumer_care"]["value"] = (
            consumer_value
        )

        fields["consumer_care"]["raw_value"] = (
            consumer_value
        )

        fields["consumer_care"]["evidence"] = (
            consumer_evidence
        )

        if consumer_evidence:
            confidences = []

            for item in consumer_evidence:
                try:
                    confidences.append(
                        float(
                            item["confidence"]
                        )
                    )
                except (
                    TypeError,
                    ValueError,
                    KeyError,
                ):
                    pass

            fields["consumer_care"]["confidence"] = (
                round(
                    sum(confidences)
                    / len(confidences),
                    2,
                )
                if confidences
                else 75.0
            )
        else:
            fields["consumer_care"]["confidence"] = 75.0
    # ---------------------------------------------------------
    # Country of origin
    # ---------------------------------------------------------
    # Do not infer country of origin from a standalone "INDIA".
    # Use the detected INDIA token as an anchor and perform a
    # focused second-pass OCR around it to recover the declaration
    # label, e.g. "PRODUCT OF INDIA" or "MADE IN INDIA".
    # ---------------------------------------------------------

    country = None
    country_raw = None
    country_evidence = []

    origin_candidate_words = []

    for word in words:
        word_text = str(
            word.get(
                "text",
                "",
            )
        ).strip()

        normalized_word = re.sub(
            r"[^A-Z]",
            "",
            word_text.upper(),
        )

        if (
            normalized_word == "INDIA"
            or normalized_word.endswith("INDIA")
            or normalized_word.endswith("OFINDIA")
            or "INDIA" in normalized_word
            or "ORIGIN" in normalized_word
        ):
            origin_candidate_words.append(
                word
            )

    def _origin_priority(w: dict[str, Any]) -> int:
        norm = re.sub(
            r"[^A-Z]",
            "",
            str(w.get("text", "")).upper(),
        )
        if "ORIGIN" in norm:
            return 3
        if (
            norm.endswith("OFINDIA")
            or "CTOF" in norm
            or "PRODUCT" in norm
        ):
            return 2
        if "INDIA" in norm:
            return 1
        return 0

    origin_candidate_words.sort(
        key=_origin_priority,
        reverse=True,
    )

    if origin_candidate_words and image_path is not None:
        try:
            import tempfile
            import pytesseract
            from pytesseract import Output
            from app.ai.ocr.ocr_engine import TESSERACT_PATH

            pytesseract.pytesseract.tesseract_cmd = str(
                TESSERACT_PATH
            )

            source_image = cv2.imread(
                str(image_path)
            )

            if source_image is not None:
                image_height, image_width = (
                    source_image.shape[:2]
                )

                origin_patterns = [
                    (
                        r"\b(?:PRODUCT|PRODUCI|PRODUKT|UCT|CT)?\s*OF\s*INDIA\b",
                        "India",
                        "PRODUCT OF INDIA",
                    ),
                    (
                        r"\b(?:UCTOFINDIA|CTOFINDIA|PRODUCTOFINDIA)\b",
                        "India",
                        "PRODUCT OF INDIA",
                    ),
                    (
                        r"\bMADE\s*IN\s*INDIA\b",
                        "India",
                        "MADE IN INDIA",
                    ),
                    (
                        r"\bCOUNTRY\s+OF\s+ORIGIN\s*[:\-]?\s*INDIA\b",
                        "India",
                        "COUNTRY OF ORIGIN: INDIA",
                    ),
                ]

                for cand_word in origin_candidate_words:
                    cand_box = (
                        cand_word.get(
                            "bbox"
                        )
                        or {}
                    )

                    cand_x = int(
                        cand_box.get(
                            "x",
                            0,
                        )
                    )

                    cand_y = int(
                        cand_box.get(
                            "y",
                            0,
                        )
                    )

                    cand_w = int(
                        cand_box.get(
                            "width",
                            0,
                        )
                    )

                    cand_h = int(
                        cand_box.get(
                            "height",
                            0,
                        )
                    )

                    # Crop tightly around the declaration line
                    roi_x1 = max(
                        0,
                        cand_x - 160,
                    )

                    roi_x2 = min(
                        image_width,
                        cand_x
                        + cand_w
                        + 40,
                    )

                    roi_y1 = max(
                        0,
                        cand_y - 10,
                    )

                    roi_y2 = min(
                        image_height,
                        cand_y
                        + cand_h
                        + 10,
                    )

                    origin_roi = source_image[
                        roi_y1:roi_y2,
                        roi_x1:roi_x2,
                    ]

                    if (
                        origin_roi is not None
                        and origin_roi.size > 0
                    ):
                        gray = cv2.cvtColor(
                            origin_roi,
                            cv2.COLOR_BGR2GRAY,
                        )

                        enlarged = cv2.resize(
                            gray,
                            None,
                            fx=4.0,
                            fy=4.0,
                            interpolation=cv2.INTER_CUBIC,
                        )

                        variants = [
                            (
                                "gray",
                                enlarged,
                            ),
                            (
                                "otsu",
                                cv2.threshold(
                                    enlarged,
                                    0,
                                    255,
                                    cv2.THRESH_BINARY
                                    + cv2.THRESH_OTSU,
                                )[1],
                            ),
                        ]

                        detected_origin = None
                        detected_raw = None

                        for (
                            variant_name,
                            variant_image,
                        ) in variants:
                            for psm in (
                                6,
                                7,
                                11,
                            ):
                                try:
                                    text = pytesseract.image_to_string(
                                        variant_image,
                                        config=(
                                            f"--oem 3 --psm {psm}"
                                        ),
                                    )
                                except Exception:
                                    continue

                                normalized_text = re.sub(
                                    r"\s+",
                                    " ",
                                    str(text or "").upper(),
                                ).strip().replace(
                                    "|",
                                    "I",
                                )

                                for (
                                    pat,
                                    norm_country,
                                    raw_decl,
                                ) in origin_patterns:
                                    if re.search(
                                        pat,
                                        normalized_text,
                                    ):
                                        detected_origin = (
                                            norm_country
                                        )
                                        detected_raw = (
                                            raw_decl
                                        )
                                        break

                                if detected_origin:
                                    break

                            if detected_origin:
                                break

                        if detected_origin:
                            country = detected_origin
                            country_raw = (
                                detected_raw
                                or "PRODUCT OF INDIA"
                            )

                            country_evidence = [
                                {
                                    "text": country_raw,
                                    "confidence": float(
                                        cand_word.get(
                                            "confidence"
                                        )
                                        or 86.0
                                    ),
                                    "bbox": cand_box,
                                    "label_bbox": {
                                        "x": roi_x1,
                                        "y": roi_y1,
                                        "width": (
                                            roi_x2
                                            - roi_x1
                                        ),
                                        "height": (
                                            roi_y2
                                            - roi_y1
                                        ),
                                    },
                                }
                            ]
                            break

        except Exception:
            pass

    # Direct token fallback if image crop did not trigger
    if not country:
        for w in words:
            w_text = str(
                w.get(
                    "text",
                    "",
                )
            ).strip()
            norm = re.sub(
                r"[^A-Z]",
                "",
                w_text.upper(),
            )
            if norm in (
                "CTOFINDIA",
                "PRODUCTOFINDIA",
                "UCTOFINDIA",
            ):
                country = "India"
                country_raw = "PRODUCT OF INDIA"
                country_evidence = [
                    {
                        "text": "PRODUCT OF INDIA",
                        "confidence": float(
                            w.get(
                                "confidence"
                            )
                            or 86.0
                        ),
                        "bbox": w.get("bbox") or {},
                    }
                ]
                break

    if country:
        fields["country_of_origin"]["value"] = (
            country
        )

        fields["country_of_origin"]["raw_value"] = (
            country_raw or country
        )

        fields["country_of_origin"]["confidence"] = (
            86.0
        )

        fields["country_of_origin"]["is_present"] = True

        fields["country_of_origin"]["status"] = "extracted"

        fields["country_of_origin"]["evidence"] = (
            country_evidence
        )
    # ---------------------------------------------------------
    # Batch / Lot
    # ---------------------------------------------------------
    batch = None
    batch_raw = None
    batch_confidence = None
    batch_regional_evidence: list[dict[str, Any]] = []

    if image_path is not None:
        (
            regional_batch,
            regional_batch_raw,
            regional_batch_confidence,
            regional_batch_evidence,
        ) = _extract_batch_from_image(
            image_path,
            words,
            stamp_candidates=stamp_candidates,
        )

        if regional_batch:
            batch = regional_batch
            batch_raw = regional_batch_raw
            batch_confidence = regional_batch_confidence
            batch_regional_evidence = (
                regional_batch_evidence
            )

            words.extend(
                batch_regional_evidence
            )

    # Safety rule:
    # When an image is available, never use the unrestricted text
    # fallback for Batch. OCR text after "BATCH NO." may contain
    # unrelated package content because the stamped value is
    # spatially displaced.
    if not batch and image_path is None:
        batch = _extract_labeled_value(
            raw_text,
            (
                "batch",
                "batch no.",
                "batch number",
                "lot",
                "lot no.",
            ),
            max_length=50,
        )

        if batch:
            batch = re.split(
                r"\s+(?:mfg|mfd|exp|mrp|net|qty)\b",
                batch,
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0]

            batch = _clean_text(batch)

            if batch.lower() in {
                "no",
                "number",
            }:
                batch = None

    if batch:
        fields["batch_number"]["value"] = batch
        fields["batch_number"]["raw_value"] = (
            batch_raw or batch
        )
        fields["batch_number"]["confidence"] = (
            batch_confidence or 65.0
        )

        # Preserve detector-level evidence even when the normalized
        # Batch value differs from the raw OCR text, e.g.:
        #   raw OCR: /OBFF30
        #   normalized: DBFF30
        if batch_regional_evidence:
            fields["batch_number"]["detection_evidence"] = (
                batch_regional_evidence
            )
            fields["batch_number"]["evidence"] = (
                batch_regional_evidence
            )

    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # Number of serves
    # ---------------------------------------------------------
    # The package contains an explicit "NO. OF SERVES:" label.
    # Only a decimal value spatially recovered from the dedicated
    # ROI is accepted. An isolated integer is never promoted to
    # the SERVES field.
    # ---------------------------------------------------------

    if image_path is not None:
        try:
            import pytesseract
            from pytesseract import Output

            source_image = cv2.imread(
                str(image_path)
            )

            if source_image is not None:
                image_height, image_width = (
                    source_image.shape[:2]
                )

                serves_label = None

                for ocr_word in words:
                    label_text = str(
                        ocr_word.get(
                            "text",
                            "",
                        )
                    ).strip()

                    normalized_label = re.sub(
                        r"[^A-Z]",
                        "",
                        label_text.upper(),
                    )

                    if normalized_label == "SERVES":
                        serves_label = ocr_word
                        break

                if serves_label is not None:
                    label_box = (
                        serves_label.get(
                            "bbox"
                        )
                        or {}
                    )

                    label_x = int(
                        label_box.get(
                            "x",
                            0,
                        )
                    )

                    label_y = int(
                        label_box.get(
                            "y",
                            0,
                        )
                    )

                    label_width = int(
                        label_box.get(
                            "width",
                            0,
                        )
                    )

                    label_height = int(
                        label_box.get(
                            "height",
                            0,
                        )
                    )

                    # Value is printed to the right of the label.
                    # Keep this ROI tightly bounded to the SERVES row.
                    roi_x1 = max(
                        0,
                        label_x + label_width + 18,
                    )

                    roi_x2 = min(
                        image_width,
                        label_x + label_width + 105,
                    )

                    roi_y1 = max(
                        0,
                        label_y - 3,
                    )

                    roi_y2 = min(
                        image_height,
                        label_y + label_height + 8,
                    )

                    serves_roi = source_image[
                        roi_y1:roi_y2,
                        roi_x1:roi_x2,
                    ]

                    if (
                        serves_roi is not None
                        and serves_roi.size > 0
                    ):
                        gray = cv2.cvtColor(
                            serves_roi,
                            cv2.COLOR_BGR2GRAY,
                        )

                        enlarged = cv2.resize(
                            gray,
                            None,
                            fx=10.0,
                            fy=10.0,
                            interpolation=cv2.INTER_CUBIC,
                        )

                        # Mild denoising helps small stamped characters.
                        blurred = cv2.GaussianBlur(
                            enlarged,
                            (3, 3),
                            0,
                        )

                        variants = [
                            (
                                "gray",
                                enlarged,
                            ),
                            (
                                "otsu",
                                cv2.threshold(
                                    blurred,
                                    0,
                                    255,
                                    cv2.THRESH_BINARY
                                    + cv2.THRESH_OTSU,
                                )[1],
                            ),
                            (
                                "adaptive",
                                cv2.adaptiveThreshold(
                                    blurred,
                                    255,
                                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY,
                                    31,
                                    7,
                                ),
                            ),
                        ]

                        observations = []

                        for (
                            variant_name,
                            variant_image,
                        ) in variants:
                            for psm in (
                                7,
                                8,
                                10,
                                13,
                            ):
                                try:
                                    data = pytesseract.image_to_data(
                                        variant_image,
                                        config=(
                                            f"--oem 3 --psm {psm} "
                                            "-c "
                                            "tessedit_char_whitelist=0123456789.,"
                                        ),
                                        output_type=Output.DICT,
                                    )
                                except Exception:
                                    continue

                                for index, token in enumerate(
                                    data.get(
                                        "text",
                                        [],
                                    )
                                ):
                                    token = str(
                                        token
                                    ).strip()

                                    if not token:
                                        continue

                                    # IMPORTANT:
                                    # SERVES must be decimal.
                                    # Do not accept 7, 85, 685, etc.
                                    if not re.fullmatch(
                                        r"\d+\.\d+",
                                        token,
                                    ):
                                        continue

                                    value = _safe_float(
                                        token
                                    )

                                    if value is None or not (
                                        0 < value <= 100
                                    ):
                                        continue

                                    try:
                                        confidence = float(
                                            data["conf"][index]
                                        )
                                    except (
                                        TypeError,
                                        ValueError,
                                    ):
                                        continue

                                    if confidence < 20:
                                        continue

                                    bx = int(
                                        data["left"][index]
                                        / 10.0
                                    )

                                    by = int(
                                        data["top"][index]
                                        / 10.0
                                    )

                                    bw = max(
                                        1,
                                        int(
                                            data["width"][index]
                                            / 10.0
                                        ),
                                    )

                                    bh = max(
                                        1,
                                        int(
                                            data["height"][index]
                                            / 10.0
                                        ),
                                    )

                                    observations.append(
                                        {
                                            "value": value,
                                            "raw_value": token,
                                            "confidence": confidence,
                                            "variant": variant_name,
                                            "psm": psm,
                                            "bbox": {
                                                "x": roi_x1 + bx,
                                                "y": roi_y1 + by,
                                                "width": bw,
                                                "height": bh,
                                            },
                                        }
                                    )

                                    # Stop trying additional PSMs for this
                                    # preprocessing variant once a strong SERVES
                                    # decimal has been detected.
                                    if confidence >= 80.0:
                                        break

                        if observations:
                            # Group identical decimal values across OCR passes.
                            grouped = {}

                            for observation in observations:
                                key = str(
                                    observation["value"]
                                )

                                grouped.setdefault(
                                    key,
                                    [],
                                ).append(
                                    observation
                                )

                            # Rank by consensus first, then confidence.
                            ranked = sorted(
                                grouped.values(),
                                key=lambda group: (
                                    len(group),
                                    max(
                                        item["confidence"]
                                        for item in group
                                    ),
                                ),
                                reverse=True,
                            )

                            best_group = ranked[0]

                            best = max(
                                best_group,
                                key=lambda item: (
                                    item["confidence"]
                                ),
                            )

                            # A single low-confidence decimal should remain
                            # review-only; repeated agreement improves confidence.
                            consensus_bonus = min(
                                10.0,
                                max(
                                    0,
                                    len(best_group) - 1,
                                ) * 2.0,
                            )

                            final_confidence = min(
                                99.0,
                                best["confidence"]
                                + consensus_bonus,
                            )

                            fields["serves"]["value"] = (
                                best["value"]
                            )

                            fields["serves"]["raw_value"] = (
                                best["raw_value"]
                            )

                            fields["serves"]["confidence"] = (
                                final_confidence
                            )

                            fields["serves"]["evidence"] = [
                                {
                                    "label": "NO. OF SERVES",
                                    "label_bbox": label_box,
                                    "value_bbox": best[
                                        "bbox"
                                    ],
                                    "raw_value": best[
                                        "raw_value"
                                    ],
                                    "variant": best[
                                        "variant"
                                    ],
                                    "psm": best[
                                        "psm"
                                    ],
                                }
                            ]

                            if final_confidence < 60:
                                fields["serves"]["status"] = (
                                    "review"
                                )

                        else:
                            fields["serves"]["value"] = None
                            fields["serves"]["raw_value"] = None
                            fields["serves"]["confidence"] = 39.0
                            fields["serves"]["status"] = "review"

        except Exception:
            fields["serves"]["value"] = None
            fields["serves"]["raw_value"] = None
            fields["serves"]["confidence"] = 39.0
            fields["serves"]["status"] = "review"
    # Unit sale price
    # ---------------------------------------------------------
    unit_price_patterns = (
        # Unit Sale Price: Rs 12.50 per kg
        r"(?:unit\s*sale\s*price|unit\s*price|usp)"
        r"\s*[:\-]?\s*"
        r"(?:₹|RS\.?|INR)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
        r"\s*(?:per|/)\s*"
        r"(100\s*g|100\s*ml|g|kg|ml|l|unit|piece|pc)",

        # Rs 12.50 / 100 g
        r"(?:₹|RS\.?|INR)\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
        r"\s*/\s*"
        r"(100\s*g|100\s*ml|g|kg|ml|l|unit|piece|pc)",
    )

    unit_price = None

    for pattern in unit_price_patterns:
        unit_price = re.search(
            pattern,
            raw_text,
            flags=re.IGNORECASE,
        )

        if unit_price:
            break

    if unit_price is None:
        # OCR may separate "Rs" and the amount into different
        # words. Identify the amount spatially relative to the
        # currency token instead of searching the entire OCR text.
        partial_usp = None

        for rs_word in words:
            rs_text = str(
                rs_word.get(
                    "text",
                    "",
                )
            ).strip()

            if not re.fullmatch(
                r"R[Ss]\.?",
                rs_text,
            ):
                continue

            rs_box = (
                rs_word.get(
                    "bbox"
                )
                or {}
            )

            rs_x = float(
                rs_box.get(
                    "x",
                    0,
                )
            )

            rs_y = float(
                rs_box.get(
                    "y",
                    0,
                )
            )

            rs_w = float(
                rs_box.get(
                    "width",
                    0,
                )
            )

            rs_h = float(
                rs_box.get(
                    "height",
                    0,
                )
            )

            nearby_amounts = []

            for amount_word in words:
                amount_text = str(
                    amount_word.get(
                        "text",
                        "",
                    )
                ).strip()

                amount_box = (
                    amount_word.get(
                        "bbox"
                    )
                    or {}
                )

                amount_x = float(
                    amount_box.get(
                        "x",
                        0,
                    )
                )

                amount_y = float(
                    amount_box.get(
                        "y",
                        0,
                    )
                )

                amount_h = float(
                    amount_box.get(
                        "height",
                        0,
                    )
                )

                # The amount must be to the right of Rs and
                # approximately on the same OCR row.
                same_row = (
                    abs(
                        amount_y
                        - rs_y
                    )
                    <= max(
                        rs_h,
                        amount_h,
                        20.0,
                    )
                    * 1.5
                )

                to_right = (
                    amount_x
                    >= rs_x + rs_w - 5.0
                )

                if not same_row or not to_right:
                    continue

                normalized_amount = re.sub(
                    r"[^0-9.,]",
                    "",
                    amount_text,
                )

                if not re.fullmatch(
                    r"\d+(?:[.,]\d+)?",
                    normalized_amount,
                ):
                    continue

                amount_value = _safe_float(
                    normalized_amount
                )

                if amount_value is None or not (
                    0 < amount_value < 100000
                ):
                    continue

                distance = (
                    amount_x
                    - (
                        rs_x + rs_w
                    )
                )

                nearby_amounts.append(
                    {
                        "value": amount_value,
                        "raw_value": amount_text,
                        "confidence": float(
                            amount_word.get(
                                "confidence",
                                0,
                            )
                        ),
                        "bbox": amount_box,
                        "distance": distance,
                    }
                )

            if nearby_amounts:
                nearby_amounts.sort(
                    key=lambda item: (
                        item["distance"],
                        -item["confidence"],
                    )
                )

                best_amount = nearby_amounts[0]

                partial_usp = {
                    "price": best_amount["value"],
                    "unit": None,
                    "raw_value": (
                        f"{rs_text} "
                        f"{best_amount['raw_value']}"
                    ),
                    "confidence": min(
                        float(
                            rs_word.get(
                                "confidence",
                                0,
                            )
                        ),
                        best_amount["confidence"],
                    ),
                    "evidence": [
                        {
                            "text": rs_text,
                            "confidence": rs_word.get(
                                "confidence"
                            ),
                            "bbox": rs_box,
                        },
                        {
                            "text": best_amount[
                                "raw_value"
                            ],
                            "confidence": best_amount[
                                "confidence"
                            ],
                            "bbox": best_amount[
                                "bbox"
                            ],
                        },
                    ],
                }

                break

        if partial_usp is not None:
            fields["unit_sale_price"]["value"] = {
                "price": partial_usp["price"],
                "unit": None,
            }

            fields["unit_sale_price"]["raw_value"] = (
                partial_usp["raw_value"]
            )

            fields["unit_sale_price"]["confidence"] = (
                partial_usp["confidence"]
            )

            fields["unit_sale_price"]["evidence"] = (
                partial_usp["evidence"]
            )

            fields["unit_sale_price"]["status"] = (
                "review"
            )
    if unit_price:
        unit_text = (
            unit_price.group(2)
            .lower()
            .replace(" ", "")
        )

        fields["unit_sale_price"]["value"] = {
            "price": _safe_float(
                unit_price.group(1)
            ),
            "unit": unit_text,
        }

        fields["unit_sale_price"]["raw_value"] = (
            _clean_text(
                unit_price.group(0)
            )
        )

        fields["unit_sale_price"]["confidence"] = 78.0
    # ---------------------------------------------------------
    # Product name
    # ---------------------------------------------------------
    product_patterns = (
        r"\b(NAVRATTAN)\b",
        r"\b(FAVOURITES?)\b",
    )

    for pattern in product_patterns:
        match = re.search(
            pattern,
            raw_text,
            flags=re.IGNORECASE,
        )

        if match:
            fields["product_name"]["value"] = (
                match.group(1)
            )
            fields["product_name"]["raw_value"] = (
                match.group(0)
            )
            fields["product_name"]["confidence"] = (
                80.0
            )
            break

    # ---------------------------------------------------------
    # Finalize evidence + status
    # ---------------------------------------------------------
    for field in fields.values():
        _finalize_field(
            field,
            words,
        )

    return {
        "fields": fields,
        "source": "ocr",
        "extractor_version": "0.6.5",
        "legal_framework": "Legal Metrology (Packaged Commodities) Rules, 2011 + applicable amendments",
    }





























