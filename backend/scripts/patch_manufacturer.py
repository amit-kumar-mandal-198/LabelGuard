from pathlib import Path
import re

path = Path("app/ai/extraction/declaration_extractor.py")

text = path.read_text(encoding="utf-8")

helper = '''

def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Detect a likely company/manufacturer line even when
    OCR misses the declaration label.
    """

    lines = [
        _clean_line(line)
        for line in text.splitlines()
        if _clean_line(line)
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
'''

if "_detect_manufacturer_candidate" not in text:
    match = re.search(
        r"(?=def extract_declarations\s*\()",
        text,
    )

    if not match:
        raise RuntimeError(
            "Could not find extract_declarations(). No changes made."
        )

    text = (
        text[:match.start()]
        + helper
        + "\n"
        + text[match.start():]
    )

old_pattern = re.compile(
    r"""    manufacturer = _find_line_value\(
        raw_text,
        \(
            "manufactured by",
            "manufactured",
            "manufacturer",
        \),
    \)
    if manufacturer:
        normalized_manufacturer = normalize_company_name\(
            manufacturer,
            raw_text,
        \)

        result\["manufacturer"\] = _build_field\(
            "manufacturer",
            normalized_manufacturer\["normalized_value"\],
            normalized_manufacturer\["confidence"\],
        \)

        result\["manufacturer"\]\["raw_value"\] = \(
            normalized_manufacturer\["raw_value"\]
        \)

        result\["manufacturer"\]\["normalization_evidence"\] = \(
            normalized_manufacturer\["evidence"\]
        \)""",
    re.MULTILINE,
)

new_block = '''    manufacturer = _find_line_value(
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
        )'''

new_text, count = old_pattern.subn(new_block, text, count=1)

if count == 0:
    raise RuntimeError(
        "Manufacturer block was not found. Backup preserved; no changes made."
    )

path.write_text(new_text, encoding="utf-8")

print("Manufacturer candidate detection integrated successfully.")
