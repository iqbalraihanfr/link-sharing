// Generates the PWA app icons (no image libraries — raw pixels + zlib PNG).
// Design: warm accent background, a white "page", and an accent keyhole that
// reads as lock/unlock. Content stays within the central safe zone so the same
// image works as a maskable icon. Run: `node scripts/generate-icons.mjs`.

import { deflateSync } from "node:zlib";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const BG = [159, 64, 37]; // --color-accent-strong
const BG2 = [191, 91, 61]; // --color-accent
const PAGE = [255, 248, 238]; // --color-paper-strong
const MARK = [159, 64, 37];

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function makeIcon(size) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };

  const inRoundRect = (x, y, left, top, w, h, radius) => {
    const right = left + w;
    const bottom = top + h;
    if (x < left || x > right || y < top || y > bottom) return false;
    const cx = Math.min(Math.max(x, left + radius), right - radius);
    const cy = Math.min(Math.max(y, top + radius), bottom - radius);
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Diagonal background gradient.
      set(x, y, mix(BG2, BG, (x + y) / (2 * size)));
    }
  }

  // White page, centered, slightly portrait.
  const pw = size * 0.46;
  const ph = size * 0.56;
  const pl = (size - pw) / 2;
  const pt = (size - ph) / 2;
  const pr = size * 0.06;

  // Keyhole geometry (relative to page).
  const kcx = size / 2;
  const kcy = pt + ph * 0.42;
  const kr = size * 0.07;
  const stemTop = kcy;
  const stemBottom = pt + ph * 0.74;
  const stemTopHalf = size * 0.025;
  const stemBottomHalf = size * 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inRoundRect(x, y, pl, pt, pw, ph, pr)) continue;
      set(x, y, PAGE);

      const inCircle = (x - kcx) ** 2 + (y - kcy) ** 2 <= kr * kr;
      let inStem = false;
      if (y >= stemTop && y <= stemBottom) {
        const t = (y - stemTop) / (stemBottom - stemTop);
        const half = stemTopHalf + (stemBottomHalf - stemTopHalf) * t;
        inStem = Math.abs(x - kcx) <= half;
      }
      if (inCircle || inStem) set(x, y, MARK);
    }
  }

  return encodePng(size, size, px);
}

// --- Minimal PNG encoder (truecolor + alpha) ---

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.subarray(y * width * 4, (y + 1) * width * 4).forEach((v, i) => {
      raw[y * (width * 4 + 1) + 1 + i] = v;
    });
  }
  const idat = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 default 0 (deflate, no filter, no interlace)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-icon.png", 180],
];

for (const [name, size] of targets) {
  await writeFile(join(projectRoot, "public", name), makeIcon(size));
  console.log(`[generate-icons] public/${name} (${size}x${size})`);
}
