from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.clients.lastfm import LastfmClient, LastfmUserInfo
from app.core.accounts import linked_lastfm_account
from app.core.auth import CurrentUserDep
from app.core.deps import LastfmClientDep, SessionDep
from app.core.models import LastfmAccount, LastfmConnection
from app.core.schemas import LastfmAccountRead, LastfmLink

router = APIRouter()


def _apply_user_info(account: LastfmAccount, info: LastfmUserInfo, synced_at: datetime) -> None:
    account.username = info.username
    account.real_name = info.real_name
    account.avatar_url = info.avatar_url
    account.profile_url = info.profile_url
    account.country = info.country
    account.registered_at = info.registered_at
    account.last_synced_at = synced_at


async def _probe_listening_data(lastfm: LastfmClient, username: str) -> None:
    """Raise LastfmPrivateDataError if the account hides its listening data."""
    await lastfm.get_top_artists(username, limit=1)
    await lastfm.get_loved_tracks(username, limit=1)


@router.get("/me/lastfm", response_model=LastfmAccountRead)
async def get_linked_lastfm_account(user: CurrentUserDep, session: SessionDep) -> LastfmAccount:
    """Return the user's linked Last.fm account; 404 if none is linked."""
    account = await linked_lastfm_account(session, user.id)
    if account is None:
        raise HTTPException(status_code=404, detail="No Last.fm account linked")
    return account


@router.put("/me/lastfm", response_model=LastfmAccountRead)
async def link_lastfm_account(
    user: CurrentUserDep,
    payload: LastfmLink,
    session: SessionDep,
    lastfm: LastfmClientDep,
) -> LastfmAccount:
    """Link the user to a Last.fm account by username, replacing any existing link."""
    info = await lastfm.get_user_info(payload.username)
    # Verify user's listening data is readable
    await _probe_listening_data(lastfm, info.username)

    result = await session.execute(
        select(LastfmAccount).where(func.lower(LastfmAccount.username) == info.username.lower())
    )
    account = result.scalar_one_or_none()
    if account is None:
        account = LastfmAccount()
        session.add(account)
    _apply_user_info(account, info, datetime.now(UTC))
    await session.flush()

    result = await session.execute(
        select(LastfmConnection).where(LastfmConnection.user_id == user.id)
    )
    connection = result.scalar_one_or_none()
    if connection is None:
        session.add(LastfmConnection(user_id=user.id, lastfm_account_id=account.id))
    else:
        connection.lastfm_account_id = account.id

    await session.commit()
    return account


@router.post("/me/lastfm/refresh", response_model=LastfmAccountRead)
async def refresh_lastfm_account(
    user: CurrentUserDep,
    session: SessionDep,
    lastfm: LastfmClientDep,
) -> LastfmAccount:
    """Re-fetch the linked Last.fm account's details and update them."""
    account = await linked_lastfm_account(session, user.id)
    if account is None:
        raise HTTPException(status_code=404, detail="No Last.fm account linked")

    info = await lastfm.get_user_info(account.username)
    # Verify user's listening data is readable
    await _probe_listening_data(lastfm, account.username)
    _apply_user_info(account, info, datetime.now(UTC))
    await session.commit()
    return account


@router.delete("/me/lastfm", status_code=204)
async def unlink_lastfm_account(user: CurrentUserDep, session: SessionDep) -> None:
    """Remove the user's Last.fm link; 404 if none is linked."""
    result = await session.execute(
        select(LastfmConnection).where(LastfmConnection.user_id == user.id)
    )
    connection = result.scalar_one_or_none()
    if connection is None:
        raise HTTPException(status_code=404, detail="No Last.fm account linked")
    await session.delete(connection)
    await session.commit()
