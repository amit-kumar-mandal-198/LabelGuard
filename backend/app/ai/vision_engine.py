import json
import re
from pathlib import Path
from typing import Any
from PIL import Image
import google.generativeai as genai

from app.core.config import settings

def extract_json_from_response(text: str) -> dict[str, Any] | None:
    """Safely extracts JSON even if surrounded by markdown code blocks or commentary."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    elif text.startswith("{") and text.endswith("}"):
        pass
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

    try:
        return json.loads(text)
    except Exception as e:
        print(f"JSON parsing error: {e}")
        return None


import os

def analyze_packaging_image(image_path: str | Path) -> dict[str, Any] | None:
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Gemini API key is not configured in environment or .env file.")
        return None

    genai.configure(api_key=api_key)

    try:
        img = Image.open(str(image_path))
    except Exception as e:
        print(f"Failed to open image for Vision AI: {e}")
        return None

    # Try preferred models in order
    models_to_try = ["gemini-3.6-flash", "gemini-flash-latest"]
    
    prompt = """You are a senior forensic Legal Metrology (Packaged Commodities) Rules, 2011 inspection officer.
Carefully examine every millimeter of this packaged commodity image.

TASK 1 - TAMPER & DUAL-PRICING INSPECTION:
- Inspect if there is any sticker, adhesive tape, label overlay, marker handwriting, price scratching, or dual pricing.
- Notice if a sticker/tape has been placed over or near the printed MRP to charge a different price (e.g., printed Rs 48, sticker Rs 50).
- If present, set tamper_detected: true, identify the printed MRP vs the sticker MRP, and report the violation.

TASK 2 - MANDATORY DECLARATIONS EXTRACTION:
Extract all mandatory declarations present on the packaging:
- Commodity name (e.g. Pineapple Cream Biscuits)
- Brand name (e.g. Vishal Mega Mart / Britannia / Parle)
- Net quantity with standard metric units (e.g. 75 g, 100 ml, 1 kg)
- Printed MRP (numeric float, e.g. 48.00)
- Sticker or altered MRP (numeric float if sticker/handwriting present, e.g. 50.00, else null)
- Effective retail price (the price the consumer is actually charged, e.g. 50.00 or 48.00)
- Date of manufacture or packaging (e.g. 08/2026)
- Expiry date or Best Before / Use By (e.g. 08/2027)
- Batch or Lot number (e.g. 0813)
- Manufacturer or Packer name and full address
- Consumer care contact (telephone and email)
- Country of origin (e.g. India)
- FSSAI license number (if visible)

TASK 3 - BOUNDING BOXES (0 to 100 percentage):
Provide normalized coordinates [ymin, xmin, ymax, xmax] as numbers from 0 to 100 for key regions:
- Tampered or sticker area (if any)
- Printed MRP area
- Net quantity declaration
- Manufacturer address declaration

TASK 4 - LEGAL METROLOGY VIOLATIONS:
List specific violations under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011:
- Rule 18(2) & Sec 36 for Dual Pricing / Selling above statutory printed MRP (Severity: critical)
- Rule 6(1)(e) for missing or obscure Net Quantity
- Rule 6(1)(b) for incomplete Manufacturer address
- Rule 6(5) for missing Consumer Care grievance contact
- Rule 7 / Rule 9 for Font height / legibility defects

Respond with ONLY a valid JSON object strictly adhering to this schema:
{
  "commodity_name": "string",
  "brand_name": "string",
  "sku": "string (e.g. VMM-BIS-75G)",
  "category": "string (e.g. Biscuits & Bakery)",
  "net_quantity": "string (e.g. 75 g)",
  "printed_mrp": 48.0,
  "sticker_mrp": 50.0,
  "effective_mrp": 50.0,
  "tamper_detected": true,
  "tamper_type": "sticker_overlay_dual_mrp",
  "tamper_description": "Green adhesive tape / sticker stuck over the declaration area displaying Rs 50 MRP over the printed Rs 48.00 MRP (illegal dual-pricing).",
  "date_of_packaging": "08/2026",
  "expiry_date": "08/2027",
  "batch_number": "0813",
  "manufacturer_name": "string",
  "manufacturer_address": "string",
  "consumer_care": "string",
  "country_of_origin": "India",
  "fssai_lic": "string",
  "compliance_score": 40,
  "status": "NON_COMPLIANT",
  "bboxes": [
    {
      "label": "Altered Price Sticker",
      "ymin": 15,
      "xmin": 18,
      "ymax": 55,
      "xmax": 35,
      "status": "fail",
      "field_name": "mrp"
    },
    {
      "label": "Original Printed MRP",
      "ymin": 20,
      "xmin": 40,
      "ymax": 30,
      "xmax": 48,
      "status": "fail",
      "field_name": "mrp"
    },
    {
      "label": "Net Weight",
      "ymin": 18,
      "xmin": 39,
      "ymax": 24,
      "xmax": 44,
      "status": "pass",
      "field_name": "net_quantity"
    }
  ],
  "violations": [
    {
      "rule_code": "LG-MRP",
      "rule_title": "Prohibition of Dual Pricing & Altered Declarations",
      "field_name": "mrp",
      "severity": "critical",
      "message": "Illegal sticker overlay detected: Packaging has handwritten Rs 50 over statutory printed MRP of Rs 48.00 (Overcharging & Dual Pricing).",
      "legal_citation": "Rule 18(2) & Section 36, Legal Metrology Act, 2009",
      "detected_value": "Sticker: Rs 50.00 | Printed: Rs 48.00",
      "expected_value": "Statutory MRP without overlay stickers",
      "fix_suggestion": "Remove foreign adhesive stickers and charge strictly at or below statutory printed MRP."
    }
  ]
}
"""

    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([img, prompt])
            if response and response.text:
                parsed = extract_json_from_response(response.text)
                if parsed and isinstance(parsed, dict):
                    return parsed

        except Exception as e:
            print(f"Model {model_name} error: {e}")
            continue

    return None
