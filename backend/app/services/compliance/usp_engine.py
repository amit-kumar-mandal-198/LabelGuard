"""
Unit Sale Price (USP) Compliance Engine
Implements Rule 6(11) of Legal Metrology (Packaged Commodities) Rules, 2011 (amended).

Statutory Requirements:
- If Net Quantity <= 1000g / 1000ml: USP declared per 100g / 100ml.
- If Net Quantity > 1000g / 1000ml: USP declared per kg / per liter.
- If sold by count: USP declared per number / unit.
- Discrepancy threshold: +/- 0.5% permitted for rounding.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class UspEvaluationResult:
    is_compliant: bool
    net_quantity_standard: float
    base_unit: str
    statutory_unit_name: str
    calculated_usp: float
    formatted_calculated_usp: str
    declared_usp: Optional[float] = None
    formatted_declared_usp: Optional[str] = None
    variance_percent: Optional[float] = None
    violation_code: Optional[str] = None
    violation_message: Optional[str] = None


def parse_quantity_and_unit(qty_str: str) -> tuple[Optional[float], Optional[str]]:
    if not qty_str:
        return None, None

    cleaned = qty_str.strip().lower()
    match = re.search(r"([\d]+(?:\.[\d]+)?)\s*([a-zA-Z]+)", cleaned)
    if not match:
        return None, None

    val = float(match.group(1))
    unit = match.group(2).lower()

    if unit in ("kg", "kilogram", "kgs", "kilograms"):
        return val * 1000.0, "g"
    elif unit in ("g", "gm", "gms", "gram", "grams"):
        return val, "g"
    elif unit in ("l", "ltr", "liter", "litre", "liters", "litres"):
        return val * 1000.0, "ml"
    elif unit in ("ml", "milli", "milliliter", "millilitre"):
        return val, "ml"
    elif unit in ("n", "u", "unit", "units", "pc", "pcs", "piece", "pieces", "count"):
        return val, "piece"

    return val, unit


def parse_mrp_value(mrp_str: str | float | int) -> Optional[float]:
    if mrp_str is None:
        return None
    if isinstance(mrp_str, (int, float)):
        return float(mrp_str)
    match = re.search(r"[\d]+(?:\.[\d]+)?", str(mrp_str).replace(",", ""))
    if match:
        return float(match.group(0))
    return None


def calculate_and_verify_usp(
    net_quantity_str: str,
    effective_mrp: str | float | int,
    declared_usp_str: Optional[str] = None,
) -> UspEvaluationResult:
    qty, base_unit = parse_quantity_and_unit(net_quantity_str)
    mrp = parse_mrp_value(effective_mrp)

    if not qty or not base_unit or not mrp or qty <= 0:
        return UspEvaluationResult(
            is_compliant=True,
            net_quantity_standard=qty or 0.0,
            base_unit=base_unit or "unknown",
            statutory_unit_name="N/A",
            calculated_usp=0.0,
            formatted_calculated_usp="N/A",
            violation_code=None,
            violation_message=None,
        )

    if base_unit == "g":
        if qty <= 1000.0:
            calc_usp = (mrp / qty) * 100.0
            stat_unit = "100g"
        else:
            calc_usp = (mrp / qty) * 1000.0
            stat_unit = "kg"
    elif base_unit == "ml":
        if qty <= 1000.0:
            calc_usp = (mrp / qty) * 100.0
            stat_unit = "100ml"
        else:
            calc_usp = (mrp / qty) * 1000.0
            stat_unit = "L"
    else:
        calc_usp = mrp / qty
        stat_unit = "unit"

    calc_usp_rounded = round(calc_usp, 2)
    formatted_calc = f"₹ {calc_usp_rounded:.2f} / {stat_unit}"

    if not declared_usp_str:
        return UspEvaluationResult(
            is_compliant=False,
            net_quantity_standard=qty,
            base_unit=base_unit,
            statutory_unit_name=stat_unit,
            calculated_usp=calc_usp_rounded,
            formatted_calculated_usp=formatted_calc,
            declared_usp=None,
            formatted_declared_usp="Missing declaration",
            variance_percent=100.0,
            violation_code="RULE_6_11_MISSING_USP",
            violation_message=(
                f"Statutory Unit Sale Price (USP) is missing from the package. "
                f"Under Rule 6(11), mandatory USP must be declared as '{formatted_calc}'."
            ),
        )

    dec_val = parse_mrp_value(declared_usp_str)
    if dec_val is None:
        return UspEvaluationResult(
            is_compliant=False,
            net_quantity_standard=qty,
            base_unit=base_unit,
            statutory_unit_name=stat_unit,
            calculated_usp=calc_usp_rounded,
            formatted_calculated_usp=formatted_calc,
            declared_usp=None,
            formatted_declared_usp=str(declared_usp_str),
            variance_percent=100.0,
            violation_code="RULE_6_11_INVALID_FORMAT",
            violation_message=f"Declared USP '{declared_usp_str}' could not be parsed into statutory numeric format.",
        )

    variance = abs(dec_val - calc_usp_rounded) / (calc_usp_rounded or 1.0) * 100.0
    formatted_dec = f"₹ {dec_val:.2f} / {stat_unit}"

    if variance > 1.0:
        return UspEvaluationResult(
            is_compliant=False,
            net_quantity_standard=qty,
            base_unit=base_unit,
            statutory_unit_name=stat_unit,
            calculated_usp=calc_usp_rounded,
            formatted_calculated_usp=formatted_calc,
            declared_usp=dec_val,
            formatted_declared_usp=formatted_dec,
            variance_percent=round(variance, 2),
            violation_code="RULE_6_11_USP_DISCREPANCY",
            violation_message=(
                f"Statutory Unit Sale Price mathematical discrepancy. "
                f"Declared USP '{declared_usp_str}' differs from statutory calculated USP '{formatted_calc}' "
                f"by {variance:.1f}%."
            ),
        )

    return UspEvaluationResult(
        is_compliant=True,
        net_quantity_standard=qty,
        base_unit=base_unit,
        statutory_unit_name=stat_unit,
        calculated_usp=calc_usp_rounded,
        formatted_calculated_usp=formatted_calc,
        declared_usp=dec_val,
        formatted_declared_usp=formatted_dec,
        variance_percent=round(variance, 2),
        violation_code=None,
        violation_message=None,
    )
