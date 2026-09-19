"""
Deep-scan the back image OCR for the context around the 27/10/26 date token.
"""
import sys, re, json
sys.path.insert(0, ".")
from pathlib import Path

from app.ai.ocr.ocr_engine import run_ocr

proc_path = Path("storage/processed/inspection_1_image_3_rot_180.png")

# Run both PSM modes
for psm in (6, 11):
    ocr = run_ocr(proc_path, psm=psm)
    text = ocr["text"]
    words = ocr["words"]

    print(f"\n=== PSM {psm} | {len(words)} words ===")
    print()

    # Find all words near 27/10/26
    DATE_RE = re.compile(r"27/10/26|27/10/2026", re.IGNORECASE)
    target_indices = [i for i, w in enumerate(words) if DATE_RE.search(w["text"])]
    print(f"Target date word indices: {target_indices}")

    for idx in target_indices:
        lo = max(0, idx - 10)
        hi = min(len(words), idx + 10)
        context_words = words[lo:hi]
        print(f"  Context around index {idx}:")
        for w in context_words:
            marker = " <-- TARGET" if DATE_RE.search(w["text"]) else ""
            print(f"    [{w.get('line_num','?')}] {repr(w['text'])} conf={w['confidence']} bbox={w['bbox']}{marker}")

    print()
    print("Full text snippet (chars around '27'):")
    pos = text.find("27/10")
    if pos >= 0:
        print(repr(text[max(0, pos-200):pos+100]))
    else:
        print("27/10 not found in text")

    print()
    # Broader expiry context scan
    DATE_CONTEXT_RE = re.compile(
        r"(.{0,80})(27/10/2[60]\d?|exp|use\s*by|best\s*before)(.{0,80})",
        re.IGNORECASE
    )
    for m in DATE_CONTEXT_RE.finditer(text):
        print(f"MATCH: ...{m.group(0)}...")
