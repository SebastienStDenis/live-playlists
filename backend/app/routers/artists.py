import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.clients.lastfm import visible_tags
from app.core.accounts import linked_lastfm_account
from app.core.auth import CurrentUserDep, get_claims
from app.core.deps import LastfmClientDep, MusicBrainzClientDep, SessionDep
from app.core.models import Artist, LastfmArtist, UserArtistExclusion, UserArtistInterest
from app.core.schemas import (
    ArtistInterestRead,
    ArtistRead,
    ArtistSyncResult,
    SuggestionSyncResult,
    UserArtistRead,
)
from app.sync.artist_sync import SYNC_KINDS, sync_lastfm_artists
from app.sync.matching import SIMILAR_ARTIST_KIND
from app.sync.suggestion_sync import sync_user_suggestions

router = APIRouter()


@router.post("/me/lastfm/artists/sync", response_model=ArtistSyncResult)
async def sync_lastfm_artists_for_user(
    user: CurrentUserDep,
    session: SessionDep,
    lastfm: LastfmClientDep,
) -> ArtistSyncResult:
    """Fetch all of the linked Last.fm account's taste signals and upsert artist interests."""
    account = await linked_lastfm_account(session, user.id)
    if account is None:
        raise HTTPException(status_code=404, detail="No Last.fm account linked")

    results = await sync_lastfm_artists(session, lastfm, user.id, account.username, SYNC_KINDS)
    await session.commit()
    return ArtistSyncResult(synced_at=datetime.now(UTC), results=results)


@router.get("/me/artists", response_model=list[UserArtistRead])
async def list_user_artists(user: CurrentUserDep, session: SessionDep) -> list[UserArtistRead]:
    """List the user's artists of interest, grouped by artist with all reasons.
    Excluded (hidden) artists stay in the listing, flagged, so the UI can
    show and undo the exclusion - even when the exclusion outlived every
    interest row (a hidden suggestion loses its interest immediately)."""
    result = await session.execute(
        select(Artist, LastfmArtist)
        .join(UserArtistExclusion, UserArtistExclusion.artist_id == Artist.id)
        .outerjoin(LastfmArtist, LastfmArtist.artist_id == Artist.id)
        .where(UserArtistExclusion.user_id == user.id)
    )
    excluded_rows = result.all()
    excluded_ids = {artist.id for artist, _ in excluded_rows}

    result = await session.execute(
        select(UserArtistInterest, Artist, LastfmArtist)
        .join(Artist, UserArtistInterest.artist_id == Artist.id)
        .outerjoin(LastfmArtist, LastfmArtist.artist_id == Artist.id)
        .where(UserArtistInterest.user_id == user.id)
        .order_by(func.lower(Artist.name), UserArtistInterest.kind)
    )
    grouped: dict[uuid.UUID, UserArtistRead] = {}
    for interest, artist, info in result.all():
        entry = grouped.get(artist.id)
        if entry is None:
            entry = UserArtistRead(
                artist=ArtistRead.model_validate(artist),
                interests=[],
                excluded=artist.id in excluded_ids,
                tags=visible_tags(info.tags) if info and info.tags else [],
                listeners=info.listeners if info else None,
            )
            grouped[artist.id] = entry
        entry.interests.append(ArtistInterestRead.model_validate(interest))
    for artist, info in excluded_rows:
        if artist.id not in grouped:
            grouped[artist.id] = UserArtistRead(
                artist=ArtistRead.model_validate(artist),
                interests=[],
                excluded=True,
                tags=visible_tags(info.tags) if info and info.tags else [],
                listeners=info.listeners if info else None,
            )
    return sorted(grouped.values(), key=lambda entry: entry.artist.name.casefold())


@router.put("/me/artists/{artist_id}/exclusion", status_code=204)
async def exclude_artist(user: CurrentUserDep, artist_id: uuid.UUID, session: SessionDep) -> None:
    """Hide the artist: never suggest, never seed, never match (see
    docs/design/2026-07-07-ignoring-plan.md). Idempotent. Any standing
    suggestion for the pair is dropped immediately rather than waiting for
    the next suggestion sync to prune it."""
    artist = await session.get(Artist, artist_id)
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    await session.execute(
        pg_insert(UserArtistExclusion)
        .values(user_id=user.id, artist_id=artist_id)
        .on_conflict_do_nothing(
            index_elements=[UserArtistExclusion.user_id, UserArtistExclusion.artist_id]
        )
    )
    await session.execute(
        delete(UserArtistInterest).where(
            UserArtistInterest.user_id == user.id,
            UserArtistInterest.artist_id == artist_id,
            UserArtistInterest.kind == SIMILAR_ARTIST_KIND,
        )
    )
    await session.commit()


@router.delete("/me/artists/{artist_id}/exclusion", status_code=204)
async def unexclude_artist(user: CurrentUserDep, artist_id: uuid.UUID, session: SessionDep) -> None:
    """Unhide the artist. Idempotent. A formerly suggested artist
    re-enters as an ordinary candidate at the next sync (no standing claim
    to its old hysteresis advantage)."""
    await session.execute(
        delete(UserArtistExclusion).where(
            UserArtistExclusion.user_id == user.id,
            UserArtistExclusion.artist_id == artist_id,
        )
    )
    await session.commit()


@router.get(
    "/artists",
    response_model=list[ArtistRead],
    dependencies=[Depends(get_claims)],
)
async def list_artists(session: SessionDep) -> list[Artist]:
    """List all canonical artists."""
    result = await session.execute(select(Artist).order_by(func.lower(Artist.name)))
    return list(result.scalars())


@router.post("/me/suggestions/sync", response_model=SuggestionSyncResult)
async def sync_suggestions_for_user(
    user: CurrentUserDep,
    session: SessionDep,
    lastfm: LastfmClientDep,
    musicbrainz: MusicBrainzClientDep,
) -> SuggestionSyncResult:
    """Recompute the user's suggested artists from their taste (similar-artist
    edges, scoring, thresholds) and reconcile their suggestion interests."""
    account = await linked_lastfm_account(session, user.id)
    if account is None:
        raise HTTPException(status_code=404, detail="No Last.fm account linked")

    result = await sync_user_suggestions(session, lastfm, musicbrainz, user, account.username)
    await session.commit()
    return result
