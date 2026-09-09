from pathlib import Path

import cv2
import pytesseract


IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(f"Could not load image: {IMAGE}")

# Stored regression image is upside down.
# Correct it first.
image = cv2.rotate(
    image,
    cv2.ROTATE_180,
)

# Original image:
# width  = 963
# height = 1280
#
# Resize exactly like our OCR pipeline.
target_width = 1800

height, width = image.shape[:2]

scale = target_width / width
target_height = int(height * scale)

image = cv2.resize(
    image,
    (target_width, target_height),
    interpolation=cv2.INTER_CUBIC,
)

print("RESIZED IMAGE:", image.shape)

# Wide ROI covering the COMPLETE MRP block:
#
# ₹ 5/- (INCL. OF ALL TAXES)
# Rs. 0.299
# DATE: ...
#
# We intentionally include surrounding context.
x1, y1 = 900, 1600
x2, y2 = 1790, 2200

crop = image[y1:y2, x1:x2]

if crop.size == 0:
    raise RuntimeError("MRP ROI is empty.")

# Upscale targeted region.
crop = cv2.resize(
    crop,
    None,
    fx=4,
    fy=4,
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

# Otsu threshold
_, otsu = cv2.threshold(
    enhanced,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU,
)

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

configs = (
    "--psm 6",
    "--psm 11",
    "--psm 12",
)

variants = {
    "gray": gray,
    "enhanced": enhanced,
    "otsu": otsu,
}

for variant_name, candidate in variants.items():

    print(f"\n========== {variant_name.upper()} ==========")

    for config in configs:

        text = pytesseract.image_to_string(
            candidate,
            config=config,
        ).strip()

        print(f"\n{config}:")
        print(text)
