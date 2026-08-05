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
