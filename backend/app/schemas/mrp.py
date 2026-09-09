from typing import Any

from pydantic import BaseModel, ConfigDict


class MRPReferenceEvidence(BaseModel):
    reference_id: int | None = None
    reference_mrp: float | None = None
    currency: str | None = None
    source_type: str | None = None
    source_reference: str | None = None
    pack_quantity: float | None = None
    pack_unit: str | None = None
    variant: str | None = None
    version: str | None = None
    effective_from: str | None = None
    effective_to: str | None = None


class MRPDetectionEvidence(BaseModel):
    field: str | None = None
    score: float | None = None
    anchor: str | None = None
    raw_value: str | None = None
    currency: str | None = None
    orientation: int | None = None
    preprocess: str | None = None
    psm: int | None = None
    roi: dict[str, int] | None = None
    ocr_context: str | None = None


class MRPTamperSignal(BaseModel):
    name: str
    score: float
    reason: str


class MRPTamperEvidence(BaseModel):
    status: str
    risk_score: float
    signals: list[MRPTamperSignal] = []


class MRPFindingResponse(BaseModel):
    id: int
    inspection_id: int
    image_id: int | None

    declared_mrp: float | None
    reference_mrp: float | None
    price_status: str
    difference_amount: float | None
    reference_source: str | None

    tamper_status: str
    tamper_risk_score: float

    decision: str
    reason: str | None

    evidence: dict[str, Any] | None

    model_config = ConfigDict(from_attributes=True)
