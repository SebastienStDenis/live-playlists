"""user_artist_exclusions composite pk

Revision ID: 467677f9cfba
Revises: ad59d5c97588
Create Date: 2026-07-21 09:47:18.174829

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "467677f9cfba"
down_revision: str | Sequence[str] | None = "ad59d5c97588"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(
        "user_artist_exclusions_user_id_artist_id_key", "user_artist_exclusions", type_="unique"
    )
    op.drop_constraint("user_artist_exclusions_pkey", "user_artist_exclusions", type_="primary")
    op.drop_column("user_artist_exclusions", "id")
    op.create_primary_key(
        "user_artist_exclusions_pkey", "user_artist_exclusions", ["user_id", "artist_id"]
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("user_artist_exclusions_pkey", "user_artist_exclusions", type_="primary")
    op.add_column(
        "user_artist_exclusions",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
    )
    op.create_primary_key("user_artist_exclusions_pkey", "user_artist_exclusions", ["id"])
    op.create_unique_constraint(
        "user_artist_exclusions_user_id_artist_id_key",
        "user_artist_exclusions",
        ["user_id", "artist_id"],
    )
