from getpass import getpass

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import User
from app.core.security import hash_password


EMAIL = "admin@labelguard.local"


def main():
    password = getpass(
        "Enter new admin password: "
    )

    confirm = getpass(
        "Confirm new admin password: "
    )

    if len(password) < 8:
        raise ValueError(
            "Password must be at least 8 characters."
        )

    if password != confirm:
        raise ValueError(
            "Passwords do not match."
        )

    db: Session = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(
                User.email == EMAIL
            )
            .first()
        )

        if user is None:
            raise LookupError(
                f"Admin user not found: {EMAIL}"
            )

        user.password_hash = hash_password(
            password
        )

        user.is_active = True

        db.commit()

        print(
            "\nADMIN PASSWORD RESET: SUCCESS"
        )
        print(
            "EMAIL:",
            user.email,
        )
        print(
            "ROLE:",
            user.role.name,
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()
