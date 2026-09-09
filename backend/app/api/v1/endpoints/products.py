from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductMRPReferenceCreate,
    ProductMRPReferenceResponse,
    ProductResponse,
)
from app.services.product_service import (
    create_mrp_reference,
    create_product,
    get_mrp_reference,
    get_product,
    list_mrp_references,
    list_products,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def create_new_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_product(
        db=db,
        data=payload.model_dump(),
    )


@router.get(
    "",
    response_model=list[ProductResponse],
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_products(db=db)


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_single_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_product(
        db=db,
        product_id=product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


@router.post(
    "/{product_id}/mrp-references",
    response_model=ProductMRPReferenceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_product_mrp_reference(
    product_id: int,
    payload: ProductMRPReferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return create_mrp_reference(
            db=db,
            product_id=product_id,
            data=payload.model_dump(),
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{product_id}/mrp-references",
    response_model=list[ProductMRPReferenceResponse],
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_product_mrp_references(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_product(
        db=db,
        product_id=product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return list_mrp_references(
        db=db,
        product_id=product_id,
    )


@router.get(
    "/mrp-references/{reference_id}",
    response_model=ProductMRPReferenceResponse,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_single_mrp_reference(
    reference_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reference = get_mrp_reference(
        db=db,
        reference_id=reference_id,
    )

    if reference is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MRP reference not found",
        )

    return reference
