from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.product_mrp_reference import ProductMRPReference


def create_product(
    db: Session,
    data: dict,
) -> Product:
    product = Product(**data)

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def get_product(
    db: Session,
    product_id: int,
) -> Product | None:
    return db.get(Product, product_id)


def list_products(
    db: Session,
) -> list[Product]:
    statement = (
        select(Product)
        .order_by(Product.created_at.desc())
    )

    return list(db.scalars(statement).all())


def create_mrp_reference(
    db: Session,
    product_id: int,
    data: dict,
) -> ProductMRPReference:

    product = db.get(Product, product_id)

    if product is None:
        raise LookupError("Product not found.")

    effective_from = data.pop("effective_from", None)
    effective_to = data.pop("effective_to", None)

    if effective_from:
        data["effective_from"] = date.fromisoformat(
            effective_from
        )

    if effective_to:
        data["effective_to"] = date.fromisoformat(
            effective_to
        )

    reference = ProductMRPReference(
        product_id=product_id,
        **data,
    )

    db.add(reference)
    db.commit()
    db.refresh(reference)

    return reference


def get_mrp_reference(
    db: Session,
    reference_id: int,
) -> ProductMRPReference | None:
    return db.get(
        ProductMRPReference,
        reference_id,
    )


def list_mrp_references(
    db: Session,
    product_id: int,
) -> list[ProductMRPReference]:

    statement = (
        select(ProductMRPReference)
        .where(
            ProductMRPReference.product_id == product_id
        )
        .order_by(
            ProductMRPReference.created_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )
