"""Test konfigurasi dan pemetaan role."""

from app.config import Settings
from app.models import Role
from app.auth import role_for_email


class TestSettings:
    def test_superadmin_email_set_default(self):
        settings = Settings()
        assert "primaadipradana@mail.ugm.ac.id" in settings.superadmin_email_set
        assert "dimasihdammaulana@mail.ugm.ac.id" in settings.superadmin_email_set

    def test_superadmin_email_set_case_insensitive(self):
        settings = Settings(superadmin_emails="PRIMA@MAIL.UGM.AC.ID, budi@mail.ugm.ac.id")
        assert "prima@mail.ugm.ac.id" in settings.superadmin_email_set
        assert "budi@mail.ugm.ac.id" in settings.superadmin_email_set

    def test_superadmin_email_set_ignores_empty_items(self):
        settings = Settings(superadmin_emails=" a@mail.ugm.ac.id , , ,b@mail.ugm.ac.id,")
        assert settings.superadmin_email_set == {
            "a@mail.ugm.ac.id",
            "b@mail.ugm.ac.id",
        }

    def test_cors_origins_wildcard(self):
        settings = Settings(cors_origins="*")
        assert settings.cors_origins_list == ["*"]

    def test_cors_origins_csv(self):
        settings = Settings(
            cors_origins="http://localhost:8085, https://pplmmi.meansrev.me"
        )
        assert settings.cors_origins_list == [
            "http://localhost:8085",
            "https://pplmmi.meansrev.me",
        ]


class TestRoleForEmail:
    def test_prima_is_superadmin(self):
        assert role_for_email("primaadipradana@mail.ugm.ac.id") == Role.SUPERADMIN

    def test_dimas_is_superadmin(self):
        assert role_for_email("dimasihdammaulana@mail.ugm.ac.id") == Role.SUPERADMIN

    def test_hanan_is_superadmin(self):
        assert role_for_email("hanan.f.r@mail.ugm.ac.id") == Role.SUPERADMIN

    def test_superadmin_case_insensitive(self):
        assert (
            role_for_email("PrimaAdiPradana@Mail.Ugm.Ac.Id") == Role.SUPERADMIN
        )

    def test_unknown_email_is_booker(self):
        assert role_for_email("mahasiswa@mail.ugm.ac.id") == Role.BOOKER

    def test_legacy_admin_email_no_longer_auto_admin(self):
        """Email admin lama tidak lagi otomatis admin — harus lewat superadmin."""
        assert role_for_email("aldiindrawan@mail.ugm.ac.id") == Role.BOOKER
