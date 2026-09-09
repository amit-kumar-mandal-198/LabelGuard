"""
Scan existing processed images (already on disk from last pipeline run)
for BBE-related OCR evidence. No new image writes.
"""
import sys, re
sys.path.insert(0, ".")
from pathlib import Path

from app.ai.ocr.ocr_engine import run_ocr

BBE_PATTERN = re.compile(
    r"(best\s*before|use\s*by|exp(?:iry|iration)?|shelf.*?life|consume.*?before)",
    re.IGNORECASE,
)

PROCESSED_DIR = Path("storage/processed")

# Find all processed images for inspection 1
proc_images = sorted(PROCESSED_DIR.glob("inspection_1_image_*_rot_*.png"))
print(f"Processed images for inspection 1: {len(proc_images)}")
for p in proc_images:
    print(f"  {p.name}")

print()
for proc_path in proc_images:
    ocr = run_ocr(proc_path, psm=6)
    text = ocr["text"]
    words = ocr["words"]

    print(f"=== {proc_path.name} — {len(words)} words ===")
    print(text[:1500])
    print()

    bbe_matches = BBE_PATTERN.findall(text)
    print(f"BBE keyword matches: {bbe_matches}")

    date_words = [
        w for w in words
        if re.search(r"\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4}", w["text"])
    ]
    print(f"Date-like tokens ({len(date_words)}):")
    for dw in date_words:
        print(f"  text={repr(dw['text'])} conf={dw['confidence']}")
    print()
