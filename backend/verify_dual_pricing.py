from sqlalchemy import delete, select
from app.db.session import SessionLocal
from app.models import ProductMRPReference
from app.services.inspection_mrp_service import process_inspection_mrp

db = SessionLocal()

try:
    print("=" * 75)
    print("DUAL PRICING VERIFICATION")
    print("=" * 75)

    # 1. Create temporary ₹10 reference for the same product/package.
    temp = ProductMRPReference(
        product_id=1,
        pack_quantity=17,
        pack_unit="g",
        variant="standard",
        reference_mrp=10,
        currency="INR",
        source_type="dual_price_test",
        source_reference="TEMP-DUAL-TEST",
        version="TEST",
    )

    db.add(temp)
    db.commit()
    db.refresh(temp)

    print("\nTEMP REFERENCE CREATED")
    print("Reference ID:", temp.id)
    print("Reference MRP: ₹10")

    # 2. Process inspection against temporary ₹10 reference.
    mismatch = process_inspection_mrp(
        db=db,
        inspection_id=1,
        pack_quantity=17,
        pack_unit="g",
        variant="standard",
    )

    print("\nMISMATCH TEST")
    print("Declared MRP :", mismatch.declared_mrp)
    print("Reference MRP:", mismatch.reference_mrp)
    print("Status       :", mismatch.price_status)
    print("Difference   :", mismatch.difference_amount)
    print("Decision     :", mismatch.decision)

    # 3. Remove temporary reference.
    db.delete(temp)
    db.commit()

    print("\nTEMP REFERENCE REMOVED")

    # 4. Restore original ₹5 reference result.
    restored = process_inspection_mrp(
        db=db,
        inspection_id=1,
        pack_quantity=17,
        pack_unit="g",
        variant="standard",
    )

    print("\nRESTORED ORIGINAL RESULT")
    print("Declared MRP :", restored.declared_mrp)
    print("Reference MRP:", restored.reference_mrp)
    print("Status       :", restored.price_status)
    print("Difference   :", restored.difference_amount)
    print("Decision     :", restored.decision)

    print("\n" + "=" * 75)

except Exception:
    db.rollback()
    raise

finally:
    db.close()
