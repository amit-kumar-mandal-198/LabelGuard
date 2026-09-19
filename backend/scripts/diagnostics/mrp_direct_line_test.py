import cv2
import pytesseract

image=cv2.imread(r".\storage\uploads\ocr_benchmark_clear.jpeg")

# Original-image MRP line region.
crop=image[650:720,450:570]

# Grayscale + upscale
gray=cv2.cvtColor(crop,cv2.COLOR_BGR2GRAY)
gray=cv2.resize(gray,None,fx=6,fy=6,interpolation=cv2.INTER_CUBIC)

tests=[
    ("gray",gray),
    ("otsu",cv2.threshold(gray,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1]),
    ("adaptive",cv2.adaptiveThreshold(
        gray,255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,11
    ))
]

print("="*75)
print("DIRECT MRP LINE OCR")
print("="*75)

for name,img in tests:
    for psm in (6,7,11,13):
        text=pytesseract.image_to_string(
            img,
            config=(
                f"--psm {psm} "
                "-c tessedit_char_whitelist=0123456789./-Rs₹MRPINCL.OFALLTAXES()"
            )
        ).strip()

        print(f"{name:10} PSM={psm} -> {text!r}")
