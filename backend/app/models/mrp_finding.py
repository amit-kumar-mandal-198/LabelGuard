from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MRPFinding(Base):
    __tablename__ = "mrp_findings"

    id: Mapped[int] = mapped_column(primary_key=True)

    inspection_id: Mapped[int] = mapped_column(
        ForeignKey("inspections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    image_id: Mapped[int | None] = mapped_column(
        ForeignKey("inspection_images.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    declared_mrp: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    reference_mrp: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    price_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    difference_amount: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    reference_source: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    tamper_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="NOT_SUSPECTED",
    )

    tamper_risk_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    decision: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    inspection: Mapped["Inspection"] = relationship(
        back_populates="mrp_findings"
    )

    image: Mapped["InspectionImage | None"] = relationship()
