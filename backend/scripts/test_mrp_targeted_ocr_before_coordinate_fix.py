from pathlib import Path

import cv2
import pytesseract


IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(f"Could not load image: {IMAGE}")

# Best orientation determined by the OCR pipeline.
image = cv2.rotate(image, cv2.ROTATE_180)

# MRP OCR bbox from the full-image OCR:
# x=1466, y=1850, width=185, height=43
#
# Add a generous margin around it because the raw OCR bbox
# may not cover the complete printed MRP.
x1 = 1380
y1 = 1780
x2 = 1750
y2 = 1950

crop = image[y1:y2, x1:x2]

# Upscale substantially.
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

thresholded = cv2.adaptiveThreshold(
    enhanced,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    31,
    11,
)

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

variants = {
    "gray": gray,
    "enhanced": enhanced,
    "thresholded": thresholded,
}

configs = (
    "--psm 6",
    "--psm 7",
    "--psm 11",
    "--psm 13",
)

for variant_name, candidate in variants.items():

    print(f"\n========== {variant_name.upper()} ==========")

    for config in configs:

        text = pytesseract.image_to_string(
            candidate,
            config=config,
        ).strip()

        print(f"{config}: {text}")
