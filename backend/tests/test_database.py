"""Test persistence layer SQLite (app/database.py)."""

from app.models import Role
from app.database import (
    _normalize_role,
    get_user_by_email,
    get_user_by_sub,
    list_users,
    update_profile,
    update_user_role,
    upsert_google_user,
)


def make_user(sub: str, email: str, role: Role = Role.BOOKER, name: str = "Budi"):
    return upsert_google_user(
        email=email, name=name, picture=None, sub=sub, role=role
    )


class TestUpsertGoogleUser:
    def test_create_new_user(self, db):
        user = make_user("sub-1", "budi@mail.ugm.ac.id")
        assert user.email == "budi@mail.ugm.ac.id"
        assert user.role == Role.BOOKER
        assert user.sub == "sub-1"

    def test_update_existing_user_keeps_profile_fields(self, db):
        make_user("sub-1", "budi@mail.ugm.ac.id")
        update_profile(
            sub="sub-1",
            name="Budi Updated",
            nomor_induk="25/123456/PPA/00001",
            departemen="Ilmu Komputer",
        )

        # Re-login dengan data Google; profile fields tidak boleh tertimpa.
        upsert_google_user(
            email="budi@mail.ugm.ac.id",
            name="Budi From Google",
            picture=None,
            sub="sub-1",
            role=Role.BOOKER,
        )

        user = get_user_by_sub("sub-1")
        assert user.nomor_induk == "25/123456/PPA/00001"
        assert user.departemen == "Ilmu Komputer"

    def test_get_user_by_email_case_insensitive(self, db):
        make_user("sub-1", "Budi@Mail.UGM.AC.ID")
        user = get_user_by_email("budi@mail.ugm.ac.id")
        assert user is not None
        assert user.sub == "sub-1"

    def test_get_user_by_sub_not_found(self, db):
        assert get_user_by_sub("tidak-ada") is None


class TestListUsers:
    def test_list_users_returns_all(self, db):
        make_user("sub-1", "a@mail.ugm.ac.id")
        make_user("sub-2", "b@mail.ugm.ac.id")
        make_user("sub-3", "c@mail.ugm.ac.id")

        users = list_users()
        assert {u.email for u in users} == {
            "a@mail.ugm.ac.id",
            "b@mail.ugm.ac.id",
            "c@mail.ugm.ac.id",
        }


class TestUpdateUserRole:
    def test_promote_booker_to_admin(self, db):
        make_user("sub-1", "budi@mail.ugm.ac.id")

        updated = update_user_role(sub="sub-1", role=Role.ADMIN)
        assert updated.role == Role.ADMIN

        assert get_user_by_sub("sub-1").role == Role.ADMIN

    def test_demote_admin_to_booker(self, db):
        make_user("sub-1", "budi@mail.ugm.ac.id", role=Role.ADMIN)

        updated = update_user_role(sub="sub-1", role=Role.BOOKER)
        assert updated.role == Role.BOOKER

    def test_update_missing_user_returns_none(self, db):
        assert update_user_role(sub="ghost", role=Role.ADMIN) is None


class TestLegacyRoleNormalization:
    def test_legacy_user_maps_to_booker(self, db):
        assert _normalize_role("user") == Role.BOOKER

    def test_legacy_approver_maps_to_admin(self, db):
        assert _normalize_role("approver") == Role.ADMIN

    def test_current_roles_pass_through(self, db):
        assert _normalize_role("booker") == Role.BOOKER
        assert _normalize_role("admin") == Role.ADMIN
        assert _normalize_role("superadmin") == Role.SUPERADMIN

    def test_unknown_role_falls_back_to_booker(self, db):
        assert _normalize_role("misterius") == Role.BOOKER
