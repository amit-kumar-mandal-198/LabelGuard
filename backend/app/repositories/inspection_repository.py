from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inspection import Inspection


def get_inspection(
    db: Session,
    inspection_id: int,
) -> Inspection | None:
    statement = (
        select(Inspection)
        .where(
            Inspection.id == inspection_id
        )
        .limit(1)
    )

    return db.scalars(statement).first()


def update_compliance_status(
    db: Session,
    inspection: Inspection,
    compliance_status,
) -> Inspection:
    inspection.compliance_status = compliance_status

    db.commit()
    db.refresh(inspection)

    return inspection
