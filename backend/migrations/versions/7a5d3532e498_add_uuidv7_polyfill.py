"""add uuidv7 polyfill

Revision ID: 7a5d3532e498
Revises:
Create Date: 2026-07-08 15:20:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7a5d3532e498"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # uuidv7() is a built-in only in PostgreSQL 18+. Every UUID primary key
    # defaults to it, so on an older major (e.g. Supabase, still on 17) the
    # schema can't be created. Define a persistent SQL polyfill when the built-in
    # is absent; on PG18 the guard makes this a no-op.
    op.execute(
        """
DO $$
BEGIN
  -- Match the exact zero-arg signature: PG18 ships uuidv7() and uuidv7(interval),
  -- so the bare name is ambiguous to to_regproc and would falsely read as absent.
  IF to_regprocedure('uuidv7()') IS NULL THEN
    CREATE FUNCTION public.uuidv7() RETURNS uuid LANGUAGE sql VOLATILE AS $func$
      SELECT encode(
        set_bit(
          set_bit(
            overlay(
              uuid_send(gen_random_uuid())
              PLACING substring(
                int8send((extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3
              )
              FROM 1 FOR 6
            ),
            52, 1
          ),
          53, 1
        ),
        'hex'
      )::uuid
    $func$;
  END IF;
END
$$;
"""
    )


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS public.uuidv7()")
