from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.role import Role
from app.models.user import User


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = db.scalar(
        select(User).where(User.email == email.lower().strip())
    )

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_login_token(user: User) -> str:
    return create_access_token(str(user.id))


def register_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
    role_name: str = "vendor",
    designation: str | None = None,
    department: str | None = None,
    district: str | None = None,
    state: str | None = None,
    company_name: str | None = None,
    gst_number: str | None = None,
    lut_number: str | None = None,
    badge_number: str | None = None,
    entity_category: str | None = None,
    address: str | None = None,
    organization: str | None = None,
) -> User:
    normalized_email = email.lower().strip()
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise ValueError("A user with this email already exists")

    role = db.scalar(select(Role).where(Role.name == role_name.lower().strip()))
    if role is None:
        role = Role(name=role_name.lower().strip(), description=f"{role_name.capitalize()} role")
        db.add(role)
        db.flush()

    new_user = User(
        role_id=role.id,
        full_name=full_name.strip(),
        email=normalized_email,
        password_hash=hash_password(password),
        is_active=True,
        designation=designation,
        department=department,
        district=district,
        state=state,
        company_name=company_name,
        gst_number=gst_number,
        lut_number=lut_number,
        badge_number=badge_number,
        entity_category=entity_category,
        address=address,
        organization=organization,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

