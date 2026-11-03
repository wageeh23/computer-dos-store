// توليد أيقونات PWA (192/512) — PNG خام بـ zlib بدون أي مكتبات
// التصميم: خلفية داكنة + إطار متدرج RGB + مربع مركزي متدرج (مظهر "شريحة")
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const OUT = fileURLToPath(new URL('../client/public/', import.meta.url));

// CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const lerp = (a, b, t) => a + (b - a) * t;
const STOPS = [[34, 211, 238], [124, 58, 237], [244, 114, 182], [34, 211, 238]];
const gradientAt = (t) => { // t in [0,1)
  const seg = Math.min(2, Math.floor(t * 3));
  const tt = t * 3 - seg;
  const [a, b] = [STOPS[seg], STOPS[seg + 1]];
  return [lerp(a[0], b[0], tt), lerp(a[1], b[1], tt), lerp(a[2], b[2], tt)];
};

function makePng(size) {
  const px = Buffer.alloc(size * size * 4);
  const r = size * 0.22;               // نصف قطر زوايا الأيقونة
  const ring = size * 0.055;           // سمك الإطار
  const inner = size * 0.30;           // نصف حجم المربع المركزي
  const cx = size / 2, cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // خلفية خارج الأيقونة المدورة = شفاف
      const inRound = roundedRect(x, y, size, size, r);
      let [R, G, B, A] = [0, 0, 0, 0];
      if (inRound) {
        A = 255; R = 13; G = 13; B = 36; // #0d0d24
        const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
        const angle = (Math.atan2(y - cy, cx - x) / (2 * Math.PI) + 1) % 1;
        if (edge < ring) {
          [R, G, B] = gradientAt(angle); // إطار متدرج حول المحيط
        } else {
          // مربع مركزي متدرج بظل
          const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
          if (dx < inner && dy < inner) {
            const t = (dx + dy) / (2 * inner);
            [R, G, B] = gradientAt(t);
            const dim = 0.75 + 0.25 * (1 - t);
            R *= dim; G *= dim; B *= dim;
          } else if (dx < inner + size * 0.03 && dy < inner + size * 0.03) {
            const [r2, g2, b2] = gradientAt(0.5);
            R = r2 * 0.35; G = g2 * 0.35; B = b2 * 0.35; // توهج حول المركز
          }
        }
      }
      px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = A;
    }
  }

  // scanlines بفلتر 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function roundedRect(x, y, w, h, r) {
  const cx = Math.max(r, Math.min(w - 1 - r, x));
  const cy = Math.max(r, Math.min(h - 1 - r, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

for (const size of [192, 512]) {
  const file = path.join(OUT, `icon-${size}.png`);
  fs.writeFileSync(file, makePng(size));
  console.log('wrote', file);
}
