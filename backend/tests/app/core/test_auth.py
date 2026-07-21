import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

import app.core.auth as auth
from app.core.auth import verify_token
from app.core.config import Settings

ISSUER = "http://127.0.0.1:54321/auth/v1"

_signing_key = ec.generate_private_key(ec.SECP256R1())
_public_key = _signing_key.public_key()


@pytest.fixture(autouse=True)
def _stub_jwks(monkeypatch: pytest.MonkeyPatch) -> None:
    """Serve our public key instead of fetching the project's live JWKS."""
    signing_key = type("_Key", (), {"key": _public_key})()
    client = type("_Client", (), {"get_signing_key_from_jwt": lambda self, token: signing_key})()
    monkeypatch.setattr(auth, "_jwks_client", lambda url: client)


def make_settings(**overrides: object) -> Settings:
    defaults: dict = {
        "_env_file": None,
        "supabase_url": "http://127.0.0.1:54321",
    }
    defaults.update(overrides)
    return Settings(**defaults)


def make_token(
    key: ec.EllipticCurvePrivateKey | None = None, algorithm: str = "ES256", **overrides: object
) -> str:
    now = datetime.now(UTC)
    payload: dict = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "iss": ISSUER,
        "exp": now + timedelta(seconds=60),
        "email": "ada@example.com",
        "user_metadata": {"display_name": "Ada"},
    }
    payload.update(overrides)
    return jwt.encode(payload, key or _signing_key, algorithm=algorithm)


def test_valid_token_round_trips_claims() -> None:
    sub = uuid.uuid4()
    token = make_token(sub=str(sub))

    claims = verify_token(token, make_settings())

    assert claims.sub == sub
    assert claims.email == "ada@example.com"
    assert claims.display_name == "Ada"


def test_expired_token_is_rejected() -> None:
    token = make_token(exp=datetime.now(UTC) - timedelta(seconds=1))

    with pytest.raises(HTTPException) as exc:
        verify_token(token, make_settings())
    assert exc.value.status_code == 401


def test_wrong_audience_is_rejected() -> None:
    token = make_token(aud="anon")

    with pytest.raises(HTTPException) as exc:
        verify_token(token, make_settings())
    assert exc.value.status_code == 401


def test_wrong_issuer_is_rejected() -> None:
    token = make_token(iss="https://evil.example/auth/v1")

    with pytest.raises(HTTPException) as exc:
        verify_token(token, make_settings())
    assert exc.value.status_code == 401


def test_tampered_signature_is_rejected() -> None:
    token = make_token(key=ec.generate_private_key(ec.SECP256R1()))

    with pytest.raises(HTTPException) as exc:
        verify_token(token, make_settings())
    assert exc.value.status_code == 401


def test_symmetric_algorithm_is_rejected() -> None:
    # A token signed HS256 with the public key as the HMAC secret must not
    # verify against the asymmetric JWKS path (the algorithm-confusion attack).
    token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "aud": "authenticated",
            "iss": ISSUER,
            "exp": datetime.now(UTC) + timedelta(seconds=60),
        },
        "shared-secret-shared-secret-shared!",
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as exc:
        verify_token(token, make_settings())
    assert exc.value.status_code == 401
