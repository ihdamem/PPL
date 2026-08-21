"""Test CRUD ruangan dan koneksi dengan booking."""

from app.models import RoomStatus
from tests.conftest import login_as


class TestRoomPermissions:
    def test_list_rooms_requires_login(self, client):
        assert client.get("/api/rooms").status_code == 401

    def test_booker_can_view_rooms(self, client):
        login_as(client, "booker")
        response = client.get("/api/rooms")
        assert response.status_code == 200
        assert len(response.json()) > 0  # seed data

    def test_booker_cannot_create_room(self, client):
        login_as(client, "booker")
        payload = {
            "name": "Ruang Baru",
            "location": "Gedung X",
            "capacity": 10,
            "facilities": ["AC"],
        }
        assert client.post("/api/rooms", json=payload).status_code == 403

    def test_admin_can_create_room(self, client):
        login_as(client, "admin")
        payload = {
            "name": "Ruang Rapat Z",
            "location": "Lantai 5, Gedung Z",
            "capacity": 30,
            "facilities": ["Proyektor", "AC"],
            "description": "Ruang rapat baru.",
        }
        response = client.post("/api/rooms", json=payload)
        assert response.status_code == 201
        room = response.json()
        assert room["name"] == "Ruang Rapat Z"
        assert room["status"] == "available"

    def test_duplicate_room_name_rejected(self, client):
        login_as(client, "admin")
        payload = {
            "name": "Ruang A.1",  # sudah ada di seed
            "location": "Gedung Duplikat",
            "capacity": 10,
        }
        assert client.post("/api/rooms", json=payload).status_code == 409

    def test_admin_can_update_room(self, client):
        login_as(client, "admin")
        rooms = client.get("/api/rooms").json()
        room_id = rooms[0]["id"]

        response = client.patch(
            f"/api/rooms/{room_id}",
            json={"capacity": 99, "status": "maintenance"},
        )
        assert response.status_code == 200
        assert response.json()["capacity"] == 99
        assert response.json()["status"] == "maintenance"

    def test_admin_can_delete_room(self, client):
        login_as(client, "admin")
        created = client.post(
            "/api/rooms",
            json={"name": "Ruang Hapus", "location": "Gedung H", "capacity": 5},
        ).json()

        assert client.delete(f"/api/rooms/{created['id']}").status_code == 204
        assert client.get(f"/api/rooms/{created['id']}").status_code == 404

    def test_filter_rooms_by_status(self, client):
        login_as(client, "booker")
        maintenance = client.get("/api/rooms", params={"status": "maintenance"}).json()
        assert all(r["status"] == "maintenance" for r in maintenance)
        assert len(maintenance) > 0


class TestBookingRoomIntegration:
    BOOKING = {
        "tanggal": "2026-05-01",
        "waktu_mulai": "09:00:00",
        "waktu_selesai": "10:00:00",
        "keperluan": "Rapat koordinasi",
        "jumlah_peserta": 5,
    }

    def _available_room(self, client) -> dict:
        rooms = client.get("/api/rooms", params={"status": "available"}).json()
        return rooms[0]

    def test_booking_with_unknown_room_rejected(self, client):
        login_as(client, "booker")
        payload = {**self.BOOKING, "room_id": 99999}
        assert client.post("/api/bookings", json=payload).status_code == 404

    def test_booking_maintenance_room_rejected(self, client):
        login_as(client, "booker")
        rooms = client.get("/api/rooms", params={"status": "maintenance"}).json()
        room = rooms[0]

        payload = {**self.BOOKING, "room_id": room["id"]}
        response = client.post("/api/bookings", json=payload)
        assert response.status_code == 409
        assert "maintenance" in response.json()["detail"].lower()

    def test_booking_exceeding_capacity_rejected(self, client):
        login_as(client, "booker")
        room = self._available_room(client)

        payload = {
            **self.BOOKING,
            "room_id": room["id"],
            "jumlah_peserta": room["capacity"] + 1,
        }
        response = client.post("/api/bookings", json=payload)
        assert response.status_code == 400
        assert "kapasitas" in response.json()["detail"].lower()

    def test_booking_includes_room_name(self, client):
        login_as(client, "booker")
        room = self._available_room(client)

        payload = {**self.BOOKING, "room_id": room["id"]}
        booking = client.post("/api/bookings", json=payload).json()
        assert booking["room_name"] == room["name"]

    def test_conflicting_booking_rejected(self, client):
        login_as(client, "booker")
        room = self._available_room(client)
        payload = {**self.BOOKING, "room_id": room["id"]}

        first = client.post("/api/bookings", json=payload)
        assert first.status_code == 201

        # Overlap penuh pada ruangan & tanggal sama.
        second = client.post("/api/bookings", json=payload)
        assert second.status_code == 409

    def test_back_to_back_booking_allowed(self, client):
        login_as(client, "booker")
        room = self._available_room(client)

        first = client.post(
            "/api/bookings",
            json={**self.BOOKING, "room_id": room["id"]},
        )
        assert first.status_code == 201

        # Booking setelahnya (tidak overlap) harus boleh.
        second = client.post(
            "/api/bookings",
            json={
                **self.BOOKING,
                "room_id": room["id"],
                "waktu_mulai": "10:00:00",
                "waktu_selesai": "11:00:00",
            },
        )
        assert second.status_code == 201

    def test_same_time_different_room_allowed(self, client):
        login_as(client, "booker")
        rooms = client.get("/api/rooms", params={"status": "available"}).json()
        assert len(rooms) >= 2

        first = client.post(
            "/api/bookings", json={**self.BOOKING, "room_id": rooms[0]["id"]}
        )
        second = client.post(
            "/api/bookings", json={**self.BOOKING, "room_id": rooms[1]["id"]}
        )
        assert first.status_code == 201
        assert second.status_code == 201

    def test_cannot_approve_two_conflicting_bookings(self, client):
        # Dua booking overlap: satu approved, satunya tidak boleh approved.
        login_as(client, "booker")
        room = self._available_room(client)

        b1 = client.post(
            "/api/bookings", json={**self.BOOKING, "room_id": room["id"]}
        ).json()
        b2 = client.post(
            "/api/bookings",
            json={
                **self.BOOKING,
                "room_id": room["id"],
                "waktu_mulai": "09:30:00",
                "waktu_selesai": "10:30:00",
            },
        )
        # b2 ditolak saat create karena overlap dengan pending b1.
        assert b2.status_code == 409

    def test_approval_page_shows_room_name(self, client):
        login_as(client, "booker")
        room = self._available_room(client)
        booking = client.post(
            "/api/bookings", json={**self.BOOKING, "room_id": room["id"]}
        ).json()

        login_as(client, "admin")
        pending = client.get("/api/bookings/pending").json()
        target = next(b for b in pending if b["id"] == booking["id"])
        assert target["room_name"] == room["name"]
