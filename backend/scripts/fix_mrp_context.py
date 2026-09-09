from pathlib import Path

path = Path("app/ai/extraction/mrp_extractor.py")
text = path.read_text(encoding="utf-8")

old = r'''    tax_match = re.search(
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
        r"\s*[/+\-]?\s*"
        r"\(?\s*INCL\.?\s*\.?"
        r"\s*(?:OF\s+)?ALL\s+TAXES",
        text,
        flags=re.IGNORECASE,
    )
'''

new = r'''    tax_match = re.search(
        r"([0-9]+(?:[.,][0-9]{1,2})?)"
        r"\s*[/+\-]?\s*"
        r"\(?\s*INCL\.?\s*\.?"
        r"\s*(?:OF\s+)?ALL\s+TAXES\s*\)?",
        text,
        flags=re.IGNORECASE,
    )
'''

if old not in text:
    raise RuntimeError(
        "MRP tax-context block not found. No changes made."
    )

text = text.replace(old, new)

path.write_text(text, encoding="utf-8")

print("MRP context regex fixed.")
