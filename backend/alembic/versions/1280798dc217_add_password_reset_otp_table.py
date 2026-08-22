"""add password reset otp table

Revision ID: 1280798dc217
Revises: 4c3ffee9bf12
Create Date: 2026-08-23 03:19:46.610196

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1280798dc217"
down_revision: Union[str, Sequence[str], None] = "4c3ffee9bf12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_otps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_password_reset_otps_user_id",
        "password_reset_otps",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_password_reset_otps_user_id",
        table_name="password_reset_otps",
    )

    op.drop_table("password_reset_otps")