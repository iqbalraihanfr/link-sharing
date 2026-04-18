# Handshake Archive

Direktori profil komunitas tanpa login untuk merapikan pertukaran nama, Instagram, dan LinkedIn di room chat yang ramai.

## Stack

- Next.js 16 App Router
- React 19
- Postgres via `pg`
- Upstash Redis rate limiting ketika env tersedia, fallback memori untuk lokal
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
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Untuk membuat `ADMIN_PASSWORD_HASH`, pakai SHA-256 hex dari password admin kamu.

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
