# Handshake Archive

Direktori profil komunitas tanpa login untuk merapikan pertukaran nama, Instagram, dan LinkedIn di room chat yang ramai.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Data API via `@supabase/supabase-js`
- Optional Cloudflare Turnstile untuk submit publik

## Fitur

- Directory publik dengan search, filter platform, dan pagination
- Submit anonim dengan normalisasi handle atau URL ke canonical link yang aman
- Secret edit link satu kali tampil setelah submit
- Report flow anonim dan auto-flagging
- Admin console dengan password-protected session, hide or activate, delete, dan merge duplicates
- Expiry flow 90 hari plus cron endpoint untuk menandai data basi

## Environment

Salin `.env.example` ke `.env.local`, lalu isi minimal:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `APP_SECRET`
- `ADMIN_PASSWORD` atau `ADMIN_PASSWORD_HASH`
- `CRON_SECRET`

Tambahkan ini untuk hardening production:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Untuk membuat `ADMIN_PASSWORD_HASH`, gunakan hash `scrypt` (recommended):

```bash
pnpm hash:admin
```

Atau jika ingin non-interaktif:

```bash
pnpm hash:admin -- "your-admin-password"
```

Format `ADMIN_PASSWORD_HASH` selain `scrypt$N$r$p$salt$hash` tidak lagi didukung.

## Vercel + Supabase

Jalur production yang paling sederhana untuk proyek ini:

- deploy app ke Vercel
- pakai satu project Supabase
- jalankan SQL migration sekali di Supabase SQL Editor
- isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` di Vercel

Env production minimal:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `APP_BASE_URL`
- `APP_SECRET`
- `ADMIN_PASSWORD` atau `ADMIN_PASSWORD_HASH`
- `CRON_SECRET`

Publishable key Supabase tidak dibutuhkan oleh arsitektur app ini karena semua akses data berjalan di server.

### Quick Deploy

1. Buat project Supabase baru dan pilih region terdekat.
2. Buka SQL Editor di Supabase lalu jalankan file [supabase/migrations/001_initial.sql](/Users/iqbalrei/Projects/BI%20Hackthon/link-sharing/supabase/migrations/001_initial.sql).
3. Import repo ini ke Vercel.
4. Isi environment variables di Vercel:

```txt
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=<your server-only secret key>
APP_BASE_URL=https://your-project.vercel.app
APP_SECRET=<random 32+ chars>
ADMIN_PASSWORD=<your admin password>
CRON_SECRET=<random 16+ chars>
```

5. Deploy.
6. Setelah deploy, buka homepage lalu submit satu card test untuk memastikan Data API dan SQL migration sudah sinkron.
7. Login ke `/admin/login` untuk cek akses admin.

## Local Development

```bash
pnpm install
pnpm dev
```

Sebelum menjalankan app, pastikan SQL migration sudah dieksekusi di project Supabase yang sama dengan `SUPABASE_URL`.

## Cron

Endpoint cron tersedia di `GET` atau `POST /api/cron/expire`.

Sertakan header berikut:

```txt
Authorization: Bearer <CRON_SECRET>
```

Di production, jadwalkan endpoint ini minimal sekali sehari.
