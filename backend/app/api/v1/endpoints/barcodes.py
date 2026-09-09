from pathlib import Path
import tempfile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.barcode_verification import BarcodeVerificationRequest
from app.schemas.barcode import (
    BarcodeCreate,
    BarcodeProductResponse,
    BarcodeResponse,
)
from app.services.barcode_service import barcode_service
from app.services.product_verification_service import cross_validate_product_identity


router = APIRouter(
    prefix="/barcodes",
    tags=["Barcodes"],
)


@router.post(
    "/decode",
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
async def decode_barcode(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    suffix = Path(file.filename or "").suffix or ".jpg"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False,
        ) as temp_file:
            temp_path = Path(
                temp_file.name
            )
            temp_file.write(
                await file.read()
            )

        return barcode_service.detect(
            temp_path
        )

    except (
        FileNotFoundError,
        ValueError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    finally:
        if temp_path is not None:
            temp_path.unlink(
                missing_ok=True
            )


@router.post(
    "",
    response_model=BarcodeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def create_barcode_mapping(
    payload: BarcodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return barcode_service.save_barcode(
            db=db,
            product_id=payload.product_id,
            barcode_value=payload.barcode_value,
            barcode_type=payload.barcode_type,
            source_type=payload.source_type,
            source_reference=payload.source_reference,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{barcode_value}/verify",
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def verify_barcode_product(
    barcode_value: str,
    payload: BarcodeVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = barcode_service.lookup_product_with_barcode(
        db=db,
        barcode_value=barcode_value,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barcode mapping or product not found",
        )

    return cross_validate_product_identity(
        ocr_manufacturer=payload.ocr_manufacturer,
        ocr_address=payload.ocr_address,
        barcode_product=product,
    )


@router.get(
    "/{barcode_value}",
    response_model=BarcodeProductResponse,
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_barcode_product(
    barcode_value: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = barcode_service.lookup_product_with_barcode(
        db=db,
        barcode_value=barcode_value,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barcode mapping or product not found",
        )

    return result


@router.get(
    "/product/{product_id}",
    response_model=list[BarcodeResponse],
    dependencies=[Depends(require_roles("admin", "inspector"))],
)
def get_product_barcodes(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return barcode_service.list_barcodes_for_product(
        db=db,
        product_id=product_id,
    )

