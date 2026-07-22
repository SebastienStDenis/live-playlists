import json
import logging
from datetime import UTC, datetime
from urllib.parse import quote

import httpx
from pydantic import BaseModel

API_URL = "https://rest.bandsintown.com"

logger = logging.getLogger(__name__)


class BandsintownArtistNotFoundError(Exception):
    pass


class BandsintownApiError(Exception):
    def __init__(self, status_code: int, message: str | None) -> None:
        super().__init__(f"Bandsintown error {status_code}: {message}")
        self.status_code = status_code


class BandsintownEventData(BaseModel):
    external_id: str
    artist_external_id: str | None
    title: str | None
    url: str | None
    starts_at: datetime
    lineup: list[str]
    venue_name: str
    venue_latitude: float
    venue_longitude: float
    street_address: str | None
    city_name: str
    region: str | None
    country: str | None


class BandsintownClient:
    def __init__(self, app_id: str) -> None:
        self._app_id = app_id
        self._http = httpx.AsyncClient(base_url=API_URL)

    async def aclose(self) -> None:
        await self._http.aclose()

    async def get_artist_events(self, name: str) -> list[BandsintownEventData]:
        """Fetch an artist's upcoming events, skipping ones the schema can't
        represent (no id, date, venue name, or coordinates).

        The V3.1 path prefix is undocumented but is the version that returns
        reliable venue names - see docs/design/2026-07-18-concert-venues.md.
        """
        response = await self._http.get(
            f"/V3.1/artists/{_encode_artist_name(name)}/events",
            params={"app_id": self._app_id, "date": "upcoming"},
        )
        try:
            payload = response.json()
        except json.JSONDecodeError:
            # Error bodies are not always JSON, e.g. "{message=invalid parameter}".
            payload = {"message": response.text.strip()}
        # Success is a JSON array of events; any object is an error envelope.
        if isinstance(payload, dict):
            message = payload.get("errorMessage") or payload.get("message") or ""
            if (
                response.status_code == 404
                or "[NotFound]" in message
                # Bandsintown rejects some artist names (e.g. non-latin scripts)
                # with a 400/401 "invalid parameter".
                or (response.status_code in (400, 401) and "invalid parameter" in message)
            ):
                raise BandsintownArtistNotFoundError(name)
            raise BandsintownApiError(response.status_code, message)
        response.raise_for_status()
        events = (_parse_event(event) for event in payload)
        return [event for event in events if event is not None]


def _encode_artist_name(name: str) -> str:
    quoted = quote(name, safe="")
    # Bandsintown requires these characters double-encoded in the path.
    for encoded in ("%2F", "%3F", "%2A"):
        quoted = quoted.replace(encoded, "%25" + encoded[1:])
    return quoted


def _parse_event(event: dict) -> BandsintownEventData | None:
    venue = event.get("venue") or {}
    external_id = event.get("id")
    starts_at = _parse_datetime(event.get("datetime"))
    venue_name = _text_or_none(venue.get("name"))
    latitude = _float_or_none(venue.get("latitude"))
    longitude = _float_or_none(venue.get("longitude"))
    if (
        not external_id
        or starts_at is None
        or not venue_name
        or latitude is None
        or longitude is None
    ):
        missing = [
            name
            for name, present in (
                ("id", bool(external_id)),
                ("datetime", starts_at is not None),
                ("venue.name", bool(venue_name)),
                ("venue.latitude", latitude is not None),
                ("venue.longitude", longitude is not None),
            )
            if not present
        ]
        logger.warning("Dropped Bandsintown event %r (missing %s)", external_id, ", ".join(missing))
        return None
    artist_external_id = event.get("artist_id") or (event.get("artist") or {}).get("id")
    return BandsintownEventData(
        external_id=str(external_id),
        artist_external_id=str(artist_external_id) if artist_external_id else None,
        title=_text_or_none(event.get("title")),
        url=_text_or_none(event.get("url")),
        starts_at=starts_at,
        lineup=event.get("lineup") or [],
        venue_name=venue_name,
        venue_latitude=latitude,
        venue_longitude=longitude,
        street_address=_text_or_none(venue.get("street_address")),
        city_name=_text_or_none(venue.get("city")) or _text_or_none(venue.get("location")) or "",
        region=_text_or_none(venue.get("region")),
        country=_text_or_none(venue.get("country")),
    )


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    # Bandsintown datetimes are venue-local wall-clock time; labeling that as
    # UTC (discarding any stray offset) is the convention every consumer
    # relies on, and close enough for date-granular matching.
    return parsed.replace(tzinfo=UTC)


def _text_or_none(value: str | None) -> str | None:
    return value or None


def _float_or_none(value: str | float | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None
