"""Test endpoint API via TestClient (auth, admin, booking)."""

from tests.conftest import login_as


class TestAuthEndpoints:
    def test_me_requires_login(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_mock_login_booker(self, client):
        user = login_as(client, "booker")
        assert user["role"] == "booker"

    def test_mock_login_admin(self, client):
        user = login_as(client, "admin")
        assert user["role"] == "admin"

    def test_mock_login_superadmin(self, client):
        user = login_as(client, "superadmin")
        assert user["role"] == "superadmin"

    def test_mock_login_invalid_role(self, client):
        response = client.get("/api/auth/mock-login?role=hacker")
        assert response.status_code == 422

    def test_logout_clears_session(self, client):
        login_as(client, "booker")
        logout = client.post("/api/auth/logout")
        assert logout.status_code == 200

        me = client.get("/api/auth/me")
        assert me.status_code == 401

    def test_health(self, client):
        assert client.get("/api/health").json() == {"status": "ok"}


VALID_BOOKING = {
    "room_id": 1,
    "tanggal": "2026-03-10",
    "waktu_mulai": "09:00:00",
    "waktu_selesai": "11:00:00",
    "keperluan": "Rapat divisi mingguan",
    "jumlah_peserta": 12,
}


class TestAdminUserManagement:
    def test_list_users_requires_login(self, client):
        assert client.get("/api/admin/users").status_code == 401

    def test_list_users_forbidden_for_booker(self, client):
        login_as(client, "booker")
        assert client.get("/api/admin/users").status_code == 403

    def test_list_users_forbidden_for_admin(self, client):
        login_as(client, "admin")
        assert client.get("/api/admin/users").status_code == 403

    def test_superadmin_can_list_users(self, client):
        # Login booker dulu supaya user-nya terdaftar, lalu superadmin terakhir
        # karena cookie session akan ditimpa oleh login berikutnya.
        booker = login_as(client, "booker")
        superadmin = login_as(client, "superadmin")

        response = client.get("/api/admin/users")
        assert response.status_code == 200

        users = response.json()
        subs = {u["sub"] for u in users}
        assert superadmin["sub"] in subs
        assert booker["sub"] in subs

    def test_superadmin_can_promote_booker_to_admin(self, client):
        booker = login_as(client, "booker")
        login_as(client, "superadmin")

        response = client.patch(
            f"/api/admin/users/{booker['sub']}/role",
            json={"role": "admin"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    def test_cannot_assign_superadmin_role(self, client):
        booker = login_as(client, "booker")
        login_as(client, "superadmin")

        response = client.patch(
            f"/api/admin/users/{booker['sub']}/role",
            json={"role": "superadmin"},
        )
        assert response.status_code == 400

    def test_update_missing_user_returns_404(self, client):
        login_as(client, "superadmin")
        response = client.patch(
            "/api/admin/users/ghost-sub/role",
            json={"role": "admin"},
        )
        assert response.status_code == 404


class TestBookingFlow:
    def test_create_booking_as_booker(self, client, reset_memory):
        login_as(client, "booker")

        response = client.post("/api/bookings", json=VALID_BOOKING)
        assert response.status_code == 201
        booking = response.json()
        assert booking["status"] == "pending"
        assert booking["keperluan"] == VALID_BOOKING["keperluan"]

    def test_create_booking_requires_login(self, client, reset_memory):
        response = client.post("/api/bookings", json=VALID_BOOKING)
        assert response.status_code == 401

    def test_end_time_must_be_after_start_time(self, client, reset_memory):
        login_as(client, "booker")

        payload = {**VALID_BOOKING, "waktu_mulai": "11:00:00", "waktu_selesai": "09:00:00"}
        response = client.post("/api/bookings", json=payload)
        assert response.status_code == 400

    def test_keperluan_minimal_5_karakter(self, client, reset_memory):
        login_as(client, "booker")

        payload = {**VALID_BOOKING, "keperluan": "abcd"}
        response = client.post("/api/bookings", json=payload)
        assert response.status_code == 422

    def test_booker_sees_only_own_bookings(self, client, reset_memory):
        # Booker membuat booking.
        login_as(client, "booker")
        client.post("/api/bookings", json=VALID_BOOKING)

        # Admin membuat booking miliknya sendiri.
        login_as(client, "admin")
        client.post("/api/bookings", json=VALID_BOOKING)

        # Booker kembali login — hanya boleh melihat booking miliknya.
        login_as(client, "booker")
        bookings = client.get("/api/bookings").json()
        assert len(bookings) == 1
        assert bookings[0]["user_id"] == "mock-user-aldi-123"

    def test_approval_requires_staff(self, client, reset_memory):
        login_as(client, "booker")
        booking = client.post("/api/bookings", json=VALID_BOOKING).json()

        # Booker mencoba menyetujui bookingnya sendiri.
        response = client.patch(
            f"/api/bookings/{booking['id']}/approval",
            json={"action": "approve"},
        )
        assert response.status_code == 403

    def test_admin_can_approve_booking(self, client, reset_memory):
        login_as(client, "booker")
        booking = client.post("/api/bookings", json=VALID_BOOKING).json()

        login_as(client, "admin")
        response = client.patch(
            f"/api/bookings/{booking['id']}/approval",
            json={"action": "approve"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    def test_reject_requires_alasan(self, client, reset_memory):
        login_as(client, "booker")
        booking = client.post("/api/bookings", json=VALID_BOOKING).json()

        login_as(client, "admin")
        response = client.patch(
            f"/api/bookings/{booking['id']}/approval",
            json={"action": "reject"},
        )
        assert response.status_code == 400

    def test_reject_with_alasan(self, client, reset_memory):
        login_as(client, "booker")
        booking = client.post("/api/bookings", json=VALID_BOOKING).json()

        login_as(client, "admin")
        response = client.patch(
            f"/api/bookings/{booking['id']}/approval",
            json={"action": "reject", "alasan_penolakan": "Bentrok dengan acara kampus"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_cannot_process_non_pending_booking(self, client, reset_memory):
        login_as(client, "booker")
        booking = client.post("/api/bookings", json=VALID_BOOKING).json()

        login_as(client, "admin")
        client.patch(
            f"/api/bookings/{booking['id']}/approval",
            json={"action": "approve"},
        )

        # Approve kedua kali harus gagal karena sudah approved.
        response = client.patch(
            f"/api/bookings/{booking['id']}/approval",
            json={"action": "approve"},
        )
        assert response.status_code == 400
