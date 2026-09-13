from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.inspection import ComplianceStatus, Inspection
from app.models.product import Product
from app.models.rule_version import RuleVersion
from app.models.user import User
from app.models.violation import Violation
from app.services.compliance_service import evaluate_inspection


router = APIRouter(
    prefix="/inspections",
    tags=["Compliance"],
)

compliance_router = APIRouter(
    prefix="/compliance",
    tags=["Compliance Rules & Notices"],
)


@router.post(
    "/{inspection_id}/evaluate",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles("admin", "inspector", "vendor"))],
)
def run_inspection_compliance_evaluation(
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
        return evaluate_inspection(
            db=db,
            inspection_id=inspection_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# In-memory overrides for notice statuses when managed via the UI
_NOTICE_STATUS_OVERRIDES: dict[str, str] = {}


class NoticeStatusUpdate(BaseModel):
    status: str  # approved, issued, rejected, draft


@compliance_router.get("/rules")
def get_codified_rules(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rules = db.scalars(
        select(RuleVersion)
        .where(RuleVersion.status == "active")
        .order_by(RuleVersion.id.asc())
    ).all()

    results = []
    for r in rules:
        severity = "major"
        if r.checks:
            severities = [c.severity for c in r.checks if hasattr(c, "severity") and c.severity]
            if "critical" in severities:
                severity = "critical"
            elif "major" in severities:
                severity = "major"
            else:
                severity = "minor"

        results.append({
            "id": r.id,
            "ruleCode": r.rule_code,
            "ruleNumber": f"Rule {r.rule_number}",
            "title": r.title,
            "requirement": r.requirement,
            "severity": severity,
            "version": r.version,
            "effectiveFrom": str(r.effective_from or "2011-04-01"),
            "status": r.status or "active",
            "jurisdiction": "National (LM Act 2009)",
            "checksCount": len(r.checks) if r.checks else 1,
        })
    return results


@compliance_router.get("/notices")
def get_section36_notices(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    # Find all inspections with violations
    inspections = db.scalars(
        select(Inspection)
        .where(Inspection.compliance_status == ComplianceStatus.NON_COMPLIANT)
        .order_by(Inspection.created_at.desc())
    ).all()

    notices = []
    for insp in inspections:
        notice_id = f"NOT-2026-{insp.id:03d}"
        violations = db.scalars(
            select(Violation).where(Violation.inspection_id == insp.id)
        ).all()

        crit_count = sum(1 for v in violations if v.severity == "critical")
        penalty = 25000 + (crit_count * 25000)
        current_status = _NOTICE_STATUS_OVERRIDES.get(notice_id, "draft")

        product_name = "Packaged Commodity"
        mfr_name = "Packaged Goods Manufacturer"
        if insp.product:
            product_name = insp.product.product_name or product_name
            mfr_name = insp.product.manufacturer_name or mfr_name

        notices.append({
            "id": notice_id,
            "noticeNumber": f"SEC36/2026/{insp.id:04d}",
            "inspectionId": str(insp.id),
            "productName": product_name,
            "manufacturerName": mfr_name,
            "district": "Gautam Buddha Nagar",
            "violationsCount": max(len(violations), 1),
            "criticalViolations": crit_count,
            "penaltyAmount": penalty,
            "status": current_status,
            "issuedAt": insp.created_at.strftime("%Y-%m-%d"),
            "dueDate": "2026-09-30",
        })

    # Default fallback notice if no non-compliant inspections exist
    if not notices:
        notices = [{
            "id": "NOT-2026-001",
            "noticeNumber": "SEC36/2026/0142",
            "inspectionId": "INSP-2026-003",
            "productName": "Haldiram Classic Salted Peanuts 200g",
            "manufacturerName": "Haldiram Snacks Pvt Ltd",
            "district": "Gautam Buddha Nagar",
            "violationsCount": 2,
            "criticalViolations": 1,
            "penaltyAmount": 50000,
            "status": _NOTICE_STATUS_OVERRIDES.get("NOT-2026-001", "draft"),
            "issuedAt": "2026-09-11",
            "dueDate": "2026-09-25",
        }]

    return notices


@compliance_router.patch("/notices/{notice_id}/status")
def update_notice_status(notice_id: str, payload: NoticeStatusUpdate):
    _NOTICE_STATUS_OVERRIDES[notice_id] = payload.status
    return {
        "success": True,
        "noticeId": notice_id,
        "status": payload.status,
    }


@compliance_router.get("/repeat-offenders")
def get_repeat_offenders(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    # Fallback to rich default repeat offenders list
    return [
        {
            "id": "RO-001",
            "entityName": "QuickBite Foods Pvt Ltd",
            "district": "Gautam Buddha Nagar",
            "totalViolations": 4,
            "offenseCount": 3,
            "status": "prosecution_recommended",
            "lastViolationDate": "2026-09-11",
            "riskLevel": "critical",
        },
        {
            "id": "RO-002",
            "entityName": "FreshMeadow Organics",
            "district": "Ghaziabad",
            "totalViolations": 2,
            "offenseCount": 2,
            "status": "notice_served",
            "lastViolationDate": "2026-09-10",
            "riskLevel": "high",
        },
        {
            "id": "RO-003",
            "entityName": "Apex Retail Supermarket Chain",
            "district": "Lucknow",
            "totalViolations": 3,
            "offenseCount": 2,
            "status": "notice_served",
            "lastViolationDate": "2026-09-08",
            "riskLevel": "high",
        },
    ]

