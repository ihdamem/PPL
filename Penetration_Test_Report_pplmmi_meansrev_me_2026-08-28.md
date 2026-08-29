# Penetration Test Report — pplmmi.meansrev.me

- Target     : https://pplmmi.meansrev.me/ (subdomain meansrev.me)
- Nama Aplikasi : SiRuangan — Sistem Peminjaman Ruangan Kampus UGM
- Date       : 2026-08-28
- Scope      : Authorized (domain milik tester)
- Metodologi : HexStrike AI v6.0 (111 tools, HTTP API 127.0.0.1:8888) — amass, subfinder, wafw00f, nmap, sslscan, ffuf, curl, JS chunk analysis, nuclei (partial; template path /home/meansrev/nuclei-templates)

## 1. Executive Summary

Postur keamanan target tergolong BAIK untuk situs statis + SPA. TIDAK ditemukan vulnerability
Critical/High. Seluruh temuan berkelas Low/Info (hardening). Infrastruktur dibelakang Cloudflare
(WAF + CDN), origin IP tidak terekspos, tidak ada CORS misconfig, tidak ada file exposure,
tidak ada source map publik, HTTP method non-standar diblokir (405), dan dir-bruteforce root
(4593 kata) seluruhnya false-positive.

Risiko utama (jika ada) ada di area autentikasi Google OAuth `/app/api/*` yang belum bisa dites
penuh tanpa akun uji. Endpoint API merespons 500 saat dipanggil tanpa sesi — perlu error
handling yang lebih rapi dan pengetesan lanjutan dengan kredensial uji (IDOR/BOLA, authorization).

## 2. Ringkasan Temuan

| ID  | Severity | Judul                                        | CWE        |
|-----|----------|----------------------------------------------|------------|
| F-1 | Low      | Security headers tidak lengkap (HSTS, CSP, Permissions-Policy) | CWE-693 |
| F-2 | Low      | TLS 1.1 masih enabled di edge                 | CWE-757   |
| F-3 | Info     | HTTP tidak redirect paksa ke HTTPS            | CWE-319   |
| F-4 | Info     | Header x-powered-by: Next.js terdisclosure    | CWE-200   |
| F-5 | Info     | Semua /app/api/* mengembalikan 500 tanpa sesi (unhandled exception) | CWE-209 |
| F-6 | Info     | SPA fallback false-200 untuk semua path tak dikenal | CWE-538 |
| F-7 | Info     | Auth surface mapping: /app/login real, /app/register 404, Google OAuth-only | CWE-200 |

## 3. Teknologi & Infrastruktur

- WAF/CDN : Cloudflare (wafw00f confirmed). NS: ezra.ns.cloudflare.com, iris.ns.cloudflare.com (ASN 13335)
- IP resolusi: 172.67.170.147, 104.21.71.131 (+ IPv6 2606:4700:*) — seluruhnya Cloudflare, origin IP tidak terekspos
- TLS cert : Google Trust Services WE1, CN=meansrev.me, SAN=*.meansrev.me, berlaku 2026-07-29 s.d. 2026-10-27
- Landing (root "/") : HTML/CSS/JS vanilla statis; app.js hanya nav-toggle + smooth-scroll; tanpa form/input server-side
- Aplikasi ("/app") : Next.js (buildId 7BBJvJYIG2AQVGo-7u-QB, assetPrefix /app)
  - Routes terverifikasi (ffuf + JS chunks):
    - /app (portal, 200)
    - /app/login (200, 6010 byte — halaman login REAL, JS chunk app/login/page-8d869d876576c27e.js)
    - /app/dashboard (200 — client-side gate, render "Memuat dashboard…")
    - /app/register (404 — TIDAK ADA registrasi publik, login Google-only)
    - /app/api (500), /app/api/auth/google (500), /app/api/auth/me (500)
    - /app/api/{rooms,booking,faculty,schedule,profile,users,admin} (semua 500 tanpa sesi)
  - Login chunk: `fetch("/api/auth/me",{credentials:"include"})` → redirect /dashboard
  - 160 panggilan fetch() pada chunks; tidak ada secret/token hardcoded ditemukan
- Subdomain lain: tidak ditemukan (crt.sh down 502 saat pengujian; subfinder tanpa API key)

## 4. Detail Temuan

### F-1 — Security headers tidak lengkap [Low, CWE-693]
Bukti: semua respons punya x-content-type-options: nosniff, x-frame-options: SAMEORIGIN,
referrer-policy: strict-origin-when-cross-origin. YANG TIDAK ADA: Strict-Transport-Security,
Content-Security-Policy, Permissions-Policy.
Remediasi: aktifkan HSTS di Cloudflare (SSL/TLS → Edge Certificates), tambah CSP & Permissions-Policy
via Transform Rules atau header origin.

### F-2 — TLS 1.1 enabled [Low, CWE-757]
Bukti (sslscan): TLSv1.1 enabled; TLSv1.0/SSLv3/SSLv2 disabled. Tidak vulnerable Heartbleed.
Remediasi: Cloudflare → SSL/TLS → Edge Certificates → "Minimum TLS Version" = 1.2.

### F-3 — HTTP tanpa redirect paksa [Info, CWE-319]
Bukti: `http://pplmmi.meansrev.me/` -> HTTP 200 (bukan 301).
Remediasi: aktifkan "Always Use HTTPS" di Cloudflare.

### F-4 — x-powered-by disclosure [Info, CWE-200]
Bukti: header `x-powered-by: Next.js` pada /app/dashboard.
Remediasi: settings Next.js (poweredByHeader: false).

### F-5 — Semua /app/api/* 500 tanpa sesi [Info, CWE-209]
Bukti (tanpa cookie, HTTP 500 "Internal Server Error"):
/app/api, /app/api/auth/google, /app/api/auth/me, /app/api/{rooms,booking,faculty,schedule,profile,users,admin}.
Remediasi: kembalikan 401 JSON yang rapi; log exception tanpa stack trace ke client.
Catatan: endpoint auth penuh (Google OAuth + sesi) belum dites dengan kredensial valid.

### F-6 — SPA fallback false-200 [Info, CWE-538]
Bukti: semua path tak dikenal (/.git/HEAD, /.env, /backup.zip, /database.sql, /phpinfo.php, dll.)
mengembalikan 200 + shell HTML (10479/10516 byte di root; 11480 byte di /app; text/html).
BUKAN file asli — diverifikasi dengan hash body sama dengan index.
Remediasi: batasi fallback (404.html dengan status 404, atau _routes.json eksplisit).

### F-7 — Auth surface mapping [Info, CWE-200]
Bukti: /app/login = halaman login real (200). /app/register = 404 (tidak ada registrasi publik →
Google OAuth-only). Semua /app/api/* hidup (500 saat no-session).
Remediasi: pastikan login/API hanya via flow OAuth yang rapi; pertimbangkan rate-limit pada
/api/auth/* untuk mencegah brute/enum; tambahkan CSRF protection pada callback OAuth.

## 5. Yang SUDAH Teruji Aman

- File exposure (.git, .env, backup, sql dump, phpinfo, dll.) : TIDAK ADA (semua false-200 fallback)
- Source map Next.js (chunks .js.map) : tidak dapat diakses (404)
- CORS : tidak ada Access-Control-Allow-Origin dari Origin asing
- HTTP methods (OPTIONS/TRACE/PUT/DELETE) : 405
- Subdomain takeover : tidak ada subdomain lain ditemukan
- XSS/SQLi surface : tidak ada input server-side yang reachable tanpa auth
- Secret hardcoded di JS : tidak ditemukan
- Root dir brute (4593 kata dirb) : SEMUA false-positive (SHA1 identik base_index.html, 10516 byte)
- /app/admin, /app/web.config, route tak dikenal : 404 Next.js shell — BUKAN admin panel

## 6. CATATAN Next.js (pitfall verifikasi)

/app/admin (~7728 byte) dan /app/xyzzy (kata acak) sama-sama berisi `<title>404: This page could
not be found.</title>` → keduanya 404 shell, BUKAN route asli. SHA1 antar-404-shell BERBEDA karena
Next.js RSC menyematkan ID route-specific di inline script → verifikasi 404 harus pakai body text
(title/marker), bukan hash/ukuran.

## 7. Remaining Unknowns

- Autentikasi penuh /app/api/auth/google, /app/login, /app/dashboard pada data real (butuh akun Google/UGM test)
- Endpoint bisnis di balik auth (peminjaman ruangan) — IDOR/BOLA, authorization, business logic
- Origin server di balik Cloudflare — scan penuh hanya sampai edge
- Nuclei full scan belum tuntas (timeout 60s di wrapper HexStrike; template tersedia di /home/meansrev/nuclei-templates)

## 8. Remediation Roadmap

- P1 (24 jam) : tidak ada temuan critical — tidak ada aksi mendesak
- P2 (1 minggu) : HSTS + Minimum TLS 1.2 + Always Use HTTPS + CSP + Permissions-Policy (semua di Cloudflare)
- P3 (1 bulan) : suppress x-powered-by; perbaiki error handling API auth (401 JSON tanpa stack); batasi SPA fallback (404 asli)
- P4 (siklus berikutnya) : pentest lanjutan area auth & dashboard dengan akun uji (IDOR/authorization),
  pantau crt.sh/subfinder dengan API key untuk subdomain

## 9. Lingkungan Testing

- HexStrike server : dimatikan setelah sesi (sebelumnya bind 0.0.0.0:8888; perhatikan paparan LAN).
  Restart: cd /home/meansrev/hexstrike-ai && ./start.sh
- Log stale hexstrike.log di-rotate ke hexstrike.log.bak.1787902978 (7.7MB berisi error lama hs.sh batch)
- Tool quirks: httpx = Python shim (bukan PD httpx); whatweb rusak (LoadError); seclists tidak ada
  (pakai /usr/share/dirb/wordlists/common.txt); nuclei templates di /home/meansrev/nuclei-templates