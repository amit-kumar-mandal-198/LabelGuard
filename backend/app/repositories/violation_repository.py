from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.violation import Violation


def create_violation(
    db: Session,
    data: dict,
) -> Violation:
    violation = Violation(**data)

    db.add(violation)
    db.commit()
    db.refresh(violation)

    return violation


def get_violations_for_inspection(
    db: Session,
    inspection_id: int,
) -> list[Violation]:
    statement = (
        select(Violation)
        .where(
            Violation.inspection_id == inspection_id
        )
        .order_by(
            Violation.created_at.asc(),
            Violation.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def get_open_violations(
    db: Session,
    inspection_id: int,
) -> list[Violation]:
    statement = (
        select(Violation)
        .where(
            Violation.inspection_id == inspection_id,
            Violation.status == "open",
        )
        .order_by(
            Violation.severity.desc(),
            Violation.created_at.asc(),
        )
    )

    return list(db.scalars(statement).all())


def clear_violations_for_inspection(
    db: Session,
    inspection_id: int,
) -> None:
    statement = delete(Violation).where(
        Violation.inspection_id == inspection_id
    )

    db.execute(statement)
    db.commit()
