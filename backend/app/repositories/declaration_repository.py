from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.declaration import Declaration


def get_declarations_for_inspection(
    db: Session,
    inspection_id: int,
) -> list[Declaration]:
    statement = (
        select(Declaration)
        .where(
            Declaration.inspection_id == inspection_id
        )
        .order_by(
            Declaration.id.asc()
        )
    )

    return list(db.scalars(statement).all())
