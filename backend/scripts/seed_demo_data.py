import sys
from datetime import datetime, date
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.db.session import engine, SessionLocal, Base
from app.core.security import hash_password
from app.models import (
    Role,
    User,
    Product,
    ProductBarcode,
    ProductMRPReference,
    Inspection,
    Declaration,
    MRPFinding,
    Violation,
    RuleVersion,
)
from app.models.inspection import InspectionStatus, ComplianceStatus
from app.seed.legal_metrology_seed import seed_legal_metrology_rules

def seed_all():
    print("Creating all tables in SQLite database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding roles...")
        roles_data = [
            ("admin", "National Administrator"),
            ("inspector", "Legal Metrology Field Inspector"),
            ("vendor", "Packaged Commodity Vendor Administrator"),
            ("controller", "District Controller (LM)"),
            ("auditor", "Compliance & Audit Observer"),
        ]
        role_map = {}
        for r_name, r_desc in roles_data:
            role = db.scalar(select(Role).where(Role.name == r_name))
            if not role:
                role = Role(name=r_name, description=r_desc)
                db.add(role)
                db.flush()
            role_map[r_name] = role

        print("Seeding default users...")
        users_data = [
            ("admin@labelguard.local", "Admin@LabelGuard2026", "National Administrator", "admin"),
            ("inspector@labelguard.local", "Inspector@2026", "Field Inspector Priya Sharma", "inspector"),
            ("vendor@labelguard.local", "Vendor@2026", "Britannia Industries Compliance Team", "vendor"),
            ("controller@labelguard.local", "Controller@2026", "District Controller Rajesh Verma", "controller"),
            ("auditor@labelguard.local", "Auditor@2026", "Audit Observer Ananya Roy", "auditor"),
        ]
        user_map = {}
        for email, pwd, name, r_name in users_data:
            user = db.scalar(select(User).where(User.email == email))
            if not user:
                user = User(
                    role_id=role_map[r_name].id,
                    full_name=name,
                    email=email,
                    password_hash=hash_password(pwd),
                    is_active=True,
                )
                db.add(user)
                db.flush()
            user_map[email] = user

        print("Seeding Legal Metrology rules...")
        seed_legal_metrology_rules(db)

        print("Seeding benchmark products and inspections...")
        # Check if inspections exist
        existing_insp = db.scalar(select(Inspection).limit(1))
        if not existing_insp:
            # 1. Compliant Product
            p1 = Product(
                product_name="Britannia Marie Gold Biscuit 250g",
                brand_name="Britannia",
                category="Biscuits & Bakery",
                package_type="Laminated Pouch",
                manufacturer_name="Britannia Industries Limited",
                manufacturer_address="5/1A Hungerford Street, Kolkata - 700017, West Bengal",
            )
            db.add(p1)
            db.flush()

            db.add(ProductBarcode(product_id=p1.id, barcode_value="8901063012818", barcode_type="EAN-13"))
            db.add(ProductMRPReference(product_id=p1.id, reference_mrp=45.0, pack_quantity=250.0, pack_unit="g", source_type="manufacturer"))

            insp1 = Inspection(
                inspector_id=user_map["inspector@labelguard.local"].id,
                product_id=p1.id,
                reference_number="INSP-2026-001",
                status=InspectionStatus.COMPLETED,
                compliance_status=ComplianceStatus.COMPLIANT,
            )
            db.add(insp1)
            db.flush()

            # Declarations for insp1
            for field, val in [
                ("mrp", "45.00"),
                ("net_quantity", "250 g"),
                ("mfg_date", "08/2026"),
                ("best_before", "02/2027"),
                ("manufacturer", "Britannia Industries Limited"),
                ("consumer_care", "1800-425-4449, feedback@britindia.com"),
                ("country_of_origin", "India"),
                ("commodity_name", "Biscuits"),
            ]:
                db.add(Declaration(
                    inspection_id=insp1.id,
                    field_name=field,
                    extracted_value=val,
                    normalized_value=val,
                    is_present=True,
                    confidence=0.98,
                ))

            db.add(MRPFinding(
                inspection_id=insp1.id,
                declared_mrp=45.0,
                reference_mrp=45.0,
                price_status="MATCH",
                difference_amount=0.0,
                tamper_status="NOT_SUSPECTED",
                tamper_risk_score=0.02,
                decision="COMPLIANT",
                reason="Declared MRP matches manufacturer database and tamper-free.",
            ))

            # 2. Non-Compliant Product (Font height violation)
            p2 = Product(
                product_name="Sunfeast Dark Fantasy Choco Fills 300g",
                brand_name="Sunfeast",
                category="Biscuits & Bakery",
                package_type="Mono Carton",
                manufacturer_name="ITC Limited",
                manufacturer_address="37 J.L. Nehru Road, Kolkata - 700071",
            )
            db.add(p2)
            db.flush()

            insp2 = Inspection(
                inspector_id=user_map["inspector@labelguard.local"].id,
                product_id=p2.id,
                reference_number="INSP-2026-002",
                status=InspectionStatus.COMPLETED,
                compliance_status=ComplianceStatus.NON_COMPLIANT,
            )
            db.add(insp2)
            db.flush()

            for field, val in [
                ("mrp", "120.00"),
                ("net_quantity", "300 g"),
                ("mfg_date", "07/2026"),
                ("manufacturer", "ITC Limited"),
                ("consumer_care", "itccares@itc.in"),
            ]:
                db.add(Declaration(
                    inspection_id=insp2.id,
                    field_name=field,
                    extracted_value=val,
                    normalized_value=val,
                    is_present=True,
                    confidence=0.92,
                ))

            rule_leg = db.scalar(select(RuleVersion).where(RuleVersion.rule_code == "LG-LEGIBILITY"))
            rule_id = rule_leg.id if rule_leg else 1

            db.add(Violation(
                inspection_id=insp2.id,
                rule_version_id=rule_id,
                field_name="font_height",
                severity="major",
                status="open",
                message="Declaration font height below 2.0mm statutory threshold for 300g category.",
            ))

            db.add(MRPFinding(
                inspection_id=insp2.id,
                declared_mrp=120.0,
                reference_mrp=120.0,
                price_status="MATCH",
                difference_amount=0.0,
                tamper_status="NOT_SUSPECTED",
                tamper_risk_score=0.05,
                decision="NON_COMPLIANT",
                reason="Declaration font height below 2.0mm statutory threshold for 300g category.",
            ))

            # 3. Tampered Dual-MRP Product
            p3 = Product(
                product_name="FreshMeadow Pure Honey 500g",
                brand_name="FreshMeadow",
                category="Honey & Spreads",
                package_type="Glass Jar",
                manufacturer_name="FreshMeadow Organics Pvt Ltd",
                manufacturer_address="Plot 14, Industrial Area, Ghaziabad, UP",
            )
            db.add(p3)
            db.flush()

            insp3 = Inspection(
                inspector_id=user_map["inspector@labelguard.local"].id,
                product_id=p3.id,
                reference_number="INSP-2026-003",
                status=InspectionStatus.COMPLETED,
                compliance_status=ComplianceStatus.NON_COMPLIANT,
            )
            db.add(insp3)
            db.flush()

            for field, val in [
                ("mrp", "320.00"),
                ("net_quantity", "500 g"),
                ("mfg_date", "06/2026"),
                ("manufacturer", "FreshMeadow Organics Pvt Ltd"),
            ]:
                db.add(Declaration(
                    inspection_id=insp3.id,
                    field_name=field,
                    extracted_value=val,
                    normalized_value=val,
                    is_present=True,
                    confidence=0.88,
                ))

            rule_mrp = db.scalar(select(RuleVersion).where(RuleVersion.rule_code == "LG-MRP"))
            rule_mrp_id = rule_mrp.id if rule_mrp else 2

            db.add(Violation(
                inspection_id=insp3.id,
                rule_version_id=rule_mrp_id,
                field_name="mrp",
                severity="critical",
                status="open",
                message="Critical: Scratched packaging overlay detected over statutory Rs 280 MRP.",
            ))

            db.add(MRPFinding(
                inspection_id=insp3.id,
                declared_mrp=320.0,
                reference_mrp=280.0,
                price_status="MISMATCH",
                difference_amount=40.0,
                tamper_status="TAMPERED",
                tamper_risk_score=0.92,
                decision="NON_COMPLIANT",
                reason="Critical: Scratched packaging overlay detected over statutory Rs 280 MRP.",
            ))

        db.commit()
        print("Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print("Seeding error:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
