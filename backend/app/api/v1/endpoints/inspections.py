from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.inspection import InspectionCreate, InspectionResponse
from app.schemas.mrp import MRPFindingResponse
from app.services.inspection_mrp_service import process_inspection_mrp
from app.services.inspection_service import (
    create_inspection,
    get_inspection,
    list_inspections,
)


router = APIRouter(
    prefix="/inspections",
    tags=["Inspections"],
)


@router.post(
    "",
    response_model=InspectionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def create_new_inspection(
    payload: InspectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_inspection(
        db=db,
        inspector=current_user,
        product_id=payload.product_id,
    )


@router.get(
    "",
    response_model=list[InspectionResponse],
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_inspections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_inspections(
        db=db,
        inspector=current_user,
    )


@router.get(
    "/{inspection_id}",
    response_model=InspectionResponse,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_single_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inspection = get_inspection(
        db=db,
        inspection_id=inspection_id,
    )

    if inspection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found",
        )

    if (
        inspection.inspector_id != current_user.id
        and current_user.role.name != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inspection",
        )

    return inspection


@router.post(
    "/{inspection_id}/process-mrp",
    response_model=MRPFindingResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def process_mrp(
    inspection_id: int,
    pack_quantity: float | None = None,
    pack_unit: str | None = None,
    variant: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inspection = get_inspection(
        db=db,
        inspection_id=inspection_id,
    )

    if inspection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found",
        )

    if (
        inspection.inspector_id != current_user.id
        and current_user.role.name != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inspection",
        )

    try:
        return process_inspection_mrp(
            db=db,
            inspection_id=inspection_id,
            pack_quantity=pack_quantity,
            pack_unit=pack_unit,
            variant=variant,
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
