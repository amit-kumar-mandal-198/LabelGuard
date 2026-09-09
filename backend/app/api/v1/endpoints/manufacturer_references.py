from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.manufacturer_reference import (
    ManufacturerReferenceCreate,
    ManufacturerReferenceResponse,
)
from app.services.manufacturer_reference_service import (
    add_manufacturer_reference,
    get_reference_for_manufacturer,
    get_reference_for_product,
)


router = APIRouter(
    prefix="/manufacturer-references",
    tags=["Manufacturer References"],
)


@router.post(
    "",
    response_model=ManufacturerReferenceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_manufacturer_reference(
    payload: ManufacturerReferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return add_manufacturer_reference(
        db=db,
        manufacturer_name=payload.manufacturer_name,
        manufacturer_address=payload.manufacturer_address,
        source_type=payload.source_type,
        source_reference=payload.source_reference,
        product_id=payload.product_id,
    )


@router.get(
    "/product/{product_id}",
    response_model=ManufacturerReferenceResponse,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_product_manufacturer_reference(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reference = get_reference_for_product(
        db=db,
        product_id=product_id,
    )

    if reference is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer reference not found",
        )

    return reference


@router.get(
    "/manufacturer/{manufacturer_name}",
    response_model=ManufacturerReferenceResponse,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_manufacturer_reference_by_name(
    manufacturer_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reference = get_reference_for_manufacturer(
        db=db,
        manufacturer_name=manufacturer_name,
    )

    if reference is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer reference not found",
        )

    return reference
