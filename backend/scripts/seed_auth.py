from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Role, User


ADMIN_EMAIL = "admin@labelguard.local"
ADMIN_PASSWORD = "Admin@LabelGuard2026"


def seed_roles_and_admin() -> None:
    db = SessionLocal()

    try:
        # Create roles if they do not exist.
        admin_role = db.scalar(
            select(Role).where(Role.name == "admin")
        )

        if admin_role is None:
            admin_role = Role(
                name="admin",
                description="System administrator",
            )
            db.add(admin_role)
            db.flush()

        inspector_role = db.scalar(
            select(Role).where(Role.name == "inspector")
        )

        if inspector_role is None:
            inspector_role = Role(
                name="inspector",
                description="Legal Metrology inspection officer",
            )
            db.add(inspector_role)
            db.flush()

        # Create admin user if it does not exist.
        admin_user = db.scalar(
            select(User).where(User.email == ADMIN_EMAIL)
        )

        if admin_user is None:
            admin_user = User(
                role_id=admin_role.id,
                full_name="LABELGUARD Administrator",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                is_active=True,
            )
            db.add(admin_user)
            print("Admin user created.")
        else:
            print("Admin user already exists.")

        db.commit()

        print("Roles and admin seed completed.")
        print(f"Admin email: {ADMIN_EMAIL}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_roles_and_admin()
