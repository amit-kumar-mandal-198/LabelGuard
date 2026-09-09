from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class InspectionStatus(str, Enum):
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ComplianceStatus(str, Enum):
    PENDING = "pending"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    REVIEW = "review"


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[int] = mapped_column(primary_key=True)

    inspector_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reference_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    status: Mapped[InspectionStatus] = mapped_column(
        SQLEnum(InspectionStatus, name="inspection_status"),
        default=InspectionStatus.CREATED,
        nullable=False,
    )

    compliance_status: Mapped[ComplianceStatus] = mapped_column(
        SQLEnum(ComplianceStatus, name="compliance_status"),
        default=ComplianceStatus.PENDING,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    inspector: Mapped["User"] = relationship(
        back_populates="inspections"
    )

    product: Mapped["Product | None"] = relationship(
        back_populates="inspections"
    )

    images: Mapped[list["InspectionImage"]] = relationship(
        back_populates="inspection",
        cascade="all, delete-orphan",
    )

    declarations: Mapped[list["Declaration"]] = relationship(
        back_populates="inspection",
        cascade="all, delete-orphan",
    )

    mrp_findings: Mapped[list["MRPFinding"]] = relationship(
        back_populates="inspection",
        cascade="all, delete-orphan",
    )
