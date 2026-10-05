# E-Hibah - Hibah Peternakan

MVP frontend interaktif untuk aplikasi pengelolaan hibah bidang peternakan berdasarkan `PRD_Aplikasi_Hibah_Bidang_Peternakan.md`.

## Menjalankan lokal dengan Laragon

1. Jalankan **MySQL** dari Laragon.
2. Untuk instalasi baru atau deployment ke perangkat lain, import `database/schema.sql`, lalu jalankan `database/migration_seed_current_config.sql` melalui HeidiSQL atau klien MySQL Laragon. Seed ini memasang konfigurasi Config Field, Form Verifikasi, pengumuman, styling pengumuman, dan Pustaka dari default sistem saat ini; seed tidak menyalin data hibah atau akun user. Jika database versi sebelumnya sudah ada, jalankan migrasi yang belum diterapkan: `database/migration_add_field_prompts.sql`, `database/migration_add_users.sql`, `database/migration_add_user_whatsapp.sql`, `database/migration_add_verification.sql`, `database/migration_add_sync_changes.sql`, `database/migration_add_app_settings.sql`, dan `database/migration_seed_current_config.sql`.
3. Pastikan PHP Laragon aktif dan ekstensi `pdo_mysql` tersedia. Dari terminal proyek, jalankan API:

```powershell
php -S 127.0.0.1:8001 -t .
```

4. Di terminal lain, jalankan frontend:

```powershell
npm install
npm run dev
```

Vite meneruskan `/api` ke server PHP Laragon. Buka URL Vite yang tampil di terminal; perubahan Config Field, Database Hibah, Config Form Verifikasi, Database Verifikasi Hibah, dan Manajemen User disimpan ke MySQL. Frontend otomatis menarik jurnal perubahan per entitas setiap 3 detik; tombol **Sinkronisasi** menarik delta terbaru secara manual tanpa mengunduh ulang seluruh koleksi. Form verifikasi mengambil snapshot data Hibah sumber dan konfigurasi pertanyaan aktif. Pada pemakaian pertama, data lama dari `localStorage` browser dimigrasikan satu kali jika database belum diinisialisasi. Login diverifikasi oleh server, sesi disimpan oleh PHP, dan password akun disimpan sebagai hash; preferensi tampilan dan bahasa tetap disimpan di browser.

Kredensial database lokal dapat diatur melalui `HIBAH_DB_HOST`, `HIBAH_DB_PORT`, `HIBAH_DB_NAME`, `HIBAH_DB_USER`, dan `HIBAH_DB_PASSWORD`. Nilai default ditujukan untuk instalasi Laragon lokal dengan user MySQL `root` tanpa password.

Untuk production build:

```bash
npm run build
npm run preview
```

## Akun demo

Pada layar login, pilih role `Superadmin` atau `User`. Akun awal: `admin` / `admin123` untuk Superadmin, `rina` / `rina123` untuk User. Akun dan password diverifikasi oleh API dan disimpan di MySQL.

## Fitur yang tersedia

- Dashboard ringkasan nilai dan status pengajuan.
- CRUD data hibah dengan form dinamis.
- Tipe field text, paragraph, number, date, time, checklist, dan list.
- Config field khusus Superadmin dengan pengaturan urutan, aktif/nonaktif, wajib, opsi, placeholder, dan deskripsi.
- Config Form Verifikasi khusus Superadmin serta CRUD hasil verifikasi yang tertaut ke data Hibah.
- Manajemen user dengan penyimpanan database dan verifikasi password ber-hash.
- Role-aware navigation untuk Superadmin dan User.
- Tema Green Pastel, Light, Dark, dan Blue Sky.
- Bahasa Indonesia dan English untuk label utama.
- Dockerfile dan Docker Compose untuk deployment container sederhana di port 9100.

## Catatan integrasi backend

Frontend Vite memakai API PHP/PDO lokal yang disediakan Laragon. Data hibah menggunakan kolom JSON MySQL, sedangkan field dinamis dan akun pengguna (termasuk kontak WhatsApp) memakai tabel tersendiri. Sinkronisasi antar-browser memakai polling berkala.
