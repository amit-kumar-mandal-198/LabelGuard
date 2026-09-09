from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.inspection import Inspection
from app.models.user import User
from app.schemas.image import ImageResponse
from app.services.image_service import (
    create_inspection_image,
    list_inspection_images,
)


router = APIRouter(
    prefix="/inspections",
    tags=["Inspection Images"],
)


@router.post(
    "/{inspection_id}/images",
    response_model=ImageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def upload_inspection_image(
    inspection_id: int,
    image_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inspection = db.get(Inspection, inspection_id)

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
        return create_inspection_image(
            db=db,
            inspection_id=inspection_id,
            image_type=image_type,
            upload_file=file,
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
    "/{inspection_id}/images",
    response_model=list[ImageResponse],
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_inspection_images(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inspection = db.get(Inspection, inspection_id)

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

    return list_inspection_images(
        db=db,
        inspection_id=inspection_id,
    )
