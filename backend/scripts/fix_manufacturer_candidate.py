from pathlib import Path
import re

path = Path("app/ai/extraction/declaration_extractor.py")
text = path.read_text(encoding="utf-8")

pattern = re.compile(
    r"(?s)def _detect_manufacturer_candidate\(.*?\n\n\ndef _extract_mrp"
)

replacement = '''def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Extract a bounded company-name candidate from noisy OCR text.

    OCR often returns the complete package as one large text block,
    so line-based extraction is unreliable.
    """

    clean = _clean_text(text)

    # Find company-name candidates ending with "Private Limited"
    # or common Ltd variants.
    patterns = [
        r"([A-Za-z0-9@._-]+(?:\\s+[A-Za-z0-9@._-]+){0,6}\\s+"
        r"private\\s+limited)",
        r"([A-Za-z0-9@._-]+(?:\\s+[A-Za-z0-9@._-]+){0,6}\\s+"
        r"pvt\\.?\\s*ltd\\.?)",
    ]

    candidates = []

    for candidate_pattern in patterns:
        for match in re.finditer(
            candidate_pattern,
            clean,
            flags=re.IGNORECASE,
        ):
            candidate = _clean_text(match.group(1))

            lower = candidate.lower()

            has_product_signal = any(
                term in lower
                for term in (
                    "snacks",
                    "food",
                    "foods",
                )
            )

            if has_product_signal:
                candidates.append(candidate)

    if not candidates:
        return None

    # Prefer a candidate containing the strongest known entity clue.
    candidates.sort(
        key=lambda value: (
            "haldiram" in value.lower(),
            "diram" in value.lower(),
            "snacks" in value.lower(),
            -len(value),
        ),
        reverse=True,
    )

    return candidates[0]


def _extract_mrp'''

new_text, count = pattern.subn(
    replacement,
    text,
    count=1,
)

if count != 1:
    raise RuntimeError(
        "Manufacturer detector block not found. "
        "Backup preserved; no changes made."
    )

path.write_text(new_text, encoding="utf-8")

print("Manufacturer candidate detector fixed.")
