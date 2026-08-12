import json
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "SiRuangan Backend"
    debug: bool = False
    secret_key: str = "dev-secret-change-me-in-production"
    session_cookie_name: str = "siruangan_session"
    google_credentials_file: str = "/app/credentials/google-login-credentials.json"
    cors_origins: str = "*"
    secure_cookies: bool = False
    super_admin_email: str = "aldi@ugm.ac.id"

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()


class GoogleCredentials(BaseSettings):
    client_id: str
    client_secret: str
    redirect_uri: str
    project_id: Optional[str] = None
    auth_uri: Optional[str] = "https://accounts.google.com/o/oauth2/auth"
    token_uri: Optional[str] = "https://oauth2.googleapis.com/token"
    userinfo_uri: Optional[str] = "https://www.googleapis.com/oauth2/v1/userinfo"


def _find_credentials_file(path: str) -> Optional[Path]:
    candidates = [Path(path).expanduser()]
    if not candidates[0].is_absolute():
        candidates.insert(0, Path(__file__).resolve().parent.parent / path)
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def load_google_credentials() -> GoogleCredentials:
    file_path = _find_credentials_file(settings.google_credentials_file)
    if not file_path:
        raise FileNotFoundError(
            f"Google credentials file not found at '{settings.google_credentials_file}'. "
            "Mount it into the container or place it at ~/google-login-credentials.json."
        )
    with open(file_path, "r") as f:
        data = json.load(f)
    # Support both the raw downloaded format and a simplified format.
    if "web" in data:
        web = data["web"]
        return GoogleCredentials(
            client_id=web["client_id"],
            client_secret=web["client_secret"],
            redirect_uri=web.get("redirect_uris", [settings.google_credentials_file])[0],
            project_id=web.get("project_id"),
            auth_uri=web.get("auth_uri"),
            token_uri=web.get("token_uri"),
        )
    return GoogleCredentials(**data)
