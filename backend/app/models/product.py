from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)

    brand_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    product_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    package_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    manufacturer_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    manufacturer_address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    inspections: Mapped[list["Inspection"]] = relationship(
        back_populates="product"
    )

    mrp_references: Mapped[list["ProductMRPReference"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )

    barcodes: Mapped[list["ProductBarcode"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )

