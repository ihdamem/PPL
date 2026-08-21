"""Pytest fixtures untuk backend SiRuangan.

Penting: environment variable harus diset SEBELUM modul app diimpor,
karena ``app.config.settings`` dan ``app.database.DB_PATH`` dibaca saat import.
"""

import os
import sys
from pathlib import Path

# Pastikan direktori backend ada di sys.path saat pytest dijalankan dari root repo.
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Konfigurasi khusus testing.
TEST_DB_PATH = BACKEND_DIR / ".test-data" / "test-siruangan.db"
os.environ["DATABASE_PATH"] = str(TEST_DB_PATH)
os.environ["DEBUG"] = "true"  # mock-login hanya aktif saat debug
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["SUPERADMIN_EMAILS"] = (
    "primaadipradana@mail.ugm.ac.id,dimasihdammaulana@mail.ugm.ac.id"
)

import pytest  # noqa: E402


@pytest.fixture()
def db():
    """Koneksi ke database test; bersihkan tabel users sebelum & sesudah tiap test."""

    from app.database import get_connection, init_db

    TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()

    init_db()

    yield

    with get_connection() as connection:
        connection.execute("DELETE FROM users")


@pytest.fixture()
def client(db):
    """TestClient FastAPI dengan mock-login helper.

    Tabel rooms di-drop & seed ulang supaya tiap test mulai dari seed standar.
    """

    from fastapi.testclient import TestClient
    from app.database import get_connection
    from app.main import app
    from app.rooms_db import init_rooms_table

    with get_connection() as connection:
        connection.execute("DROP TABLE IF EXISTS rooms")
    init_rooms_table()

    with TestClient(app) as test_client:
        yield test_client


def login_as(client, role: str):
    """Login via mock-login dan kembalikan data user dari /api/auth/me."""

    response = client.get(
        f"/api/auth/mock-login?role={role}", follow_redirects=False
    )
    assert response.status_code in (200, 302, 307), response.text

    me = client.get("/api/auth/me")
    assert me.status_code == 200, me.text
    return me.json()


@pytest.fixture(autouse=True)
def reset_memory():
    """Kosongkan state in-memory (booking, audit, notifikasi) antar test."""

    from app import audit, booking, notifications

    booking.fake_bookings_db.clear()
    booking.booking_id_counter = 1
    audit.fake_audit_logs.clear()
    audit.audit_id_counter = 1
    notifications.fake_notifications.clear()
    notifications.notification_id_counter = 1

    yield
