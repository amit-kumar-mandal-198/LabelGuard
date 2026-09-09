from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class RuleCheck(Base):
    __tablename__ = "rule_checks"

    id: Mapped[int] = mapped_column(primary_key=True)

    rule_version_id: Mapped[int] = mapped_column(
        ForeignKey(
            "rule_versions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    field_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    operator: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    expected_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    expected_unit: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    severity: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="major",
        index=True,
    )

    failure_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    rule_version: Mapped["RuleVersion"] = relationship(
        back_populates="checks"
    )
