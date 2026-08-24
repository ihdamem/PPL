"""SQLite persistence layer untuk ruangan (rooms)."""

import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional

from app.database import get_connection
from app.models import RoomCreate, RoomResponse, RoomStatus, RoomUpdate

SEED_ROOMS = [
    {
        "name": "Ruang A.1",
        "location": "Lantai 2, Gedung A",
        "capacity": 25,
        "facilities": ["Proyektor", "Whiteboard", "AC"],
        "description": "Ruang pertemuan kecil untuk rapat dosen atau diskusi tim.",
        "status": RoomStatus.AVAILABLE,
    },
    {
        "name": "Ruang Seminar 1",
        "location": "Lantai 3, Gedung B",
        "capacity": 60,
        "facilities": ["Proyektor", "Audio", "Koneksi Wi-Fi"],
        "description": "Ruang seminar dengan kapasitas menengah untuk presentasi dan kelas.",
        "status": RoomStatus.AVAILABLE,
    },
    {
        "name": "Ruang Sidang",
        "location": "Lantai 1, Gedung C",
        "capacity": 15,
        "facilities": ["LCD", "AC"],
        "description": "Ruang sidang untuk rapat formal dan evaluasi administratif.",
        "status": RoomStatus.MAINTENANCE,
    },
    {
        "name": "Lab Komputer A",
        "location": "Lantai 2, Gedung Informatika",
        "capacity": 40,
        "facilities": ["PC", "Proyektor", "Whiteboard"],
        "description": "Lab komputer untuk kegiatan praktikum dan pelatihan teknologi.",
        "status": RoomStatus.AVAILABLE,
    },
]


def init_rooms_table() -> None:
    """Buat tabel rooms dan isi data awal bila masih kosong."""

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                location TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                facilities TEXT NOT NULL DEFAULT '[]',
                description TEXT,
                status TEXT NOT NULL DEFAULT 'available',
                created_at TEXT NOT NULL
            )
            """
        )

        count = connection.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
        if count == 0:
            now = datetime.now(timezone.utc).isoformat()
            for room in SEED_ROOMS:
                connection.execute(
                    """
                    INSERT INTO rooms (
                        name, location, capacity, facilities,
                        description, status, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        room["name"],
                        room["location"],
                        room["capacity"],
                        json.dumps(room["facilities"], ensure_ascii=False),
                        room["description"],
                        room["status"].value,
                        now,
                    ),
                )


def _row_to_room(row: sqlite3.Row) -> RoomResponse:
    return RoomResponse(
        id=row["id"],
        name=row["name"],
        location=row["location"],
        capacity=row["capacity"],
        facilities=json.loads(row["facilities"]),
        description=row["description"],
        status=RoomStatus(row["status"]),
        created_at=datetime.fromisoformat(row["created_at"]),
    )


def list_rooms(status: Optional[RoomStatus] = None) -> List[RoomResponse]:
    query = "SELECT * FROM rooms"
    params: tuple = ()

    if status is not None:
        query += " WHERE status = ?"
        params = (status.value,)

    query += " ORDER BY name ASC"

    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    return [_row_to_room(row) for row in rows]


def get_room(room_id: int) -> Optional[RoomResponse]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM rooms WHERE id = ?",
            (room_id,),
        ).fetchone()

    return _row_to_room(row) if row else None


def create_room(payload: RoomCreate) -> RoomResponse:
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO rooms (
                name, location, capacity, facilities,
                description, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                payload.location.strip(),
                payload.capacity,
                json.dumps(payload.facilities, ensure_ascii=False),
                payload.description,
                payload.status.value,
                now,
            ),
        )
        room_id = cursor.lastrowid

        row = connection.execute(
            "SELECT * FROM rooms WHERE id = ?",
            (room_id,),
        ).fetchone()

    return _row_to_room(row)


def update_room(room_id: int, payload: RoomUpdate) -> Optional[RoomResponse]:
    existing = get_room(room_id)
    if existing is None:
        return None

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        return existing

    fields = []
    params: list = []
    for key, value in updates.items():
        if key == "facilities":
            value = json.dumps(value, ensure_ascii=False)
        elif key == "status":
            value = RoomStatus(value).value
        fields.append(f"{key} = ?")
        params.append(value)
    params.append(room_id)

    with get_connection() as connection:
        connection.execute(
            f"UPDATE rooms SET {', '.join(fields)} WHERE id = ?",
            tuple(params),
        )

    return get_room(room_id)


def delete_room(room_id: int) -> bool:
    """Hapus ruangan berdasarkan ID. Mengembalikan True jika ada baris yang dihapus."""
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM rooms WHERE id = ?",
            (room_id,),
        )
        return cursor.rowcount > 0


# -----------------------------------------------------------------
# Contoh data ruangan (dummy) – dipakai untuk demo / testing
# -----------------------------------------------------------------
fake_rooms_db = [
    {
        "id": 1,
        "name": "Ruang A",
        "location": "Gedung 1, Lantai 2",
        "capacity": 30,
        "facilities": ["Proyektor", "Whiteboard"],
        "status": "available",
    },
    {
        "id": 2,
        "name": "Ruang B",
        "location": "Gedung 2, Lantai 1",
        "capacity": 20,
        "facilities": ["TV", "Speaker"],
        "status": "available",
    },
    {
        "id": 3,
        "name": "Ruang C",
        "location": "Gedung 3, Lantai 3",
        "capacity": 15,
        "facilities": ["Komputer", "Koneksi Internet"],
        "status": "available",
    },
]

