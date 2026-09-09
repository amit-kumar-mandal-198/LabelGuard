from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.manufacturer_reference import ManufacturerReference


def create_manufacturer_reference(
    db: Session,
    data: dict,
) -> ManufacturerReference:
    reference = ManufacturerReference(
        **data
    )

    db.add(reference)
    db.commit()
    db.refresh(reference)

    return reference


def get_manufacturer_reference(
    db: Session,
    manufacturer_name: str,
) -> ManufacturerReference | None:
    statement = (
        select(ManufacturerReference)
        .where(
            ManufacturerReference.manufacturer_name
            == manufacturer_name
        )
        .order_by(
            ManufacturerReference.verified_at.desc().nullslast(),
            ManufacturerReference.created_at.desc(),
        )
        .limit(1)
    )

    return db.scalars(statement).first()


def get_manufacturer_reference_for_product(
    db: Session,
    product_id: int,
) -> ManufacturerReference | None:
    statement = (
        select(ManufacturerReference)
        .where(
            ManufacturerReference.product_id
            == product_id
        )
        .order_by(
            ManufacturerReference.verified_at.desc().nullslast(),
            ManufacturerReference.created_at.desc(),
        )
        .limit(1)
    )

    return db.scalars(statement).first()
