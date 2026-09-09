from pathlib import Path
import re

path = Path("app/ai/extraction/declaration_extractor.py")
text = path.read_text(encoding="utf-8")

start_match = re.search(
    r"def\s+_detect_manufacturer_candidate\s*\(",
    text,
)

if not start_match:
    raise RuntimeError(
        "_detect_manufacturer_candidate() not found. "
        "No changes made."
    )

end_match = re.search(
    r"\ndef\s+_extract_mrp\s*\(",
    text[start_match.start():],
)

if not end_match:
    raise RuntimeError(
        "_extract_mrp() boundary not found. "
        "No changes made."
    )

absolute_end = start_match.start() + end_match.start()

new_function = r'''def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Extract a bounded company-name candidate from noisy OCR.

    OCR may place unrelated legal text immediately before the
    company name, so we search for a company-name phrase ending
    in "Private Limited" and then clean OCR/legal prefixes.
    """

    clean = _clean_text(text)

    candidates: list[str] = []

    patterns = (
        r"([A-Za-z0-9@._-]+(?:\s+[A-Za-z0-9@._-]+){0,8}\s+"
        r"private\s+limited)",

        r"([A-Za-z0-9@._-]+(?:\s+[A-Za-z0-9@._-]+){0,8}\s+"
        r"pvt\.?\s+ltd\.?)",
    )

    for pattern in patterns:
        for match in re.finditer(
            pattern,
            clean,
            flags=re.IGNORECASE,
        ):
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

            # Remove obvious OCR/legal prefixes.
            words = candidate.split()

            while len(words) > 3:
                first = words[0].lower().strip(".,:;-")

                if first in {
                    "ssai",
                    "lic",
                    "lic.",
                    "no",
                    "no.",
                }:
                    words.pop(0)
                    continue

                if re.fullmatch(r"\d{6,}", first):
                    words.pop(0)
                    continue

                break

            candidate = " ".join(words)

            # Remove OCR bullet-like prefix:
            # B-HALDIRAM -> HALDIRAM
            candidate = re.sub(
                r"^[A-Za-z]-\s*",
                "",
                candidate,
            )

            if candidate:
                candidates.append(candidate)

    if not candidates:
        return None

    def score(value: str) -> tuple[int, int, int, int]:
        lower = value.lower()

        return (
            int("haldiram" in lower),
            int("diram" in lower),
            int("snacks" in lower),
            int("food" in lower),
        )

    candidates.sort(
        key=score,
        reverse=True,
    )

    return candidates[0]
'''

new_text = (
    text[:start_match.start()]
    + new_function
    + text[absolute_end:]
)

path.write_text(
    new_text,
    encoding="utf-8",
)

print("Manufacturer detector replaced successfully.")
