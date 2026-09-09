import traceback
from app.db.session import SessionLocal
from app.services.inspection_mrp_service import process_inspection_mrp

db = SessionLocal()

try:
    result = process_inspection_mrp(
        db=db,
        inspection_id=1,
        pack_quantity=17,
        pack_unit="g",
        variant="standard",
    )

    print("SUCCESS")
    print("Finding ID:", result.id)
    print("Declared MRP:", result.declared_mrp)
    print("Reference MRP:", result.reference_mrp)
    print("Price Status:", result.price_status)
    print("Decision:", result.decision)

except Exception:
    db.rollback()
    print("\n===== EXACT MRP SERVICE ERROR =====")
    traceback.print_exc()

finally:
    db.close()
