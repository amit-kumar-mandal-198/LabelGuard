from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product_barcode import ProductBarcode


def create_barcode(
    db: Session,
    data: dict,
) -> ProductBarcode:
    barcode = ProductBarcode(**data)

    db.add(barcode)
    db.commit()
    db.refresh(barcode)

    return barcode


def get_barcode_by_value(
    db: Session,
    barcode_value: str,
) -> ProductBarcode | None:
    statement = (
        select(ProductBarcode)
        .where(
            ProductBarcode.barcode_value == barcode_value
        )
        .limit(1)
    )

    return db.scalars(statement).first()


def list_product_barcodes(
    db: Session,
    product_id: int,
) -> list[ProductBarcode]:
    statement = (
        select(ProductBarcode)
        .where(
            ProductBarcode.product_id == product_id
        )
        .order_by(
            ProductBarcode.created_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )
