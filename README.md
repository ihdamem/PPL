# PPL — Sistem Peminjaman Ruangan Kampus UGM

Repositori ini berisi implementasi perangkat lunak dari rencana yang didokumentasikan di [`initial-plan.md`](initial-plan.md): **Sistem Peminjaman Ruangan Kampus UGM**.

Sistem ini dirancang untuk mempermudah proses peminjaman ruangan di lingkungan kampus dengan menyediakan autentikasi berbasis peran, manajemen ruangan dan ketersediaan, pengajuan booking, serta alur persetujuan (approval workflow).

> Catatan: Berdasarkan analisis awal, sistem ini dapat berjalan secara efektif menggunakan pendekatan sistem informasi konvensional. Fitur AI dapat ditambahkan sebagai rekomendasi ruangan jika diperlukan.

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
├── initial-plan.md     # Dokumen rencana dan desain awal
├── img/                # Diagram dan gambar dari initial-plan.md
├── README.md           # Ringkasan proyek ini
└── .gitignore          # Daftar file/folder yang diabaikan Git
```

Struktur implementasi (frontend, backend, database, dsb.) akan ditambahkan seiring berjalannya pengembangan.

---

## 👥 Tim Pengembang

| Nama | NIM |
|------|-----|
| Aldi Indrawan | 25/557923/PPA/07038 |
| Dimas Ihdam Maulana | 25/562999/PPA/07090 |
| Hanan Fakhira Rima Wibowo | 25/564467/PPA/07122 |
| Prima Adi Pradana | 25/568512/PPA/07150 |

---

## 📎 Dokumen

- [`initial-plan.md`](initial-plan.md) — dokumen lengkap: functional requirements, product design hierarchy, dan desain UML.
