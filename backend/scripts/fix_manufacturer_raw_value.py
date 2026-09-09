from pathlib import Path
import re

path = Path("app/ai/extraction/declaration_extractor.py")
text = path.read_text(encoding="utf-8")

pattern = re.compile(
    r'''(?s)    if manufacturer:\s*
        normalized = normalize_company_name\(
            manufacturer,
            raw_text,
        \)

        fields\["manufacturer"\] = _build_field\(
            "manufacturer",
            normalized\["normalized_value"\],
            normalized\["confidence"\],
        \)

        fields\["manufacturer"\]\["raw_value"\] = \(
            normalized\["raw_value"\]
        \)

        fields\["manufacturer"\]\["normalization_evidence"\] = \(
            normalized\["evidence"\]
        \)
'''
)

replacement = '''    if manufacturer:
        normalized = normalize_company_name(
            manufacturer,
            raw_text,
        )

        fields["manufacturer"] = _build_field(
            "manufacturer",
            normalized["normalized_value"],
            normalized["confidence"],
        )

        # Preserve the actual manufacturer candidate detected
        # from OCR, not the complete OCR document.
        fields["manufacturer"]["raw_value"] = (
            manufacturer
        )

        fields["manufacturer"]["normalization_evidence"] = (
            normalized["evidence"]
        )
'''

new_text, count = pattern.subn(
    replacement,
    text,
    count=1,
)

if count != 1:
    raise RuntimeError(
        "Manufacturer block not found. No changes made."
    )

path.write_text(new_text, encoding="utf-8")

print("Manufacturer raw_value semantics fixed.")
