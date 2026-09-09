from pathlib import Path

import cv2
import pytesseract


IMAGE = Path(
    r".\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

image = cv2.imread(str(IMAGE))

if image is None:
    raise RuntimeError(f"Could not load image: {IMAGE}")

# The OCR orientation detector selected 180°.
image = cv2.rotate(image, cv2.ROTATE_180)

# Manufacturer / marketed-by area after correcting orientation.
crop = image[430:800, 0:600]

# Upscale for printed text.
crop = cv2.resize(
    crop,
    None,
    fx=3,
    fy=3,
    interpolation=cv2.INTER_CUBIC,
)

gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8),
)

enhanced = clahe.apply(gray)

# Small blur before thresholding.
blurred = cv2.GaussianBlur(
    enhanced,
    (3, 3),
    0,
)

thresholded = cv2.adaptiveThreshold(
    blurred,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    31,
    11,
)

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

images = {
    "enhanced": enhanced,
    "thresholded": thresholded,
}

for name, candidate in images.items():

    print(f"\n========== {name.upper()} ==========")

    for psm in (6, 11):

        text = pytesseract.image_to_string(
            candidate,
            config=f"--psm {psm}",
        )

        print(f"\n--- PSM {psm} ---")
        print(text.strip())
