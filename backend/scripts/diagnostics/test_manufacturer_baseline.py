import json
from pathlib import Path

from app.ai.extraction.declaration_extractor import extract_declarations
from app.ai.ocr.ocr_engine import run_ocr

image_path = Path(r".\storage\uploads\ocr_benchmark_clear.jpeg")

result = run_ocr(str(image_path), psm=11)
declarations = extract_declarations(result)

print("=" * 75)
print("MANUFACTURER BASELINE")
print("=" * 75)
print(json.dumps(
    declarations["fields"]["manufacturer"],
    indent=2,
    ensure_ascii=False,
))
