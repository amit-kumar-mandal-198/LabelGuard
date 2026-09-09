import json
from pathlib import Path
from typing import Any

import cv2
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.ai.extraction.declaration_extractor import extract_declarations
from app.ai.ocr.ocr_engine import run_ocr
from app.ai.preprocessing.orientation_detector import (
    detect_best_orientation,
    rotate_image,
)
from app.models.declaration import Declaration
from app.models.inspection_image import InspectionImage


OCR_PSMS = (6, 11)

PROCESSED_DIR = (
    Path(__file__).resolve().parents[2]
    / "storage"
    / "processed"
)


def _safe_value(value: Any) -> str | None:
    if value is None:
        return None

    if isinstance(value, (dict, list)):
        return str(value)

    return str(value)


def _candidate_score(field: dict[str, Any]) -> float:
    value = field.get("value")

    if value is None:
        return 0.0

    confidence = float(
        field.get("confidence") or 0.0
    )

    status = str(
        field.get("status") or ""
    ).lower()

    score = confidence

    if status == "extracted":
        score += 20.0

    if status == "review":
        score -= 10.0

    if field.get("evidence"):
        score += 5.0

    if field.get("detection_evidence"):
        score += 5.0

    # Image-aware regional evidence is more trustworthy than noisy
    # full-image OCR for Batch/Lot extraction. Keep this field-specific
    # so other declarations retain their existing scoring behavior.
    if (
        field.get("field_name") == "batch_number"
        and field.get("detection_evidence")
    ):
        score += 100.0

    return score


def _merge_field_candidates(
    candidates: dict[str, list[dict[str, Any]]],
) -> dict[str, dict[str, Any]]:

    merged: dict[str, dict[str, Any]] = {}

    for field_name, field_candidates in candidates.items():

        if not field_candidates:
            continue

        best = max(
            field_candidates,
            key=_candidate_score,
        )

        merged[field_name] = best

    return merged


def _extraction_quality(
    fields: dict[str, Any],
) -> float:
    """
    Estimate extraction quality for deciding whether another
    full-image OCR pass is justified.
    """
    quality = 0.0

    for field in fields.values():
        if not isinstance(field, dict):
            continue

        value = field.get("value")
        if value is None:
            continue

        confidence = float(
            field.get("confidence") or 0.0
        )

        status = str(
            field.get("status") or ""
        ).lower()

        quality += confidence

        if status == "extracted":
            quality += 25.0
        elif status == "review":
            quality -= 10.0

        if field.get("evidence"):
            quality += 5.0

        if field.get("detection_evidence"):
            quality += 5.0

    return quality


def _needs_ocr_fallback(
    fields: dict[str, Any],
) -> bool:
    """
    Decide whether the primary OCR pass is weak enough to justify
    another complete OCR/extraction pass.
    """
    meaningful = 0
    weak_important = 0

    important_fields = {
        "mrp",
        "net_quantity",
        "manufacturing_date",
        "manufacturer",
        "consumer_care",
        "batch_number",
    }

    for field_name, field in fields.items():
        if not isinstance(field, dict):
            continue

        value = field.get("value")
        status = str(
            field.get("status") or ""
        ).lower()
        confidence = float(
            field.get("confidence") or 0.0
        )

        if value is not None:
            meaningful += 1

        if field_name in important_fields:
            if (
                value is None
                or status == "review"
                or confidence < 70.0
            ):
                weak_important += 1

    if meaningful < 5:
        return True

    if weak_important >= 2:
        return True

    return False


def _save_oriented_image(
    image_path: Path,
    angle: int,
    inspection_id: int,
    image_id: int,
) -> Path:

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    image = cv2.imread(
        str(image_path)
    )

    if image is None:
        raise ValueError(
            f"Unable to load image: {image_path}"
        )

    rotated = rotate_image(
        image,
        angle,
    )

    output_path = (
        PROCESSED_DIR
        / (
            f"inspection_{inspection_id}"
            f"_image_{image_id}"
            f"_rot_{angle}.png"
        )
    )

    if not cv2.imwrite(
        str(output_path),
        rotated,
    ):
        raise RuntimeError(
            f"Failed to save processed image: "
            f"{output_path}"
        )

    return output_path


def _persist_declaration(
    db: Session,
    inspection_id: int,
    field_name: str,
    field: dict[str, Any],
) -> Declaration:

    extracted_value = _safe_value(
        field.get("raw_value")
    )

    normalized_value = _safe_value(
        field.get("value")
    )

    confidence = field.get(
        "confidence"
    )

    is_present = bool(
        field.get("value") is not None
        and field.get("status") != "not_found"
    )

    declaration = Declaration(
        inspection_id=inspection_id,
        field_name=field_name,
        extracted_value=extracted_value,
        normalized_value=normalized_value,
        is_present=is_present,
        confidence=(
            float(confidence)
            if confidence is not None
            else None
        ),
    )

    db.add(declaration)

    return declaration


def analyze_inspection(
    db: Session,
    inspection_id: int,
) -> dict[str, Any]:

    statement = (
        select(InspectionImage)
        .where(
            InspectionImage.inspection_id == inspection_id
        )
        .order_by(
            InspectionImage.created_at.asc()
        )
    )

    images = list(
        db.scalars(statement).all()
    )

    if not images:
        raise ValueError(
            f"No images found for inspection {inspection_id}"
        )

    # Replace previous generated declarations.
    db.execute(
        delete(Declaration).where(
            Declaration.inspection_id == inspection_id
        )
    )

    db.flush()

    candidates: dict[
        str,
        list[dict[str, Any]]
    ] = {}

    image_results = []

    for image in images:

        original_path = Path(
            image.file_path
        )

        if not original_path.exists():
            raise FileNotFoundError(
                f"Image file not found: {original_path}"
            )

        # -----------------------------------------------------
        # 1. Detect best orientation
        # -----------------------------------------------------
        orientation = detect_best_orientation(
            original_path
        )

        best_angle = int(
            orientation["best_angle"]
        )

        orientation_score = float(
            orientation["score"]
        )

        processed_path = _save_oriented_image(
            image_path=original_path,
            angle=best_angle,
            inspection_id=inspection_id,
            image_id=image.id,
        )

        image_results.append(
            {
                "image_id": image.id,
                "image_type": image.image_type,
                "original_path": str(original_path),
                "processed_path": str(processed_path),
                "best_orientation": best_angle,
                "orientation_score": orientation_score,
                "orientation_candidates": orientation[
                    "candidates"
                ],
                "psm_runs": list(OCR_PSMS),
            }
        )

        # -----------------------------------------------------
        # 2. Adaptive OCR on corrected image
        # -----------------------------------------------------
        image_psm_used = []

        for psm in OCR_PSMS:

            ocr_result = run_ocr(
                image_path=processed_path,
                psm=psm,
            )

            image_psm_used.append(psm)

            # Image-aware detectors are expensive and independent of the
            # full-image PSM. Run them only once on the primary PSM.
            # Fallback PSMs contribute text-only evidence and are merged
            # with the primary image-aware extraction.
            extraction_result = extract_declarations(
                ocr_result=ocr_result,
                image_path=(
                    processed_path
                    if psm == OCR_PSMS[0]
                    else None
                ),
                # processed_path is already rotated into the detected
                # best orientation, so the MRP detector must treat it as
                # orientation 0 rather than rotating it again.
                orientation_hint=(
                    0
                    if psm == OCR_PSMS[0]
                    else None
                ),
            )

            fields = extraction_result.get(
                "fields",
                {},
            )

            for field_name, field in fields.items():

                if not isinstance(field, dict):
                    continue

                candidate = dict(field)

                candidate["_image_id"] = image.id
                candidate["_image_type"] = image.image_type
                candidate["_psm"] = psm
                candidate["_orientation"] = best_angle
                candidate["_processed_path"] = str(
                    processed_path
                )

                candidates.setdefault(
                    field_name,
                    [],
                ).append(candidate)

            current_quality = _extraction_quality(
                fields
            )

            # PSM 6 is the normal primary pass. If it already
            # provides a strong extraction, avoid repeating the
            # entire declaration-extraction pipeline.
            if (
                psm == OCR_PSMS[0]
                and not _needs_ocr_fallback(fields)
            ):
                break

            # After PSM 11, stop if the extraction is now strong.
            if (
                psm == OCR_PSMS[1]
                and current_quality >= 150.0
                and not _needs_ocr_fallback(fields)
            ):
                break

        image_results[-1]["psm_runs"] = image_psm_used

    # ---------------------------------------------------------
    # 3. Best candidate per logical field
    # ---------------------------------------------------------
    merged_fields = _merge_field_candidates(
        candidates
    )

    persisted = 0

    for field_name, field in merged_fields.items():

        _persist_declaration(
            db=db,
            inspection_id=inspection_id,
            field_name=field_name,
            field=field,
        )

        persisted += 1

    # ---------------------------------------------------------
    # 4. Legibility assessment from existing evidence
    # ---------------------------------------------------------
    legibility_field = _compute_legibility(
        merged_fields
    )

    _persist_declaration(
        db=db,
        inspection_id=inspection_id,
        field_name="declaration_legibility",
        field=legibility_field,
    )

    persisted += 1

    # ---------------------------------------------------------
    # 5. Date-sensitive commodity assessment for LG-BBE rule
    # ---------------------------------------------------------
    date_sensitive_field = _compute_date_sensitive_commodity(
        merged_fields
    )

    if date_sensitive_field.get("value") is not None:
        _persist_declaration(
            db=db,
            inspection_id=inspection_id,
            field_name="date_sensitive_commodity",
            field=date_sensitive_field,
        )
        persisted += 1

    # ---------------------------------------------------------
    # 6. Import status assessment for LG-COO rule
    # ---------------------------------------------------------
    imported_field = _compute_imported_status(
        merged_fields
    )

    if imported_field.get("value") is not None:
        _persist_declaration(
            db=db,
            inspection_id=inspection_id,
            field_name="imported",
            field=imported_field,
        )
        persisted += 1

    db.commit()

    return {
        "inspection_id": inspection_id,
        "images_processed": len(images),
        "psms_used": list(OCR_PSMS),
        "candidate_count": sum(
            len(items)
            for items in candidates.values()
        ),
        "declarations_persisted": persisted,
        "images": image_results,
        "legibility": legibility_field,
        "date_sensitive_commodity": date_sensitive_field,
        "imported": imported_field,
        "fields": {
            field_name: {
                "value": field.get("value"),
                "raw_value": field.get("raw_value"),
                "confidence": field.get("confidence"),
                "status": field.get("status"),
                "image_id": field.get("_image_id"),
                "image_type": field.get("_image_type"),
                "psm": field.get("_psm"),
                "orientation": field.get(
                    "_orientation"
                ),
            }
            for field_name, field in merged_fields.items()
        },
    }


# ---------------------------------------------------------------------------
# Legibility computation
# ---------------------------------------------------------------------------

# Mandatory declarations that a readable label must expose.
_REQUIRED_LEGIBILITY_FIELDS: tuple[str, ...] = (
    "mrp",
    "net_quantity",
    "manufacturing_date",
    "manufacturer",
    "consumer_care",
)

# Confidence threshold below which a found field is considered low-quality.
_LOW_CONFIDENCE_THRESHOLD: float = 40.0

# Score thresholds that drive the legibility verdict.
_PASS_SCORE: float = 70.0
_REVIEW_SCORE: float = 40.0


def _compute_legibility(
    merged_fields: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """
    Derive a legibility assessment from the already-merged declaration
    candidates.  No additional OCR pass is performed.

    Scoring (max 100):
      - Each required field that is present and not status="not_found":
          +15 points if confidence >= _LOW_CONFIDENCE_THRESHOLD
          + 7 points if present but confidence < threshold (partial credit)
      - Average OCR confidence of all found fields (weighted 0–25):
          added as avg_confidence * 0.25

    Verdict:
      score >= _PASS_SCORE   → "pass"
      score >= _REVIEW_SCORE → "review"
      otherwise              → "fail"
    """
    evidence: list[dict[str, Any]] = []
    score: float = 0.0
    confidence_values: list[float] = []

    for field_name in _REQUIRED_LEGIBILITY_FIELDS:
        field = merged_fields.get(field_name)

        if field is None:
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": 0,
                    "reason": "missing",
                }
            )
            continue

        value = field.get("value")
        status = str(field.get("status") or "").lower()
        confidence = float(field.get("confidence") or 0.0)

        if value is None or status == "not_found":
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": round(confidence, 2),
                    "reason": "not_found",
                }
            )
            continue

        confidence_values.append(confidence)

        if confidence >= _LOW_CONFIDENCE_THRESHOLD:
            score += 15.0
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": round(confidence, 2),
                    "reason": "readable",
                }
            )
        else:
            score += 7.0
            evidence.append(
                {
                    "field_name": field_name,
                    "confidence": round(confidence, 2),
                    "reason": "low_confidence",
                }
            )

    # Also gather confidence from all other found fields.
    for field_name, field in merged_fields.items():
        if field_name in _REQUIRED_LEGIBILITY_FIELDS:
            continue

        if not isinstance(field, dict):
            continue

        value = field.get("value")
        confidence = float(field.get("confidence") or 0.0)

        if value is not None and confidence > 0:
            confidence_values.append(confidence)

    avg_confidence = (
        sum(confidence_values) / len(confidence_values)
        if confidence_values
        else 0.0
    )

    # Blend average OCR confidence into overall score (up to 25 bonus pts).
    score += avg_confidence * 0.25
    score = min(score, 100.0)

    if score >= _PASS_SCORE:
        verdict = "pass"
    elif score >= _REVIEW_SCORE:
        verdict = "review"
    else:
        verdict = "fail"

    legibility_payload = {
        "status": verdict,
        "score": round(score, 2),
        "avg_ocr_confidence": round(avg_confidence, 2),
        "evidence": evidence,
    }

    return {
        "value": verdict,
        "raw_value": json.dumps(legibility_payload, ensure_ascii=True),
        "confidence": round(score, 2),
        "status": "extracted",
    }


# ---------------------------------------------------------------------------
# Date-sensitive commodity computation
# ---------------------------------------------------------------------------

def _compute_date_sensitive_commodity(
    merged_fields: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """
    Determine whether the commodity is date-sensitive (perishable / food item)
    under Legal Metrology Packaged Commodities Rule 6(1)(d)/(g) and FSSAI norms.

    Derives the signal entirely from already-extracted declarations and evidence
    without running any additional OCR passes.
    """
    import re

    combined_texts: list[str] = []
    for field in merged_fields.values():
        if not isinstance(field, dict):
            continue
        val = str(field.get("value") or "")
        raw = str(field.get("raw_value") or "")
        if val:
            combined_texts.append(val)
        if raw and raw != val:
            combined_texts.append(raw)

    blob = " ".join(combined_texts).upper()

    food_evidence: list[str] = []

    # 1. Product name / generic commodity
    product_name = str(merged_fields.get("product_name", {}).get("value") or "").upper()
    if re.search(r"\b(?:NAVRATTAN|NAMKEEN|BHUJIA|SNACKS?|CHIPS|BISCUIT|COOKIE|NOODLE|PASTA|SWEET|CHOCOLATE|JUICE|SAUCE|PICKLE|TEA|COFFEE|RICE|DAL|FLOUR|ATTA|OIL|SPICE|MASALA)\b", product_name):
        food_evidence.append(f"Food commodity product name: {product_name}")

    # 2. Manufacturer name / brand
    mfr_name = str(merged_fields.get("manufacturer", {}).get("value") or "").upper()
    if re.search(r"\b(?:SNACKS?|FOODS?|CONFECTIONERY|BEVERAGES?|BAKERY|DAIRY|BREWERY|AGRO)\b", mfr_name):
        food_evidence.append(f"Food manufacturer/packer: {mfr_name}")

    # 3. Regulatory marks (FSSAI)
    if "FSSAI" in blob or re.search(r"\bLIC\.?\s*NO\.?\s*\d{10,14}\b", blob):
        food_evidence.append("FSSAI food safety license identified")

    # 4. Storage instructions commonly used for perishables
    if re.search(r"\b(?:COOL\s*(?:&|AND)?\s*DRY\s*PLACE|ONCE\s*OPENED|AIRTIGHT\s*CONTAINER|REFRIGERATE|PERISHABLE)\b", blob):
        food_evidence.append("Perishable food storage instructions identified")

    # 5. Nutrition / Ingredients
    if re.search(r"\b(?:NUTRITION|NUTRITIONAL|PROTEIN|CARBOHYDRATE|CALORIES|KCAL|SUGARS?|FAT|INGREDIENTS?)\b", blob):
        food_evidence.append("Nutritional / ingredient declaration identified")

    # 6. Expiry / Best-Before presence is itself definitive proof of date-sensitivity
    has_bbe = bool(
        (merged_fields.get("best_before", {}).get("value"))
        or (merged_fields.get("expiry_date", {}).get("value"))
    )
    if has_bbe:
        food_evidence.append("Explicit best-before or use-by date present on package")

    if food_evidence:
        return {
            "value": "true",
            "raw_value": "true",
            "confidence": 95.0,
            "status": "extracted",
            "evidence": food_evidence,
        }

    # Explicit non-food signals
    non_food_terms = re.search(r"\b(?:BATTERY|ELECTRONIC|CABLE|CHARGER|SHIRT|GARMENT|STATIONERY|HARDWARE|PLASTIC\s*WARE|TOY|TIRE|TYRE)\b", blob)
    if non_food_terms:
        return {
            "value": "false",
            "raw_value": "false",
            "confidence": 90.0,
            "status": "extracted",
            "evidence": ["Identified as non-food/non-date-sensitive commodity"],
        }

    # Ambiguous / insufficient evidence
    return {
        "value": None,
        "raw_value": None,
        "confidence": None,
        "status": "not_found",
        "evidence": ["Insufficient evidence to determine commodity date-sensitivity"],
    }


def _compute_imported_status(
    merged_fields: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """
    Assess whether the packaged commodity is imported into India.

    Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(aa):
    Country of origin declaration is mandatory for imported products.

    Inference principles:
    1. Importer declaration present -> imported = "true"
    2. Country of Origin explicitly declared as a foreign country -> imported = "true"
    3. Country of Origin explicitly declared as India (e.g. "Product of India", "Made in India")
       -> imported = "false"
    4. In the absence of an explicit importer or COO declaration, do NOT guess or infer
       origin merely from domestic manufacturer name, brand, FSSAI, or address.
       Return value=None (status="not_found") so that officers can evaluate applicability.
    """
    importer = merged_fields.get("importer", {})
    if importer.get("value"):
        return {
            "value": "true",
            "raw_value": str(
                importer.get("raw_value")
                or importer.get("value")
            ),
            "confidence": float(
                importer.get("confidence") or 85.0
            ),
            "status": "extracted",
            "evidence": [
                "Importer declaration identified on package"
            ],
        }

    coo = merged_fields.get("country_of_origin", {})
    coo_val = str(coo.get("value") or "").strip().lower()
    coo_raw = str(coo.get("raw_value") or "").strip().upper()

    if coo_val:
        if coo_val in ("india", "in") or "INDIA" in coo_raw:
            return {
                "value": "false",
                "raw_value": "false",
                "confidence": float(
                    coo.get("confidence") or 86.0
                ),
                "status": "extracted",
                "evidence": [
                    f"Package explicitly declares domestic origin: {coo.get('raw_value') or coo.get('value')}"
                ],
            }
        else:
            return {
                "value": "true",
                "raw_value": "true",
                "confidence": float(
                    coo.get("confidence") or 86.0
                ),
                "status": "extracted",
                "evidence": [
                    f"Package explicitly declares foreign origin: {coo.get('raw_value') or coo.get('value')}"
                ],
            }

    # If neither importer nor COO is declared, do not infer domestic or imported status
    return {
        "value": None,
        "raw_value": None,
        "confidence": None,
        "status": "not_found",
        "evidence": [
            "Insufficient evidence to determine import status without importer or origin declaration"
        ],
    }

