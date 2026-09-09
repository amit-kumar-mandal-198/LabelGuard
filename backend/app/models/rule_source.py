from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship


from app.db.session import Base


class RuleSource(Base):
    __tablename__ = "rule_sources"

    id: Mapped[int] = mapped_column(primary_key=True)

    rule_version_id: Mapped[int] = mapped_column(
        ForeignKey(
            "rule_versions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    source_reference: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    source_title: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    source_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    document_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    published_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    effective_from: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    rule_version: Mapped["RuleVersion"] = relationship(
        back_populates="sources"
    )
