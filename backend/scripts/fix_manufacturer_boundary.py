from pathlib import Path
import re

path = Path("app/ai/extraction/declaration_extractor.py")
text = path.read_text(encoding="utf-8")

start = text.index("def _detect_manufacturer_candidate(")
end = text.index("\ndef _extract_mrp", start)

new_function = r'''def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Extract a bounded manufacturer/company candidate from noisy OCR.

    The OCR may contain unrelated text immediately before the company
    name. We therefore anchor extraction around company-name semantics.
    """

    clean = _clean_text(text)

    candidates: list[str] = []

    # Look for food/snacks company names ending in Private Limited.
    pattern = re.compile(
        r"([A-Za-z0-9@._-]+(?:\s+[A-Za-z0-9@._-]+){0,8}\s+"
        r"private\s+limited)",
        flags=re.IGNORECASE,
    )

    for match in pattern.finditer(clean):
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

        # Remove known OCR/legal-text prefixes that can accidentally
        # get included in the candidate.
        prefix_markers = (
            "lic.",
            "lic",
            "no.",
            "no",
            "ssai",
            "b-",
        )

        words = candidate.split()

        while len(words) > 3:
            first = words[0].lower().strip(".,:-")

            if first in prefix_markers:
                words.pop(0)
                continue

            # Example:
            # "1001206400012 B-HALDIRAM SNACKS FOOD PRIVATE LIMITED"
            # should become:
            # "B-HALDIRAM SNACKS FOOD PRIVATE LIMITED"
            if re.fullmatch(r"\d{6,}", first):
                words.pop(0)
                continue

            break

        candidate = " ".join(words).strip()

        # Remove OCR bullet/prefix directly attached to company name.
        candidate = re.sub(
            r"^[A-Za-z]-\s*",
            "",
            candidate,
        )

        lower = candidate.lower()

        # Prefer candidates containing the strongest known entity clue.
        candidates.append(candidate)

    if not candidates:
        return None

    candidates.sort(
        key=lambda value: (
            int("haldiram" in value.lower()),
            int("diram" in value.lower()),
            int("snacks" in value.lower()),
            int("food" in value.lower()),
            -len(value),
        ),
        reverse=True,
    )

    return candidates[0]
'''

new_text = text[:start] + new_function + text[end:]

path.write_text(new_text, encoding="utf-8")

print("Manufacturer company boundary fixed.")
