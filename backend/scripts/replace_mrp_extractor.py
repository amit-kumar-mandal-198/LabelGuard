from pathlib import Path

path = Path("app/ai/extraction/declaration_extractor.py")
text = path.read_text(encoding="utf-8")

start = text.find("def _extract_mrp(")
end = text.find("def _extract_quantity(", start)

if start == -1:
    raise RuntimeError("MRP function not found. No changes made.")

if end == -1:
    raise RuntimeError("Quantity function boundary not found. No changes made.")

new_function = r'''def _extract_mrp(
    text: str,
) -> tuple[str | None, float | None]:
    """
    Extract an MRP amount from OCR text.

    Returns:
        (raw_amount, extraction_confidence)
    """

    patterns = (
        r"\b(?:MRP|M\.R\.P\.?)\s*[:.]?\s*"
        r"(?:RS\.?|₹)?\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",

        r"(?:₹|RS\.?)\s*"
        r"([0-9]+(?:[.,][0-9]{1,2})?)",
    )

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return (
                match.group(1),
                70.0,
            )

    return None, None


'''

new_text = (
    text[:start]
    + new_function
    + text[end:]
)

path.write_text(
    new_text,
    encoding="utf-8",
)

print("MRP extraction function updated.")
