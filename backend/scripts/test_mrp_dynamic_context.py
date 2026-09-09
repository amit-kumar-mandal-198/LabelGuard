from pathlib import Path
import re

import cv2
import pytesseract


# ============================================================
# TESSERACT CONFIGURATION
# ============================================================

TESSERACT_PATH = Path(
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

if not TESSERACT_PATH.exists():
    raise FileNotFoundError(
        f"Tesseract executable not found: {TESSERACT_PATH}"
    )

pytesseract.pytesseract.tesseract_cmd = str(
    TESSERACT_PATH
)

print(
    "TESSERACT:",
    pytesseract.pytesseract.tesseract_cmd,
)

print(
    "TESSERACT VERSION:",
    pytesseract.get_tesseract_version(),
)


# ============================================================
# IMAGE
# ============================================================

IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

if not IMAGE.exists():
    raise FileNotFoundError(
        f"Image not found: {IMAGE}"
    )


image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(
        f"OpenCV could not load image: {IMAGE}"
    )


# ============================================================
# ORIENTATION + RESIZE
# ============================================================

image = cv2.rotate(
    image,
    cv2.ROTATE_180,
)

target_width = 1800

height, width = image.shape[:2]

scale = target_width / width

target_height = int(
    height * scale
)

image = cv2.resize(
    image,
    (target_width, target_height),
    interpolation=cv2.INTER_CUBIC,
)

print(
    "IMAGE SIZE:",
    image.shape,
)


# ============================================================
# FULL IMAGE OCR WITH BOUNDING BOXES
# ============================================================

ocr = pytesseract.image_to_data(
    image,
    config="--psm 6",
    output_type=pytesseract.Output.DICT,
)

words = []

for i, raw_text in enumerate(
    ocr["text"]
):

    text = str(raw_text).strip()

    if not text:
        continue

    try:
        confidence = float(
            ocr["conf"][i]
        )
    except (
        TypeError,
        ValueError,
    ):
        confidence = 0.0

    words.append(
        {
            "text": text,
            "confidence": confidence,
            "bbox": {
                "x": int(
                    ocr["left"][i]
                ),
                "y": int(
                    ocr["top"][i]
                ),
                "width": int(
                    ocr["width"][i]
                ),
                "height": int(
                    ocr["height"][i]
                ),
            },
        }
    )


# ============================================================
# FIND MRP CONTEXT ANCHOR
# ============================================================

anchors = []

for word in words:

    normalized = (
        word["text"]
        .lower()
        .strip(
            ".,:;()[]"
        )
    )

    if normalized in {
        "mrp",
        "m.r.p",
        "incl",
        "ncl",
        "inclusive",
        "tax",
        "taxes",
        "rs",
        "rs.",
    }:

        anchors.append(
            word
        )


priority = {
    "mrp": 10,
    "m.r.p": 10,
    "incl": 9,
    "ncl": 9,
    "inclusive": 9,
    "taxes": 8,
    "tax": 7,
    "rs": 6,
    "rs.": 6,
}


anchors.sort(
    key=lambda item: (
        priority.get(
            item["text"]
            .lower()
            .strip(
                ".,:;()[]"
            ),
            0,
        ),
        item["confidence"],
    ),
    reverse=True,
)


if not anchors:

    print(
        "\nNO MRP CONTEXT ANCHOR FOUND."
    )

    print(
        "\nPotential OCR words:"
    )

    for word in words:

        if any(
            char.isdigit()
            for char in word["text"]
        ):
            print(word)

    raise RuntimeError(
        "Could not locate an MRP context anchor."
    )


anchor = anchors[0]

print(
    "\nANCHOR:",
    anchor["text"],
    "| confidence:",
    anchor["confidence"],
    "| bbox:",
    anchor["bbox"],
)


# ============================================================
# DYNAMIC ROI
# ============================================================

ax = anchor["bbox"]["x"]
ay = anchor["bbox"]["y"]
aw = anchor["bbox"]["width"]
ah = anchor["bbox"]["height"]


# Expand around the context anchor.
x1 = max(
    0,
    ax - 750,
)

y1 = max(
    0,
    ay - 220,
)

x2 = min(
    image.shape[1],
    ax + aw + 750,
)

y2 = min(
    image.shape[0],
    ay + ah + 250,
)


crop = image[
    y1:y2,
    x1:x2,
]


if crop.size == 0:
    raise RuntimeError(
        f"Dynamic MRP ROI is empty: "
        f"{(x1, y1, x2, y2)}"
    )


print(
    "DYNAMIC ROI:",
    (x1, y1, x2, y2),
)


# ============================================================
# PREPROCESSING
# ============================================================

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


enhanced = clahe.apply(
    gray
)


_, otsu = cv2.threshold(
    enhanced,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU,
)


# ============================================================
# TARGETED OCR
# ============================================================

variants = {
    "gray": gray,
    "enhanced": enhanced,
    "otsu": otsu,
}


for variant_name, candidate in variants.items():

    print(
        f"\n========== {variant_name.upper()} =========="
    )

    for psm in (
        6,
        7,
        11,
        12,
    ):

        text = pytesseract.image_to_string(
            candidate,
            config=f"--psm {psm}",
        ).strip()

        print(
            f"\nPSM {psm}:"
        )

        print(
            text
        )
