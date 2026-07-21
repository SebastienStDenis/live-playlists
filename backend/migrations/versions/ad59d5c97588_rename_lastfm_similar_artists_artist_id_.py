"""rename lastfm_similar_artists.artist_id to seed_artist_id

Revision ID: ad59d5c97588
Revises: 613963b3331d
Create Date: 2026-07-21 09:08:59.460092

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ad59d5c97588"
down_revision: str | Sequence[str] | None = "613963b3331d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column("lastfm_similar_artists", "artist_id", new_column_name="seed_artist_id")
    op.execute(
        "ALTER INDEX ix_lastfm_similar_artists_artist_id "
        "RENAME TO ix_lastfm_similar_artists_seed_artist_id"
    )
    op.execute(
        "ALTER TABLE lastfm_similar_artists "
        "RENAME CONSTRAINT lastfm_similar_artists_artist_id_name_key_key "
        "TO lastfm_similar_artists_seed_artist_id_name_key_key"
    )
    op.execute(
        "ALTER TABLE lastfm_similar_artists "
        "RENAME CONSTRAINT lastfm_similar_artists_artist_id_fkey "
        "TO lastfm_similar_artists_seed_artist_id_fkey"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        "ALTER TABLE lastfm_similar_artists "
        "RENAME CONSTRAINT lastfm_similar_artists_seed_artist_id_fkey "
        "TO lastfm_similar_artists_artist_id_fkey"
    )
    op.execute(
        "ALTER TABLE lastfm_similar_artists "
        "RENAME CONSTRAINT lastfm_similar_artists_seed_artist_id_name_key_key "
        "TO lastfm_similar_artists_artist_id_name_key_key"
    )
    op.execute(
        "ALTER INDEX ix_lastfm_similar_artists_seed_artist_id "
        "RENAME TO ix_lastfm_similar_artists_artist_id"
    )
    op.alter_column("lastfm_similar_artists", "seed_artist_id", new_column_name="artist_id")
