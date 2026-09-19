from pathlib import Path

from app.ai.ocr.ocr_engine import run_multi_psm_ocr


IMAGE = Path(
    r"C:\Users\Lenovo\LABELGUARD\backend\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)


result = run_multi_psm_ocr(IMAGE)


print("=" * 90)
print("LABELGUARD — MULTI-PSM OCR TEST")
print("=" * 90)

for item in result["results"]:
    print("\n" + "-" * 90)
    print("PSM:", item["psm"])
    print("WORDS:", item["word_count"])

    print("\nOCR TEXT:")
    print(item["text"][:3000])
