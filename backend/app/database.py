"""Small SQLite persistence layer for SiRuangan users."""

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional

from app.config import settings
from app.models import Role, User


DB_PATH = Path(settings.database_path).expanduser()


def _ensure_parent_directory() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    _ensure_parent_directory()

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    """Create users table if it does not exist."""

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                nama TEXT,
                role TEXT NOT NULL DEFAULT 'user',
                nomor_induk TEXT,
                departemen TEXT,
                picture TEXT,
                sub TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            )
            """
        )


def _row_to_user(row: sqlite3.Row) -> User:
    return User(
        email=row["email"],
        name=row["nama"],
        picture=row["picture"],
        sub=row["sub"],
        role=Role(row["role"]),
        nomor_induk=row["nomor_induk"],
        departemen=row["departemen"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


def get_user_by_sub(sub: str) -> Optional[User]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE sub = ?",
            (sub,),
        ).fetchone()

    return _row_to_user(row) if row else None


def get_user_by_email(email: str) -> Optional[User]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE lower(email) = lower(?)",
            (email,),
        ).fetchone()

    return _row_to_user(row) if row else None


def upsert_google_user(
    *,
    email: str,
    name: Optional[str],
    picture: Optional[str],
    sub: str,
    role: Role,
) -> User:
    """
    Create or update user after successful Google authentication.

    Profile fields such as nomor_induk and departemen are NOT overwritten
    during login.
    """

    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO users (
                email,
                nama,
                role,
                picture,
                sub,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)

            ON CONFLICT(sub) DO UPDATE SET
                email = excluded.email,
                nama = excluded.nama,
                role = excluded.role,
                picture = excluded.picture
            """,
            (
                email,
                name,
                role.value,
                picture,
                sub,
                now,
            ),
        )

        row = connection.execute(
            "SELECT * FROM users WHERE sub = ?",
            (sub,),
        ).fetchone()

    if row is None:
        raise RuntimeError("User gagal disimpan ke database")

    return _row_to_user(row)


def update_profile(
    *,
    sub: str,
    name: str,
    nomor_induk: str,
    departemen: str,
) -> Optional[User]:

    with get_connection() as connection:
        connection.execute(
            """
            UPDATE users
            SET
                nama = ?,
                nomor_induk = ?,
                departemen = ?
            WHERE sub = ?
            """,
            (
                name,
                nomor_induk,
                departemen,
                sub,
            ),
        )

        row = connection.execute(
            "SELECT * FROM users WHERE sub = ?",
            (sub,),
        ).fetchone()

    return _row_to_user(row) if row else None