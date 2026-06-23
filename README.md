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
- Segera: Kompres, Gabung, Pisah/Ambil halaman, Gambar↔PDF.

## Cara pakai

1. Buka aplikasi.
2. Tarik PDF ke kotak unggah (file tetap di perangkatmu).
3. Kalau diminta, masukkan password PDF.
4. Klik **Buka & hapus password** — hasilnya langsung terunduh tanpa enkripsi.

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

- `components/pdf-unlock.tsx` — UI klien (drag & drop, password, unduh).
- `lib/pdf/unlock.ts` — logika decrypt: inspeksi proteksi, autentikasi
  password, lalu `saveToBuffer("decrypt,…")`.
- `lib/pdf/mupdf-loader.ts` — memuat mupdf dari `/wasm` saat dibutuhkan.
- `scripts/copy-mupdf-wasm.mjs` — menyalin `mupdf.js`, `mupdf-wasm.js`, dan
  `mupdf-wasm.wasm` ke `public/wasm`.

## Catatan lisensi

mupdf berlisensi **AGPL-3.0**. Untuk pemakaian pribadi/lokal ini tidak masalah.
Jika nanti ingin mendistribusikan sebagai produk tertutup, perhatikan kewajiban
lisensi AGPL atau pertimbangkan lisensi komersial dari Artifex.
