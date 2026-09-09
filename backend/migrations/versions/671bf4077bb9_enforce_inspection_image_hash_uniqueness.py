"""enforce inspection image hash uniqueness

Revision ID: 671bf4077bb9
Revises: f4742f52324a
Create Date: 2026-09-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "671bf4077bb9"
down_revision: Union[str, Sequence[str], None] = "f4742f52324a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing rows have already been backfilled with SHA-256 hashes.
    # Make the column mandatory.
    op.alter_column(
        "inspection_images",
        "content_hash",
        existing_type=sa.String(length=64),
        nullable=False,
    )

    # Prevent the same image from being registered twice
    # within the same inspection.
    op.create_unique_constraint(
        "uq_inspection_images_inspection_hash",
        "inspection_images",
        ["inspection_id", "content_hash"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_inspection_images_inspection_hash",
        "inspection_images",
        type_="unique",
    )

    op.alter_column(
        "inspection_images",
        "content_hash",
        existing_type=sa.String(length=64),
        nullable=True,
    )
