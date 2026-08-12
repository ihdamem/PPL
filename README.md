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

### ⚠️ Status saat ini: belum ada pemetaan role otomatis

Saat user login lewat Google OAuth asli (`backend/app/auth.py`, endpoint `/auth/google/callback`), role **selalu default ke `user`** — tidak ada mekanisme untuk menjadikan seseorang admin/approver. Satu-satunya cara mendapat role `approver` saat ini adalah lewat endpoint `/auth/mock-login`, yang khusus untuk development lokal (bukan untuk produksi).

Artinya: di server produksi sekarang, **belum ada seorang pun yang bisa membuka dashboard approval** lewat login Google asli.

### Rencana implementasi (disepakati tim)

Alih-alih form pilihan role saat login (rawan disalahgunakan — siapa pun bisa asal klik "admin"), dipakai model **super admin yang meng-assign role dari dalam aplikasi**:

1. **Default saat login pertama kali**: siapa pun yang login lewat Google (belum pernah login sebelumnya) otomatis dapat role `user` (peminjam).
2. **1 super admin tetap**: ditentukan lewat satu email di konfigurasi environment variable `SUPER_ADMIN_EMAIL` (bukan role terpisah di database — orang ini otomatis dapat role `admin` plus kewenangan ekstra untuk mengelola role user lain). Default sementara: `aldi@ugm.ac.id` (identitas `mock-login` untuk memudahkan testing lokal) — **wajib diganti ke email asli saat deploy produksi**.
3. **Super admin bisa assign role user lain** — naik jadi `admin` atau `approver`, atau turun lagi jadi `user` biasa — lewat halaman khusus di dashboard ("Kelola User"), bukan lewat env var per orang.
4. Supaya ini bisa jalan, sistem perlu **menyimpan daftar user yang pernah login** (belum ada sebelumnya — sebelumnya data user cuma hidup sesaat, tidak pernah disimpan lintas sesi). Disimpan in-memory dulu (`backend/app/user_store.py`), konsisten dengan pola penyimpanan booking/audit/notifikasi yang sudah ada.

### Rencana teknis (belum diimplementasikan)

| Bagian | Rencana |
|---|---|
| `backend/app/config.py` | Tambah `super_admin_email` |
| `backend/app/user_store.py` *(baru)* | `fake_users_db` (dict per email), `get_or_create_user()`, `is_super_admin()` |
| `backend/app/users.py` *(baru)* | `GET /api/users` (daftar user, khusus super admin), `PATCH /api/users/{email}/role` (ubah role, khusus super admin) |
| `backend/app/auth.py` | `google_callback` & `mock_login` pakai `get_or_create_user()` (role persisten, bukan dibuat ulang tiap login); `/auth/me` menyertakan flag `is_super_admin` |
| Frontend | Halaman baru `dashboard/users` ("Kelola User"), menu ini cuma tampil kalau `is_super_admin === true` |

Status: **belum diimplementasikan** — didokumentasikan di sini sebagai rencana yang sudah disepakati tim, sebelum dikerjakan.

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
