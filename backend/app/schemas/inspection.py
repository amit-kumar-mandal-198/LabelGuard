from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.inspection import ComplianceStatus, InspectionStatus


class InspectionCreate(BaseModel):
    product_id: int | None = None


class InspectionResponse(BaseModel):
    id: int
    inspector_id: int
    product_id: int | None
    reference_number: str
    status: InspectionStatus
    compliance_status: ComplianceStatus
    created_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
