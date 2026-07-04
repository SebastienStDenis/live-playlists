from datetime import UTC, datetime

import httpx
from pydantic import BaseModel

API_URL = "https://ws.audioscrobbler.com/2.0/"
USER_NOT_FOUND_ERROR_CODE = 6


class LastfmUserNotFoundError(Exception):
    pass


class LastfmUserInfo(BaseModel):
    username: str
    real_name: str | None
    avatar_url: str | None
    profile_url: str | None
    country: str | None
    registered_at: datetime | None
    playcount: int | None
    artist_count: int | None


class LastfmClient:
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def get_user_info(self, username: str) -> LastfmUserInfo:
        params = {
            "method": "user.getinfo",
            "user": username,
            "api_key": self._api_key,
            "format": "json",
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(API_URL, params=params)
        payload = response.json()
        if payload.get("error") == USER_NOT_FOUND_ERROR_CODE:
            raise LastfmUserNotFoundError(username)
        response.raise_for_status()
        return _parse_user_info(payload["user"])


def _parse_user_info(user: dict) -> LastfmUserInfo:
    images = [image.get("#text") for image in user.get("image", [])]
    avatar_url = next((url for url in reversed(images) if url), None)

    registered_at = None
    unixtime = user.get("registered", {}).get("unixtime")
    if unixtime:
        registered_at = datetime.fromtimestamp(int(unixtime), tz=UTC)

    return LastfmUserInfo(
        username=user["name"],
        real_name=_text_or_none(user.get("realname")),
        avatar_url=avatar_url,
        profile_url=_text_or_none(user.get("url")),
        country=_text_or_none(user.get("country")),
        registered_at=registered_at,
        playcount=_int_or_none(user.get("playcount")),
        artist_count=_int_or_none(user.get("artist_count")),
    )


def _text_or_none(value: str | None) -> str | None:
    # Last.fm uses the literal string "None" for unset fields like country.
    if not value or value == "None":
        return None
    return value


def _int_or_none(value: str | None) -> int | None:
    return int(value) if value else None
