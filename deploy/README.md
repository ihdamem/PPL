# Panduan Deployment SiRuangan

Panduan singkat untuk menjalankan landing page / aplikasi SiRuangan di server tim menggunakan Docker Compose dan Cloudflare Tunnel.

## Prasyarat Server

1. Docker dan Docker Compose sudang terpasang.
2. `cloudflared` sudang terpasang di server untuk tunnel SSH / publik.
3. Cloudflare Tunnel sudang diarahkan ke port `8085` di server.
4. (Opsional untuk CI/CD) GitHub Actions runner dapat mengakses server via SSH melalui Cloudflare Access.

## Struktur File yang Dideploy

Default deploy ke home directory user `webserver-2` karena user tidak punya akses ke `/opt`:

```
~/si-ruangan
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── landing/
    ├── index.html
    ├── css/styles.css
    └── js/app.js
```

## Menjalankan Aplikasi

```bash
cd ~/si-ruangan
docker compose up -d --build
```

Aplikasi akan berjalan di container `si-ruangan-web` dan dipublikasikan ke host pada port `8085`.

- Akses lokal server: http://localhost:8085
- URL publik: sesuai konfigurasi Cloudflare Tunnel (misalnya https://ruangan.meansrev.tech atau domain lain yang ditentukan tim).

## Memeriksa Status

```bash
docker compose ps
docker compose logs -f web
curl -sf http://localhost:8085/health
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

## Menambahkan Anggota Tim ke Cloudflare Access

1. Buka dashboard Cloudflare Zero Trust.
2. Pilih **Access > Applications**.
3. Pilih aplikasi yang melindungi `sshd.meansrev.tech`.
4. Tambahkan email anggota tim di bagian **Policies** atau buat kebijakan baru untuk grup "SiRuangan Team".

## Troubleshooting

- **Akses denied ke `/opt`**: default deploy sekarang menggunakan `~/si-ruangan` (home directory user `webserver-2`). Jangan pakai `/opt`.
- **Port 8085 tidak bisa diakses**: periksa firewall server dan pastikan Cloudflare Tunnel mengarah ke `http://localhost:8085`.
- **Container tidak start**: jalankan `docker compose logs web` untuk melihat pesan error nginx.
- **File landing tidak muncul**: pastikan folder `landing/` ikut tersalin saat deploy (rsync atau `git pull` berhasil).
