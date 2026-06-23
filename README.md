# Local PDF Toolkit

Alat PDF yang berjalan **100% di browser**. Tidak ada upload, tidak ada akun,
tidak ada layanan pihak ketiga seperti iLovePDF. File kamu tidak pernah keluar
dari perangkatmu.

Fitur pertama yang sudah jalan: **buka / hapus password PDF**.

## Kenapa lokal?

Semua pemrosesan PDF dilakukan di dalam browser memakai
[mupdf](https://mupdf.readthedocs.io/) yang dikompilasi ke WebAssembly. PDF
hanya dibaca ke memori tab, diproses, lalu hasilnya diunduh — tidak ada byte
yang dikirim ke server mana pun. Engine wasm pun di-host sendiri dari `/wasm`,
bukan dari CDN luar.

## Fitur

- **Buka Password PDF** — hapus password (user/owner) dan batasan
  (print/copy/edit) dari PDF milikmu, asal kamu tahu passwordnya.
- **Banyak file sekaligus** — drop beberapa PDF, satu password dipakai untuk
  semua file terkunci (atau password per-file kalau berbeda), lalu unduh hasil
  satu per satu atau sekalian sebagai **ZIP**.
- **Tetap responsif** — semua pemrosesan dijalankan di **Web Worker**, jadi UI
  tidak nge-freeze meski file besar atau banyak.
- **Bisa offline / install di HP** — aplikasi ini PWA: setelah dibuka sekali
  saat online, bisa dipasang ke home screen dan dipakai **tanpa internet sama
  sekali**.
- Segera: Kompres, Gabung, Pisah/Ambil halaman, Gambar↔PDF.

## Cara pakai

1. Buka aplikasi.
2. Tarik satu atau beberapa PDF ke kotak unggah (file tetap di perangkatmu).
3. Kalau ada yang terkunci, isi password (satu kolom untuk semua, atau
   per-file pada baris yang gagal).
4. Klik **Buka semua** — tiap file langsung bisa diunduh, atau pakai
   **Unduh semua (ZIP)**.

## Pasang di HP (offline)

1. Jalankan versi produksi (`pnpm build && pnpm start`) atau deploy ke hosting
   apa pun, lalu buka URL-nya di browser HP **sekali saat ada internet**.
2. Menu browser → **Add to Home screen / Install app**.
3. Setelah itu aplikasi jalan penuh tanpa koneksi — engine PDF dan UI sudah
   tersimpan di perangkat oleh service worker.

> Catatan: service worker hanya aktif di mode produksi (bukan `pnpm dev`) dan
> butuh konteks aman (HTTPS, atau `localhost` saat pengembangan).

## Stack

- Next.js 16 App Router + React 19
- mupdf (WASM) untuk semua operasi PDF — dijalankan di sisi klien
- Tailwind CSS v4

## Local Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` dan `pnpm build` otomatis menyalin engine mupdf ke `public/wasm`
lewat `scripts/copy-mupdf-wasm.mjs` (lihat `predev`/`prebuild`). Folder
`public/wasm` di-`.gitignore` karena di-generate dari `node_modules`.

```bash
pnpm build   # build produksi
pnpm start   # jalankan hasil build
pnpm check   # lint + typecheck
```

## Arsitektur singkat

- `components/pdf-unlock.tsx` — UI klien (multi-file drag & drop, password,
  unduh per-file / ZIP).
- `lib/pdf/pdf-worker-client.ts` — sisi main thread; mengelola satu Web Worker
  dan mencocokkan respons per-request.
- `lib/pdf/unlock.worker.ts` — Web Worker yang menjalankan mupdf.
- `lib/pdf/unlock.ts` — logika decrypt: inspeksi proteksi, autentikasi
  password, lalu `saveToBuffer("decrypt,…")`.
- `lib/pdf/mupdf-loader.ts` — memuat mupdf dari `/wasm` saat dibutuhkan.
- `lib/pdf/zip.ts` — bundel hasil jadi ZIP (fflate, in-memory).
- `app/manifest.ts` + `public/sw.js` + `components/service-worker.tsx` — PWA &
  offline.
- `scripts/copy-mupdf-wasm.mjs` — menyalin engine mupdf ke `public/wasm`.
- `scripts/generate-icons.mjs` — membuat ikon PWA (`pnpm icons`).

## Catatan lisensi

mupdf berlisensi **AGPL-3.0**. Untuk pemakaian pribadi/lokal ini tidak masalah.
Jika nanti ingin mendistribusikan sebagai produk tertutup, perhatikan kewajiban
lisensi AGPL atau pertimbangkan lisensi komersial dari Artifex.
