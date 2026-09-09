from pathlib import Path

import cv2
import pytesseract


IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(f"Could not load image: {IMAGE}")

# Correct orientation.
image = cv2.rotate(
    image,
    cv2.ROTATE_180,
)

# Match the coordinate system used by the OCR pipeline.
target_width = 1800

height, width = image.shape[:2]

scale = target_width / width
target_height = int(height * scale)

image = cv2.resize(
    image,
    (target_width, target_height),
    interpolation=cv2.INTER_CUBIC,
)

print("IMAGE SIZE:", image.shape)

# Run OCR with bounding boxes.
ocr = pytesseract.image_to_data(
    image,
    config="--psm 6",
    output_type=pytesseract.Output.DICT,
)

words = []

for i, raw_text in enumerate(ocr["text"]):
    text = str(raw_text).strip()

    if not text:
        continue

    try:
        confidence = float(ocr["conf"][i])
    except (TypeError, ValueError):
        confidence = 0.0

    words.append(
        {
            "text": text,
            "confidence": confidence,
            "bbox": {
                "x": int(ocr["left"][i]),
                "y": int(ocr["top"][i]),
                "width": int(ocr["width"][i]),
                "height": int(ocr["height"][i]),
            },
        }
    )

# Find an MRP-context anchor.
anchor_candidates = []

for word in words:
    normalized = (
        word["text"]
        .lower()
        .strip(".,:;()[]")
    )

    if normalized in {
        "incl",
        "ncl",
        "tax",
        "taxes",
        "mrp",
        "m.r.p",
        "rs",
        "rs.",
    }:
        anchor_candidates.append(word)

# Prefer INCL/NCL because the actual package prints:
# "(INCL. OF ALL TAXES)"
priority = {
    "incl": 5,
    "ncl": 5,
    "taxes": 4,
    "tax": 3,
    "mrp": 6,
    "m.r.p": 6,
    "rs": 2,
    "rs.": 2,
}

anchor_candidates.sort(
    key=lambda item: (
        priority.get(
            item["text"].lower().strip(".,:;()[]"),
            0,
        ),
        item["confidence"],
    ),
    reverse=True,
)

if not anchor_candidates:
    raise RuntimeError(
        "No MRP-related context anchor found."
    )

anchor = anchor_candidates[0]

print(
    "ANCHOR:",
    anchor["text"],
    "| confidence:",
    anchor["confidence"],
    "| bbox:",
    anchor["bbox"],
)

ax = anchor["bbox"]["x"]
ay = anchor["bbox"]["y"]
aw = anchor["bbox"]["width"]
ah = anchor["bbox"]["height"]

# Dynamic ROI:
# price is expected near the anchor, including to its left.
x1 = max(0, ax - 750)
y1 = max(0, ay - 180)
x2 = min(
    image.shape[1],
    ax + aw + 700,
)
y2 = min(
    image.shape[0],
    ay + ah + 220,
)

crop = image[y1:y2, x1:x2]

if crop.size == 0:
    raise RuntimeError(
        f"Dynamic MRP ROI is empty: {(x1, y1, x2, y2)}"
    )

print(
    "DYNAMIC ROI:",
    (x1, y1, x2, y2),
)

crop = cv2.resize(
    crop,
    None,
    fx=5,
    fy=5,
    interpolation=cv2.INTER_CUBIC,
)

gray = cv2.cvtColor(
    crop,
    cv2.COLOR_BGR2GRAY,
)

clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8),
)

enhanced = clahe.apply(gray)

_, otsu = cv2.threshold(
    enhanced,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU,
)

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

variants = {
    "gray": gray,
    "enhanced": enhanced,
    "otsu": otsu,
}

configs = (
    "--psm 6",
    "--psm 7",
    "--psm 11",
    "--psm 12",
)

for variant_name, candidate in variants.items():

    print(
        f"\n========== {variant_name.upper()} =========="
    )

    for config in configs:

        text = pytesseract.image_to_string(
            candidate,
            config=config,
        ).strip()

        print(
            f"\n{config}:\n{text}"
        )
