# Panduan Deployment SiRuangan

Panduan singkat untuk menjalankan landing page / aplikasi SiRuangan di server tim menggunakan Docker Compose dan Cloudflare Tunnel.

## Prasyarat Server

1. Docker dan Docker Compose sudah terpasang.
2. `cloudflared` sudah terpasang di server untuk tunnel SSH / publik.
3. Cloudflare Tunnel sudah diarahkan ke port `8085` di server.
4. File kredensial Google OAuth sudah ada di `~/google-login-credentials.json` di server.
5. (Opsional untuk CI/CD) GitHub Actions runner dapat mengakses server via SSH melalui Cloudflare Access.

## Struktur File yang Dideploy

Default deploy ke home directory user `webserver-2` karena user tidak punya akses ke `/opt`:

```
~/si-ruangan
├── backend/
├── frontend/
├── landing/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── google-login-credentials.json   # tidak ikut di-deploy dari repo
```

## Menyiapkan Kredensial Google OAuth

1. Buat OAuth 2.0 Client ID di [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Tambahkan **Authorized redirect URI**:
   - Lokal: `http://localhost:8085/api/auth/google/callback`
   - Produksi: `https://ruangan.meansrev.tech/api/auth/google/callback` (sesuaikan domain)
3. Simpan file JSON di server pada path `~/google-login-credentials.json`:

```json
{
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "https://ruangan.meansrev.tech/api/auth/google/callback"
}
```

File ini dibaca langsung oleh container backend melalui volume mount; tidak perlu menyimpannya sebagai environment variable.

## Menjalankan Aplikasi

```bash
cd ~/si-ruangan
docker compose up -d --build
```

Aplikasi akan berjalan di beberapa container dan dipublikasikan ke host pada port `8085`.

- Akses lokal server: http://localhost:8085
- URL publik: sesuai konfigurasi Cloudflare Tunnel (misalnya https://ruangan.meansrev.tech atau domain lain yang ditentukan tim).

### Routing Path

| Path | Layanan |
|------|---------|
| `/` | Landing page statis |
| `/app` dan `/app/*` | Portal frontend (Next.js + shadcn/ui) |
| `/api` dan `/api/*` | FastAPI backend |
| `/health` | Healthcheck nginx |

## Memeriksa Status

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f backend
docker compose logs -f frontend
curl -sf http://localhost:8085/health
curl -sf http://localhost:8085/api/health
```

## Update ke Versi Terbaru

Jika melakukan deploy manual:

```bash
cd ~/si-ruangan
git pull origin main   # jika repo di-clone di server
docker compose up -d --build
docker compose ps
```

Jika menggunakan GitHub Actions, cukup push ke branch `main`. Pipeline akan otomatis mensinkronkan file dan menjalankan `docker compose up -d --build` di server.

> **Catatan:** File `~/google-login-credentials.json` tidak ikut tersalin dari repo. Pastikan file tersebut tetap ada di server setelah deploy.

## Menambahkan Anggota Tim ke Cloudflare Access

1. Buka dashboard Cloudflare Zero Trust.
2. Pilih **Access > Applications**.
3. Pilih aplikasi yang melindungi `sshd.meansrev.tech`.
4. Tambahkan email anggota tim di bagian **Policies** atau buat kebijakan baru untuk grup "SiRuangan Team".

## Troubleshooting

- **Akses denied ke `/opt`**: default deploy sekarang menggunakan `~/si-ruangan` (home directory user `webserver-2`). Jangan pakai `/opt`.
- **Port 8085 tidak bisa diakses**: periksa firewall server dan pastikan Cloudflare Tunnel mengarah ke `http://localhost:8085`.
- **Container tidak start**: jalankan `docker compose logs <service>` untuk melihat pesan error.
- **Login Google gagal**: pastikan `~/google-login-credentials.json` ada dan `redirect_uri` di dalamnya cocok dengan domain publik serta didaftarkan di Google Cloud Console.
- **File landing tidak muncul**: pastikan folder `landing/` ikut tersalin saat deploy (rsync atau `git pull` berhasil).
