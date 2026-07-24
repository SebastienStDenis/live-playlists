import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.clients.lastfm import LastfmApiError, LastfmPrivateDataError, LastfmUserNotFoundError
from app.clients.supabase_admin import SupabaseAdminError
from app.core.config import get_settings
from app.core.deps import SessionDep
from app.core.observability import configure_observability
from app.routers import account, artists, events, lastfm, playlists, sync

logger = logging.getLogger(__name__)

configure_observability(get_settings(), "api")

app = FastAPI(title="NextFM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(LastfmUserNotFoundError)
async def lastfm_user_not_found(request: Request, exc: LastfmUserNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": "Last.fm user not found"})


@app.exception_handler(LastfmPrivateDataError)
async def lastfm_private_data(request: Request, exc: LastfmPrivateDataError) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(LastfmApiError)
async def lastfm_api_error(request: Request, exc: LastfmApiError) -> JSONResponse:
    logger.warning("Last.fm API error", exc_info=exc)
    return JSONResponse(
        status_code=502,
        content={"detail": "Last.fm isn't responding right now. Please try again in a moment."},
    )


@app.exception_handler(SupabaseAdminError)
async def supabase_admin_error(request: Request, exc: SupabaseAdminError) -> JSONResponse:
    logger.warning("Supabase admin API error", exc_info=exc)
    return JSONResponse(
        status_code=502,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


@app.get("/health")
async def health(session: SessionDep) -> dict[str, str]:
    """Check API and database connectivity."""
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}


app.include_router(account.router)
app.include_router(lastfm.router)
app.include_router(artists.router)
app.include_router(events.router)
app.include_router(playlists.router)
app.include_router(sync.router)
