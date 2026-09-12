from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.inspection import Inspection
from app.models.user import User
from app.services.analysis_service import analyze_inspection


router = APIRouter(
    prefix="/inspections",
    tags=["Analysis"],
)


@router.post(
    "/{inspection_id}/analyze",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles("admin", "inspector", "vendor"))],
)
def run_inspection_analysis(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    inspection = db.get(Inspection, inspection_id)

    if inspection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found",
        )

    if (
        current_user.role.name not in ("admin", "controller")
        and inspection.inspector_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inspection",
        )

    try:
        return analyze_inspection(
            db=db,
            inspection_id=inspection_id,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
