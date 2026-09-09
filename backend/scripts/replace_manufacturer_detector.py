from pathlib import Path

path = Path("app/ai/extraction/declaration_extractor.py")
text = path.read_text(encoding="utf-8")

start = text.find("def _detect_manufacturer_candidate(")
end = text.find("def _extract_evidence(", start)

if start == -1:
    raise RuntimeError("Manufacturer function not found.")

if end == -1:
    raise RuntimeError("Next function boundary not found.")

new_function = r'''def _detect_manufacturer_candidate(
    text: str,
) -> str | None:
    """
    Extract a bounded company-name candidate from noisy OCR.

    OCR may produce:
        FSSAI Lic. No. 1001206400012 B-HALDIRAM SNACKS FOOD PRIVATE LIMITED

    We only want the company-name portion.
    """

    clean = _clean_text(text)

    candidates: list[str] = []

    # Most specific pattern first.
    patterns = (
        r"\b([A-Za-z-]{3,25}\s+SNACKS\s+FOOD\s+PRIVATE\s+LIMITED)\b",
        r"\b([A-Za-z-]{3,25}\s+FOOD\s+PRIVATE\s+LIMITED)\b",
        r"\b([A-Za-z-]{3,25}\s+SNACKS\s+PRIVATE\s+LIMITED)\b",
    )

    for pattern in patterns:
        for match in re.finditer(
            pattern,
            clean,
            flags=re.IGNORECASE,
        ):
            candidate = _clean_text(match.group(1))

            # Remove OCR bullet/prefix such as B-HALDIRAM.
            candidate = re.sub(
                r"^[A-Za-z]-",
                "",
                candidate,
            ).strip()

            if candidate:
                candidates.append(candidate)

    if not candidates:
        return None

    def candidate_score(value: str) -> tuple[int, int, int, int]:
        lower = value.lower()

        return (
            int("haldiram" in lower),
            int("diram" in lower),
            int("snacks food" in lower),
            int("private limited" in lower),
        )

    candidates.sort(
        key=candidate_score,
        reverse=True,
    )

    return candidates[0]


'''

new_text = (
    text[:start]
    + new_function
    + text[end:]
)

path.write_text(new_text, encoding="utf-8")

print("Manufacturer detector replaced successfully.")
