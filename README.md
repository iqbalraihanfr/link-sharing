# Handshake Archive

Direktori profil komunitas tanpa login untuk merapikan pertukaran nama, Instagram, dan LinkedIn di room chat yang ramai.

## Stack

- Next.js 16 App Router
- React 19
- Postgres via `pg`
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

- `DATABASE_URL`
- `APP_SECRET`
- `ADMIN_PASSWORD` atau `ADMIN_PASSWORD_HASH`
- `CRON_SECRET`

Tambahkan ini untuk hardening production:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Untuk membuat `ADMIN_PASSWORD_HASH`, pakai SHA-256 hex dari password admin kamu.

## Vercel + Supabase

Jalur production yang paling sederhana untuk proyek ini:

- deploy app ke Vercel
- pakai satu project Supabase untuk Postgres
- isi `DATABASE_URL` di Vercel memakai Supabase connection string `transaction mode` (`:6543`)

Env production minimal:

- `DATABASE_URL`
- `APP_BASE_URL`
- `APP_SECRET`
- `ADMIN_PASSWORD` atau `ADMIN_PASSWORD_HASH`
- `CRON_SECRET`

Turnstile optional. Aplikasi tetap berjalan tanpa Redis dan tanpa rate limit.

### Quick Deploy

1. Buat project Supabase baru dan pilih region terdekat.
2. Dari Supabase, copy connection string `transaction mode` (`:6543`) dari menu `Connect`.
3. Import repo ini ke Vercel.
4. Isi environment variables di Vercel:

```txt
DATABASE_URL=<supabase transaction pooler url>
APP_BASE_URL=https://your-project.vercel.app
APP_SECRET=<random 32+ chars>
ADMIN_PASSWORD=<your admin password>
CRON_SECRET=<random 16+ chars>
```

5. Deploy.
6. Setelah deploy, buka homepage lalu submit satu card test agar tabel Postgres dibuat otomatis.
7. Login ke `/admin/login` untuk cek akses admin.

## Local Development

```bash
pnpm install
pnpm dev
```

App akan membuat tabel Postgres otomatis saat request pertama berhasil mencapai database.

## Cron

Endpoint cron tersedia di `GET` atau `POST /api/cron/expire`.

Sertakan header berikut:

```txt
Authorization: Bearer <CRON_SECRET>
```

Di production, jadwalkan endpoint ini minimal sekali sehari.
