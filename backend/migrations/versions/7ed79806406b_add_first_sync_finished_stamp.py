"""add first sync finished stamp

Revision ID: 7ed79806406b
Revises: d5b929ae1174
Create Date: 2026-07-12 09:38:16.673841

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7ed79806406b"
down_revision: str | Sequence[str] | None = "d5b929ae1174"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users", sa.Column("first_sync_finished_at", sa.DateTime(timezone=True), nullable=True)
    )
    # Existing users with a successful sync on record have finished a run;
    # without the backfill they would all be pulled through the welcome flow
    # again. Users whose runs only ever failed can't be recovered (the runs
    # live in Temporal, subject to retention) and re-onboard once.
    op.execute(
        "UPDATE users SET first_sync_finished_at = last_synced_at WHERE last_synced_at IS NOT NULL"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "first_sync_finished_at")
