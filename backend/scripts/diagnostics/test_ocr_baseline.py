from pathlib import Path

from app.ai.ocr.ocr_pipeline import run_preprocessed_ocr


IMAGE = Path(
    r"C:\Users\Lenovo\LABELGUARD\backend\storage\uploads\0e6d339b89604996ad0bc7806de8ffd9.png"
)

result = run_preprocessed_ocr(IMAGE)

print("=" * 90)
print("LABELGUARD — OCR BASELINE")
print("=" * 90)

print("IMAGE:", IMAGE.name)
print("BEST ANGLE:", result["best_angle"])
print("BEST VARIANT:", result["best_variant"])
print("BEST SCORE:", result["score"])
print("QUALITY:", result["quality"])

print("\nBEST OCR TEXT:")
print("-" * 90)
print(result["ocr"]["text"])

print("\nCANDIDATES:")
print("-" * 90)

for candidate in result["candidates"]:
    print(
        f"angle={candidate['angle']:>3} | "
        f"variant={candidate['variant']:<12} | "
        f"score={candidate['score']:>7} | "
        f"words={candidate['word_count']:>4} | "
        f"status={candidate['quality_status']}"
    )
