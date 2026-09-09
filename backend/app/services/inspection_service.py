from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inspection import Inspection, InspectionStatus
from app.models.user import User


def generate_reference_number() -> str:
    return f"LG-{uuid4().hex[:10].upper()}"


def create_inspection(
    db: Session,
    inspector: User,
    product_id: int | None = None,
) -> Inspection:
    inspection = Inspection(
        inspector_id=inspector.id,
        product_id=product_id,
        reference_number=generate_reference_number(),
        status=InspectionStatus.CREATED,
    )

    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    return inspection


def get_inspection(
    db: Session,
    inspection_id: int,
) -> Inspection | None:
    return db.get(Inspection, inspection_id)


def list_inspections(
    db: Session,
    inspector: User,
) -> list[Inspection]:
    statement = (
        select(Inspection)
        .where(Inspection.inspector_id == inspector.id)
        .order_by(Inspection.created_at.desc())
    )

    return list(db.scalars(statement).all())
