"""add image content hash

Revision ID: f4742f52324a
Revises: 4a31ceda9737
Create Date: 2026-09-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4742f52324a"
down_revision: Union[str, Sequence[str], None] = "4a31ceda9737"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "inspection_images",
        sa.Column(
            "content_hash",
            sa.String(length=64),
            nullable=True,
        ),
    )

    op.create_index(
        op.f("ix_inspection_images_content_hash"),
        "inspection_images",
        ["content_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_inspection_images_content_hash"),
        table_name="inspection_images",
    )

    op.drop_column(
        "inspection_images",
        "content_hash",
    )

