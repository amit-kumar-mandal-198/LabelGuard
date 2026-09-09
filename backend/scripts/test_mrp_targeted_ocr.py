from pathlib import Path

import cv2
import pytesseract


IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(f"Could not load image: {IMAGE}")

# Match the orientation selected by the OCR pipeline.
image = cv2.rotate(
    image,
    cv2.ROTATE_180,
)

# IMPORTANT:
# The OCR pipeline resizes images to 1800px width.
# Its bounding boxes therefore use this resized coordinate system.
target_width = 1800

height, width = image.shape[:2]

scale = target_width / width

target_height = int(height * scale)

image = cv2.resize(
    image,
    (target_width, target_height),
    interpolation=cv2.INTER_CUBIC,
)

print("OCR IMAGE SIZE:", image.shape)

# Bounding box returned by full-image OCR:
# x=1466, y=1850, width=185, height=43
#
# Add margin around the detected MRP region.
x1 = 1380
y1 = 1780
x2 = 1750
y2 = 1950

# Safety clamp.
x1 = max(0, x1)
y1 = max(0, y1)
x2 = min(image.shape[1], x2)
y2 = min(image.shape[0], y2)

if x2 <= x1 or y2 <= y1:
    raise RuntimeError(
        f"Invalid crop: {(x1, y1, x2, y2)} "
        f"for image size {image.shape}"
    )

crop = image[y1:y2, x1:x2]

if crop.size == 0:
    raise RuntimeError("MRP crop is empty.")

# Upscale targeted region.
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

for variant_name, candidate in variants.items():

    print(f"\n========== {variant_name.upper()} ==========")

    for psm in (6, 7, 11, 13):

        text = pytesseract.image_to_string(
            candidate,
            config=f"--psm {psm}",
        ).strip()

        print(
            f"PSM {psm}: {text}"
        )
