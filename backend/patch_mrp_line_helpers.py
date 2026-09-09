from pathlib import Path

path = Path(r".\app\services\mrp_image_detector.py")

text = path.read_text(encoding="utf-8")

marker = "\ndef _extract_candidates("

if marker not in text:
    raise RuntimeError(
        "Could not find _extract_candidates() marker."
    )

helper = '''
def _find_anchor_line(
    words: list[dict[str, Any]],
    anchor: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Return OCR words belonging to the same Tesseract
    block/paragraph/line as the selected MRP anchor.
    """

    anchor_block = anchor.get("block_num")
    anchor_paragraph = anchor.get("par_num")
    anchor_line = anchor.get("line_num")

    line_words = [
        word
        for word in words
        if word.get("block_num") == anchor_block
        and word.get("par_num") == anchor_paragraph
        and word.get("line_num") == anchor_line
    ]

    line_words.sort(
        key=lambda word: word["bbox"]["x"]
    )

    return line_words


def _crop_word_line(
    image: np.ndarray,
    words: list[dict[str, Any]],
    padding_x: int = 40,
    padding_y: int = 25,
) -> tuple[np.ndarray, dict[str, int]] | None:
    """
    Crop a tight region around one OCR line.
    """

    if not words:
        return None

    xs: list[int] = []
    ys: list[int] = []
    x2s: list[int] = []
    y2s: list[int] = []

    for word in words:
        bbox = word["bbox"]

        x = int(bbox["x"])
        y = int(bbox["y"])
        width = int(bbox["width"])
        height = int(bbox["height"])

        xs.append(x)
        ys.append(y)
        x2s.append(x + width)
        y2s.append(y + height)

    x1 = max(
        0,
        min(xs) - padding_x,
    )

    y1 = max(
        0,
        min(ys) - padding_y,
    )

    x2 = min(
        image.shape[1],
        max(x2s) + padding_x,
    )

    y2 = min(
        image.shape[0],
        max(y2s) + padding_y,
    )

    if x2 <= x1 or y2 <= y1:
        return None

    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        return None

    return (
        crop,
        {
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
        },
    )

'''

updated = text.replace(
    marker,
    helper + marker,
    1,
)

path.write_text(
    updated,
    encoding="utf-8",
)

print("MRP LINE HELPERS: PASS")
