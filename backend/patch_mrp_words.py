from pathlib import Path

path = Path(r".\app\services\mrp_image_detector.py")

text = path.read_text(encoding="utf-8")

start_marker = "def _ocr_words("
end_marker = "\ndef _extract_candidates("

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1:
    raise RuntimeError("Could not find _ocr_words()")

if end == -1:
    raise RuntimeError("Could not find _extract_candidates()")

new_function = '''def _ocr_words(
    image: np.ndarray,
    psm: int = 11,
) -> list[dict[str, Any]]:
    data = pytesseract.image_to_data(
        image,
        config=f"--oem 3 --psm {psm}",
        output_type=pytesseract.Output.DICT,
    )

    words = []

    for i, text in enumerate(data["text"]):
        text = str(text).strip()

        if not text:
            continue

        try:
            confidence = float(data["conf"][i])
        except (TypeError, ValueError):
            confidence = -1.0

        if confidence < 0:
            continue

        words.append(
            {
                "text": text,
                "confidence": confidence,
                "bbox": {
                    "x": int(data["left"][i]),
                    "y": int(data["top"][i]),
                    "width": int(data["width"][i]),
                    "height": int(data["height"][i]),
                },
                "block_num": int(
                    data["block_num"][i]
                ),
                "par_num": int(
                    data["par_num"][i]
                ),
                "line_num": int(
                    data["line_num"][i]
                ),
            }
        )

    return words

'''

updated = (
    text[:start]
    + new_function
    + text[end:]
)

path.write_text(
    updated,
    encoding="utf-8",
)

print("MRP DETECTOR _ocr_words PATCH: PASS")
