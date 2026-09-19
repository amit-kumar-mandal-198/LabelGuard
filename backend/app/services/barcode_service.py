
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import cv2

from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.barcode_repository import (
    create_barcode,
    get_barcode_by_value,
    list_product_barcodes,
)


class BarcodeService:
    """Detect and decode barcodes from product images."""

    def __init__(self) -> None:
        self.detector = cv2.barcode.BarcodeDetector()

    @staticmethod
    def _normalize_value(value: str | None) -> str | None:
        if value is None:
            return None

        normalized = "".join(
            character
            for character in str(value).strip()
            if character.isalnum()
        )

        return normalized or None

    @staticmethod
    def _barcode_type(decoded_type: str | None, value: str) -> str:
        if decoded_type:
            return str(decoded_type).upper()

        if len(value) == 13 and value.isdigit():
            return "EAN-13"

        if len(value) == 8 and value.isdigit():
            return "EAN-8"

        return "UNKNOWN"

    def detect(self, image_path: str | Path) -> dict[str, Any]:
        """
        Detect and decode barcodes from product images.

        Full-image detection is attempted first. Because packaged
        product labels can contain dense OCR/text content, a dedicated
        lower barcode region is also tested with multiple preprocessing
        and rotation variants.
        """

        path = Path(image_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Barcode image not found: {path}"
            )

        image = cv2.imread(str(path))

        if image is None:
            raise ValueError(
                f"Unable to read barcode image: {path}"
            )

        height, width = image.shape[:2]

        regions: list[
            tuple[str, Any, int, int]
        ] = [
            (
                "full",
                image,
                0,
                0,
            ),
            (
                "lower_barcode",
                image[
                    int(height * 0.74):int(height * 0.99),
                    0:int(width * 0.52),
                ],
                0,
                int(height * 0.74),
            ),
        ]

        attempts: list[dict[str, Any]] = []

        for region_name, region, offset_x, offset_y in regions:
            if region is None or region.size == 0:
                continue

            gray = (
                cv2.cvtColor(
                    region,
                    cv2.COLOR_BGR2GRAY,
                )
                if len(region.shape) == 3
                else region
            )

            upscaled = cv2.resize(
                gray,
                None,
                fx=3.0,
                fy=3.0,
                interpolation=cv2.INTER_CUBIC,
            )

            variants = [
                (
                    "original",
                    region,
                    1.0,
                ),
                (
                    "gray",
                    gray,
                    1.0,
                ),
                (
                    "upscaled",
                    upscaled,
                    3.0,
                ),
                (
                    "rotated90",
                    cv2.rotate(
                        region,
                        cv2.ROTATE_90_COUNTERCLOCKWISE,
                    ),
                    1.0,
                ),
                (
                    "rotated180",
                    cv2.rotate(
                        region,
                        cv2.ROTATE_180,
                    ),
                    1.0,
                ),
            ]

            for variant_name, variant, scale in variants:
                try:
                    ok, decoded, decoded_types, points = (
                        self.detector.detectAndDecodeWithType(
                            variant
                        )
                    )
                except Exception:
                    continue

                if not ok or not decoded:
                    continue

                for index, raw_value in enumerate(decoded):
                    value = self._normalize_value(
                        raw_value
                    )

                    if not value:
                        continue

                    bbox = None

                    if points is not None:
                        try:
                            import numpy as np

                            point_array = np.asarray(
                                points
                            )

                            # OpenCV may return:
                            #   (1, 4, 2)
                            #   (4, 2)
                            # or another equivalent shape.
                            point_array = point_array.reshape(
                                -1,
                                2,
                            )

                            if len(point_array) >= 4:
                                transformed_points = []

                                for point in point_array[:4]:
                                    px = float(point[0])
                                    py = float(point[1])

                                    px /= scale
                                    py /= scale

                                    if variant_name == "rotated90":
                                        region_h, region_w = region.shape[:2]
                                        old_x = py
                                        old_y = region_w - px
                                        px = old_x
                                        py = old_y

                                    elif variant_name == "rotated180":
                                        region_h, region_w = region.shape[:2]
                                        px = region_w - px
                                        py = region_h - py

                                    transformed_points.append(
                                        [
                                            round(
                                                px + offset_x,
                                                2,
                                            ),
                                            round(
                                                py + offset_y,
                                                2,
                                            ),
                                        ]
                                    )

                                bbox = transformed_points

                        except (
                            IndexError,
                            TypeError,
                            ValueError,
                            AttributeError,
                        ):
                            bbox = None

                    detected_type = None

                    if decoded_types is not None:
                        try:
                            candidate_type = decoded_types[index]

                            # OpenCV may return a NumPy array/object
                            # rather than a plain string.
                            if isinstance(
                                candidate_type,
                                str,
                            ):
                                detected_type = candidate_type

                            elif hasattr(
                                candidate_type,
                                "item",
                            ):
                                scalar = candidate_type.item()

                                if isinstance(
                                    scalar,
                                    str,
                                ):
                                    detected_type = scalar

                            else:
                                detected_type = str(
                                    candidate_type
                                )

                        except (
                            IndexError,
                            TypeError,
                            ValueError,
                        ):
                            detected_type = None

                    barcode_type = (
                        str(detected_type).upper()
                        if isinstance(
                            detected_type,
                            str,
                        ) and detected_type.strip()
                        else self._barcode_type(
                            None,
                            value,
                        )
                    )

                    base_confidence = (
                        96.0
                        if region_name == "lower_barcode"
                        and variant_name in {
                            "original",
                            "gray",
                        }
                        else 92.0
                    )

                    attempts.append(
                        {
                            "barcode_value": value,
                            "barcode_type": barcode_type,
                            "region": region_name,
                            "variant": variant_name,
                            "confidence": base_confidence,
                            "bbox": bbox,
                        }
                    )

        if not attempts:
            return {
                "status": "not_found",
                "barcode_value": None,
                "barcode_type": None,
                "confidence": None,
                "bbox": None,
                "attempts": [],
            }

        grouped: dict[
            str,
            list[dict[str, Any]],
        ] = {}

        for attempt in attempts:
            grouped.setdefault(
                attempt["barcode_value"],
                [],
            ).append(attempt)

        ranked = sorted(
            grouped.items(),
            key=lambda item: (
                len(item[1]),
                max(
                    result["confidence"]
                    for result in item[1]
                ),
            ),
            reverse=True,
        )

        best_value, observations = ranked[0]

        best_observation = max(
            observations,
            key=lambda item: item["confidence"],
        )

        confidence = min(
            99.0,
            best_observation["confidence"]
            + min(
                3.0,
                max(
                    0,
                    len(observations) - 1,
                ),
            ),
        )

        return {
            "status": "decoded",
            "barcode_value": best_value,
            "barcode_type": best_observation[
                "barcode_type"
            ],
            "confidence": round(
                confidence,
                2,
            ),
            "bbox": best_observation[
                "bbox"
            ],
            "region": best_observation[
                "region"
            ],
            "variant": best_observation[
                "variant"
            ],
            "observations": observations,
        }
    def save_barcode(
        self,
        db: Session,
        product_id: int,
        barcode_value: str,
        barcode_type: str | None = None,
        source_type: str | None = None,
        source_reference: str | None = None,
    ):
        existing = get_barcode_by_value(
            db=db,
            barcode_value=barcode_value,
        )

        if existing is not None:
            if existing.product_id != product_id:
                raise ValueError(
                    "Barcode is already mapped to another product."
                )
            return existing

        return create_barcode(
            db=db,
            data={
                "product_id": product_id,
                "barcode_value": barcode_value,
                "barcode_type": barcode_type,
                "source_type": source_type,
                "source_reference": source_reference,
            },
        )

    def lookup_product(
        self,
        db: Session,
        barcode_value: str,
    ) -> Product | None:
        mapping = get_barcode_by_value(
            db=db,
            barcode_value=barcode_value,
        )

        if mapping is None:
            return None

        return db.get(
            Product,
            mapping.product_id,
        )

    def lookup_product_with_barcode(
        self,
        db: Session,
        barcode_value: str,
    ) -> dict[str, Any] | None:
        mapping = get_barcode_by_value(
            db=db,
            barcode_value=barcode_value,
        )

        if mapping is None:
            return None

        product = db.get(
            Product,
            mapping.product_id,
        )

        if product is None:
            return None

        return {
            "barcode_value": mapping.barcode_value,
            "barcode_type": mapping.barcode_type,
            "product_id": product.id,
            "brand_name": product.brand_name,
            "product_name": product.product_name,
            "category": product.category,
            "package_type": product.package_type,
            "manufacturer_name": product.manufacturer_name,
            "manufacturer_address": product.manufacturer_address,
            "source_type": mapping.source_type,
            "source_reference": mapping.source_reference,
        }

    def list_barcodes_for_product(
        self,
        db: Session,
        product_id: int,
    ):
        return list_product_barcodes(
            db=db,
            product_id=product_id,
        )

barcode_service = BarcodeService()


from dataclasses import dataclass
from typing import Optional


@dataclass
class BarcodeEvaluationResult:
    barcode: str
    barcode_type: str  # 'EAN-13', 'UPC-A', 'Unknown'
    is_valid_checksum: bool
    calculated_check_digit: Optional[int]
    actual_check_digit: Optional[int]
    gs1_prefix: str
    country_of_origin: str
    is_domestic_india: bool
    is_country_consistent: bool
    violation_code: Optional[str] = None
    violation_message: Optional[str] = None


GS1_PREFIX_RANGES = [
    (0, 19, "United States & Canada"),
    (30, 39, "United States & Canada"),
    (60, 139, "United States & Canada"),
    (300, 379, "France"),
    (400, 440, "Germany"),
    (450, 459, "Japan"),
    (490, 499, "Japan"),
    (460, 469, "Russia"),
    (500, 509, "United Kingdom"),
    (590, 590, "Poland"),
    (600, 601, "South Africa"),
    (690, 699, "China"),
    (730, 739, "Sweden"),
    (760, 769, "Switzerland"),
    (800, 839, "Italy"),
    (840, 849, "Spain"),
    (870, 879, "Netherlands"),
    (880, 880, "South Korea"),
    (885, 885, "Thailand"),
    (888, 888, "Singapore"),
    (890, 890, "India"),
    (893, 893, "Vietnam"),
    (899, 899, "Indonesia"),
    (900, 919, "Austria"),
    (930, 939, "Australia"),
    (940, 949, "New Zealand"),
]


def lookup_gs1_country(prefix_str: str) -> str:
    try:
        if len(prefix_str) >= 3:
            p3 = int(prefix_str[:3])
            for start, end, cname in GS1_PREFIX_RANGES:
                if start <= p3 <= end:
                    return cname

        p2 = int(prefix_str[:2])
        for start, end, cname in GS1_PREFIX_RANGES:
            if start <= p2 <= end:
                return cname
    except (ValueError, TypeError):
        pass
    return "International / Unassigned"


def compute_ean13_checksum(digits12: str) -> int:
    total = 0
    for idx, char in enumerate(digits12):
        weight = 1 if idx % 2 == 0 else 3
        total += int(char) * weight
    return (10 - (total % 10)) % 10


def evaluate_barcode(
    barcode_raw: str,
    declared_country_of_origin: Optional[str] = None,
) -> BarcodeEvaluationResult:
    if not barcode_raw:
        return BarcodeEvaluationResult(
            barcode="",
            barcode_type="None",
            is_valid_checksum=False,
            calculated_check_digit=None,
            actual_check_digit=None,
            gs1_prefix="",
            country_of_origin="Unknown",
            is_domestic_india=False,
            is_country_consistent=True,
            violation_code=None,
            violation_message=None,
        )

    digits = re.sub(r"\D", "", barcode_raw)
    if len(digits) == 12:
        digits = "0" + digits

    if len(digits) != 13:
        return BarcodeEvaluationResult(
            barcode=barcode_raw,
            barcode_type="Invalid Length",
            is_valid_checksum=False,
            calculated_check_digit=None,
            actual_check_digit=None,
            gs1_prefix="",
            country_of_origin="Unknown",
            is_domestic_india=False,
            is_country_consistent=False,
            violation_code="INVALID_BARCODE_LENGTH",
            violation_message=f"Barcode '{barcode_raw}' does not conform to EAN-13 / UPC standard (expected 12 or 13 digits, found {len(digits)}).",
        )

    actual_check = int(digits[-1])
    calculated_check = compute_ean13_checksum(digits[:12])
    is_valid = actual_check == calculated_check

    prefix = digits[:3]
    country = lookup_gs1_country(prefix)
    is_india = prefix == "890"

    is_consistent = True
    v_code = None
    v_msg = None

    if not is_valid:
        v_code = "BARCODE_CHECKSUM_FAILURE"
        v_msg = f"EAN-13 Check digit mismatch for barcode '{digits}'. Expected check digit {calculated_check}, found {actual_check} (potential counterfeit packaging)."
    elif declared_country_of_origin:
        decl_clean = declared_country_of_origin.strip().lower()
        if "india" in decl_clean and not is_india and country not in ("International / Unassigned", "Unknown"):
            is_consistent = False
            v_code = "BARCODE_COUNTRY_MISMATCH"
            v_msg = f"Packaging declares Country of Origin as '{declared_country_of_origin}', but GS1 barcode prefix '{prefix}' is allocated to '{country}'."
        elif "india" not in decl_clean and is_india:
            is_consistent = False
            v_code = "BARCODE_IMPORTER_MISMATCH"
            v_msg = f"Packaging claims foreign origin '{declared_country_of_origin}', but barcode carries Indian GS1 prefix '890' without declared co-packer/importer registration."

    return BarcodeEvaluationResult(
        barcode=digits,
        barcode_type="EAN-13",
        is_valid_checksum=is_valid,
        calculated_check_digit=calculated_check,
        actual_check_digit=actual_check,
        gs1_prefix=prefix,
        country_of_origin=country,
        is_domestic_india=is_india,
        is_country_consistent=is_consistent,
        violation_code=v_code,
        violation_message=v_msg,
    )






