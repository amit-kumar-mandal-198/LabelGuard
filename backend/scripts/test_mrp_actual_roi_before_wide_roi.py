from pathlib import Path

import cv2
import pytesseract


IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(f"Could not load image: {IMAGE}")

# The stored regression image is visually upright.
# Use it directly for this targeted ROI test.
#
# ROI contains:
#   5/- (INCL. OF ALL TAXES)
#
# Coordinates are intentionally generous around that declaration.
x1, y1 = 530, 850
x2, y2 = 900, 1030

crop = image[y1:y2, x1:x2]

if crop.size == 0:
    raise RuntimeError("MRP ROI is empty.")

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

# MRP is a short numeric/currency declaration.
# Restrict recognition toward currency/price characters.
configs = (
    "--psm 6 -c tessedit_char_whitelist=0123456789./-₹RSMRPinclOFALLTAXES",
    "--psm 7 -c tessedit_char_whitelist=0123456789./-₹RSMRPinclOFALLTAXES",
    "--psm 11 -c tessedit_char_whitelist=0123456789./-₹RSMRPinclOFALLTAXES",
)

for name, candidate in {
    "gray": gray,
    "enhanced": enhanced,
    "thresholded": thresholded,
}.items():

    print(f"\n========== {name.upper()} ==========")

    for config in configs:

        text = pytesseract.image_to_string(
            candidate,
            config=config,
        ).strip()

        print(f"{config}: {text}")
