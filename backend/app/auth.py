import json
import secrets
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.httpx_client import AsyncOAuth2Client
from itsdangerous.url_safe import URLSafeTimedSerializer
from itsdangerous.exc import BadSignature, SignatureExpired

from app.config import load_google_credentials, settings
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key)


def encode_session(user: User) -> str:
    return _serializer().dumps(user.model_dump(), salt=settings.session_cookie_name)


def decode_session(token: str) -> Optional[User]:
    try:
        data = _serializer().loads(token, salt=settings.session_cookie_name, max_age=86400 * 7)
        return User(**data)
    except (BadSignature, SignatureExpired, json.JSONDecodeError):
        return None


def get_current_user(request: Request) -> Optional[User]:
    cookie = request.cookies.get(settings.session_cookie_name)
    if not cookie:
        return None
    return decode_session(cookie)


def require_user(request: Request) -> User:
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def _set_cookie(response: Response, key: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=settings.secure_cookies,
    )


@router.get("/google")
async def login_with_google():
    creds = load_google_credentials()
    state = secrets.token_urlsafe(32)
    client = AsyncOAuth2Client(
        client_id=creds.client_id,
        client_secret=creds.client_secret,
        redirect_uri=creds.redirect_uri,
        scope="openid email profile",
    )
    authorization_url, _ = client.create_authorization_url(
        creds.auth_uri,
        state=state,
        access_type="offline",
        prompt="select_account",
    )
    response = RedirectResponse(url=authorization_url)
    _set_cookie(response, "google_oauth_state", state, max_age=600)
    return response


@router.get("/google/callback")
async def google_callback(request: Request, code: str, state: str):
    stored_state = request.cookies.get("google_oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    creds = load_google_credentials()
    client = AsyncOAuth2Client(
        client_id=creds.client_id,
        client_secret=creds.client_secret,
        redirect_uri=creds.redirect_uri,
    )
    callback_url = creds.redirect_uri
    if request.query_params:
        callback_url += "?" + str(request.query_params)

    token = await client.fetch_token(
        creds.token_uri,
        authorization_response=callback_url,
    )

    resp = await client.get(
        creds.userinfo_uri,
        headers={"Authorization": f"Bearer {token['access_token']}"},
    )
    resp.raise_for_status()
    info = resp.json()

    user = User(
        email=info["email"],
        name=info.get("name"),
        picture=info.get("picture"),
        sub=info["id"],
    )

    session_cookie = encode_session(user)
    redirect_response = RedirectResponse(url="/app/dashboard")
    _set_cookie(redirect_response, settings.session_cookie_name, session_cookie, max_age=86400 * 7)
    redirect_response.delete_cookie("google_oauth_state")
    return redirect_response


@router.get("/me")
async def auth_me(request: Request):
    user = require_user(request)
    return user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(settings.session_cookie_name)
    return {"detail": "Logged out"}
