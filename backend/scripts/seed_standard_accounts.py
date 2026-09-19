import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User

STANDARD_ROLES = [
    ("admin", "National Administrator"),
    ("inspector", "Legal Metrology Field Inspector"),
    ("vendor", "Packaged Commodity Vendor Administrator"),
    ("controller", "District Controller (LM)"),
    ("auditor", "Compliance & Audit Observer"),
]

DEMO_ACCOUNTS = [
    {
        "role": "vendor",
        "email": "vendor@labelguard.gov.in",
        "full_name": "NutriRich Foods Compliance Admin",
        "password": "demo1234",
        "company_name": "NutriRich Foods Private Limited",
        "gst_number": "09AAACN8841F1ZS",
        "lut_number": "LUT/2026/UP/0491",
        "entity_category": "Manufacturer / Packer",
        "address": "Plot 42, Ecotech III, Greater Noida, UP 201306",
    },
    {
        "role": "inspector",
        "email": "inspector@labelguard.gov.in",
        "full_name": "Inspector Rajesh Sharma",
        "password": "demo1234",
        "badge_number": "LMI-UP-2024-8841",
        "district": "Gautam Buddha Nagar",
        "state": "Uttar Pradesh",
        "designation": "Field Enforcement Officer",
    },
    {
        "role": "controller",
        "email": "controller@labelguard.gov.in",
        "full_name": "Dr. V. K. Malhotra",
        "password": "demo1234",
        "designation": "Assistant Controller (Legal Metrology)",
        "district": "Gautam Buddha Nagar",
        "state": "Uttar Pradesh",
    },
    {
        "role": "admin",
        "email": "admin@labelguard.gov.in",
        "full_name": "National Administrator",
        "password": "demo1234",
        "designation": "Director, Dept. of Legal Metrology",
        "department": "Ministry of Consumer Affairs",
    },
    {
        "role": "auditor",
        "email": "auditor@labelguard.gov.in",
        "full_name": "Independent Quality Audit Cell",
        "password": "demo1234",
        "organization": "National Standards Audit Bureau",
    },
]

def seed():
    db = SessionLocal()
    try:
        role_map = {}
        for role_name, desc in STANDARD_ROLES:
            role = db.scalar(select(Role).where(Role.name == role_name))
            if not role:
                role = Role(name=role_name, description=desc)
                db.add(role)
                db.flush()
            role_map[role_name] = role

        for acc in DEMO_ACCOUNTS:
            email = acc["email"].lower().strip()
            user = db.scalar(select(User).where(User.email == email))
            role = role_map[acc["role"]]
            pwd_hash = hash_password(acc["password"])

            if not user:
                user = User(
                    role_id=role.id,
                    email=email,
                    full_name=acc["full_name"],
                    password_hash=pwd_hash,
                    is_active=True,
                    designation=acc.get("designation"),
                    department=acc.get("department"),
                    district=acc.get("district"),
                    state=acc.get("state"),
                    company_name=acc.get("company_name"),
                    gst_number=acc.get("gst_number"),
                    lut_number=acc.get("lut_number"),
                    badge_number=acc.get("badge_number"),
                    entity_category=acc.get("entity_category"),
                    address=acc.get("address"),
                    organization=acc.get("organization"),
                )
                db.add(user)
                print(f"Created demo user: {email} (role: {acc['role']})")
            else:
                user.password_hash = pwd_hash
                user.role_id = role.id
                user.full_name = acc["full_name"]
                user.designation = acc.get("designation") or user.designation
                user.department = acc.get("department") or user.department
                user.district = acc.get("district") or user.district
                user.state = acc.get("state") or user.state
                user.company_name = acc.get("company_name") or user.company_name
                user.gst_number = acc.get("gst_number") or user.gst_number
                user.lut_number = acc.get("lut_number") or user.lut_number
                user.badge_number = acc.get("badge_number") or user.badge_number
                user.entity_category = acc.get("entity_category") or user.entity_category
                user.address = acc.get("address") or user.address
                user.organization = acc.get("organization") or user.organization
                print(f"Updated demo user password and details: {email}")

        db.commit()
        print("Standard accounts seed completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
