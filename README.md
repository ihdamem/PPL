# PPL — Sistem Peminjaman Ruangan Kampus UGM

Repositori ini berisi implementasi perangkat lunak dari rencana yang didokumentasikan di [`initial-plan.md`](initial-plan.md): **Sistem Peminjaman Ruangan Kampus UGM**.

Sistem ini dirancang untuk mempermudah proses peminjaman ruangan di lingkungan kampus dengan menyediakan autentikasi berbasis peran, manajemen ruangan dan ketersediaan, pengajuan booking, serta alur persetujuan (approval workflow).

> Catatan: Berdasarkan analisis awal, sistem ini dapat berjalan secara efektif menggunakan pendekatan sistem informasi konvensional. Fitur AI dapat ditambahkan sebagai rekomendasi ruangan jika diperlukan.

---

## 🚀 Menjalankan Secara Lokal

Pastikan file `~/google-login-credentials.json` sudah ada. Contoh format:

```json
{
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "http://localhost:8085/api/auth/google/callback"
}
```

Lalu jalankan:

```bash
docker compose up -d --build
```

Akses aplikasi di `http://localhost:8085`:

- `/` — Landing page
- `/app` — Portal frontend (Next.js + shadcn/ui)
- `/app/login` — Halaman login Google
- `/api` — FastAPI backend

---

## 📋 Rencana Pengembangan

| Fase | Kegiatan |
|------|----------|
| 1. Inisiasi | Finalisasi kebutuhan fungsional, persona, dan desain UML |
| 2. Desain | Product design hierarchy, skenario, user story, dan identifikasi fitur |
| 3. Implementasi | Pengembangan fitur autentikasi, manajemen ruangan, booking, dan approval |
| 4. Pengujian | Validasi alur booking, konflik jadwal, dan audit log |
| 5. Deployment | Menjalankan sistem menggunakan Docker Compose |

---

## ✅ Status Implementasi

Dibandingkan dengan requirement di [`initial-plan.md`](initial-plan.md):

| Fitur | Status |
|---|---|
| Autentikasi (Google OAuth + `mock-login` untuk development) | ✅ Selesai |
| Pengajuan booking, riwayat, dan approval (approve/reject + alasan penolakan) | ✅ Selesai |
| Audit log (FR-10) — mencatat setiap aksi create/approve/reject | ✅ Selesai (`backend/app/audit.py`) |
| Notifikasi dalam aplikasi — ikon lonceng di dashboard | ✅ Selesai (`backend/app/notifications.py`, `frontend/components/notification-bell.tsx`) |
| Dark mode | ✅ Selesai |
| Notifikasi email (FR-08) | ❌ Belum — butuh kredensial layanan email (SMTP/SendGrid dsb.) |
| Pemetaan role otomatis untuk login Google asli | ❌ Belum — lihat bagian [Manajemen Role & Akses](#-manajemen-role--akses) |
| Manajemen ruangan / CRUD room | ❌ Belum diimplementasikan |
| Deteksi konflik jadwal otomatis (FR-06) | ❌ Belum diimplementasikan |

---

## 🗂️ Struktur Repositori

```
PPL/
├── backend/            # FastAPI backend (uv)
│   ├── app/            # Modul aplikasi: auth, config, models
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/           # Next.js + shadcn/ui portal
│   ├── app/            # App router
│   ├── components/     # Komponen shadcn/ui
│   ├── Dockerfile
│   └── package.json
├── landing/            # Halaman landing page statis (HTML/CSS/JS)
├── deploy/             # Panduan deployment untuk tim
├── scripts/            # Skrip deploy manual via Cloudflare tunnel
├── .github/workflows/  # GitHub Actions CI/CD
├── Dockerfile          # Image nginx untuk reverse proxy + landing page
├── nginx.conf          # Konfigurasi web server nginx
├── docker-compose.yml  # Orkestrasi container, menerbitkan port 8085
├── initial-plan.md     # Dokumen rencana dan desain awal
├── img/                # Diagram dan gambar dari initial-plan.md
├── README.md           # Ringkasan proyek ini
└── .gitignore          # Daftar file/folder yang diabaikan Git
```

---

## 🔐 Autentikasi Google OAuth

Backend membaca kredensial Google dari file, bukan environment variable:

- Path di host: `~/google-login-credentials.json`
- Path di container backend: `/app/credentials/google-login-credentials.json`
- Format: lihat `google-login-credentials.example.json`

Ubah `redirect_uri` sesuai domain/server:

- Lokal: `http://localhost:8085/api/auth/google/callback`
- Produksi: `https://your-domain/api/auth/google/callback`

Pastikan URI tersebut didaftarkan di **Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs**.

---

## 🔑 Manajemen Role & Akses

Sistem memiliki 3 role (`backend/app/models.py`): `user`, `admin`, dan `approver`. Sesuai persona di [`initial-plan.md`](initial-plan.md), **Admin merangkap sebagai penyetuju booking** — role `approver` di kode adalah pemisahan teknis tambahan untuk fleksibilitas ke depan, bukan persona terpisah di rencana awal. Keduanya (`admin` dan `approver`) sama-sama boleh approve/reject booking.

### ✅ Status saat ini: ada pemetaan role otomatis via environment

Saat user login lewat Google OAuth (`/auth/google/callback`), role ditentukan berdasarkan email:

- Email yang tercantum di env `ADMIN_EMAILS` (comma-separated) → otomatis `admin`
- Email yang tercantum di env `APPROVER_EMAILS` (comma-separated) → otomatis `approver`
- Email lainnya → default `user`

Semua email dinormalisasi ke lowercase sebelum dibandingkan. Gunakan domain `@mail.ugm.ac.id` (email mahasiswa UGM).

Contoh konfigurasi di environment / `docker-compose.yml`:
```
ADMIN_EMAILS=aldiindrawan@mail.ugm.ac.id
APPROVER_EMAILS=rima@mail.ugm.ac.id,prima@mail.ugm.ac.id
```

Endpoint `/auth/mock-login` tetap hanya untuk development lokal (`DEBUG=true`).

### Rencana implementasi (disepakati tim)

Role ditentukan otomatis berdasarkan email saat login Google OAuth. Konfigurasi dilakukan lewat environment variable `ADMIN_EMAILS` dan `APPROVER_EMAILS` (comma-separated, case-insensitive). Semua email harus menggunakan domain `@mail.ugm.ac.id`.

Data user disimpan di database SQLite (`backend/data/siruangan.db`) via modul `backend/app/database.py`. Setiap login, user di-upsert (dibuat jika belum ada, di-update jika sudah ada).

| Bagian | Status |
|---|---|
| `backend/app/config.py` | ✅ `admin_emails`, `approver_emails` dari env |
| `backend/app/database.py` | ✅ SQLite user store, `upsert_google_user()`, `get_user_by_sub()` |
| `backend/app/auth.py` | ✅ `role_for_email()` mapping otomatis, `google_callback` pakai upsert |
| `backend/app/profile.py` | ✅ Profile router |
| Frontend `dashboard/profile` | ✅ Halaman Profil Saya |

---

## 👥 Tim Pengembang

| Nama | NIM |
|------|-----|
| Aldi Indrawan | 25/557923/PPA/07038 |
| Dimas Ihdam Maulana | 25/562999/PPA/07090 |
| Hanan Fakhira Rima Wibowo | 25/564467/PPA/07122 |
| Prima Adi Pradana | 25/568512/PPA/07150 |

---

## CI/CD Deployment

Repositori ini menyertakan pipeline GitHub Actions untuk *push-to-deploy* dan skrip deploy lokal.

### Push to Deploy (GitHub Actions)

Setiap push ke branch `main` akan:

1. Membangun image Docker dari `Dockerfile`.
2. Menyinkronkan file ke server `sshd.meansrev.tech` melalui tunnel Cloudflare Access.
3. Menjalankan `docker compose up -d --build` di direktori `~/si-ruangan` (home directory user SSH, karena tidak punya akses `/opt`).
4. Melakukan health check ke `http://localhost:8085/health`.

Konfigurasi yang diperlukan di **Settings > Secrets and variables > Actions** repositori GitHub:

| Secret | Keterangan |
|--------|------------|
| `SSH_HOST` | `sshd.meansrev.tech` |
| `SSH_USER` | user SSH di server, contoh: `webserver-2` |
| `SSH_PASSWORD` | password SSH user tersebut |
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access service token ID (agar cloudflared tidak perlu login interaktif) |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access service token secret |

### Deploy Manual dari Lokal

Jika ingin deploy dari laptop:

```bash
export SSH_USER="webserver-2"
export SSH_PASSWORD="dimasganteng"
export CF_ACCESS_CLIENT_ID="..."
export CF_ACCESS_CLIENT_SECRET="..."
./scripts/deploy.sh
```

Setelah berhasil, aplikasi landing page dapat diakses di server pada port `8085`. Lihat `deploy/README.md` untuk detail lebih lanjut.

---
