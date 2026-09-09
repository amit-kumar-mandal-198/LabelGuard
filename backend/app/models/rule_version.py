from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class RuleVersion(Base):
    __tablename__ = "rule_versions"

    __table_args__ = (
        UniqueConstraint(
            "regulation_id",
            "rule_code",
            "version",
            name="uq_rule_versions_regulation_code_version",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    regulation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    rule_code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    rule_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    requirement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
        index=True,
    )

    approval_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    regulation: Mapped["Regulation"] = relationship(
        back_populates="rule_versions"
    )

    conditions: Mapped[list["RuleCondition"]] = relationship(
        back_populates="rule_version",
        cascade="all, delete-orphan",
    )

    checks: Mapped[list["RuleCheck"]] = relationship(
        back_populates="rule_version",
        cascade="all, delete-orphan",
    )

    sources: Mapped[list["RuleSource"]] = relationship(
        back_populates="rule_version",
        cascade="all, delete-orphan",
    )
