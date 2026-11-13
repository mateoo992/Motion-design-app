// Génère les icônes PNG de l'app sans dépendance (encodeur PNG minimal + zlib natif).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(out, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const stops = [
  [0x3d, 0x7b, 0xff],
  [0xff, 0x3d, 0x9a],
  [0xff, 0x8a, 0x3d]
];
const grad = (t) => {
  const s = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(s);
  const f = s - i;
  return stops[i].map((v, k) => v + (stops[i + 1][k] - v) * f);
};

function icon(size, maskable) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  const r = size * (maskable ? 0.26 : 0.32);
  const ring = size * 0.055;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const o = y * (size * 4 + 1) + 1 + x * 4;
      let col = [255, 255, 255];
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cx);
      // dégradé à ~100° sur le disque
      const t = ((x / size) * 0.85 + (y / size) * 0.15);
      // halo doux
      const halo = Math.max(0, 1 - Math.abs(d - r) / (size * 0.16)) * 0.18;
      const g = grad(t);
      col = col.map((c, k) => c + (g[k] - c) * halo);
      // anneau net
      const a = Math.max(0, Math.min(1, ring / 2 - Math.abs(d - r) + 0.5));
      col = col.map((c, k) => c + (g[k] - c) * a);
      // point central
      const dot = Math.max(0, Math.min(1, size * 0.07 - d + 0.5));
      col = col.map((c, k) => c + (13 - c) * dot);
      raw[o] = col[0];
      raw[o + 1] = col[1];
      raw[o + 2] = col[2];
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

writeFileSync(join(out, 'icon-192.png'), icon(192, false));
writeFileSync(join(out, 'icon-512.png'), icon(512, false));
writeFileSync(join(out, 'icon-512-maskable.png'), icon(512, true));
writeFileSync(join(out, 'apple-touch-icon.png'), icon(180, false));
writeFileSync(
  join(out, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" gradientTransform="rotate(10)"><stop offset="0" stop-color="#3d7bff"/><stop offset=".5" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="#fff"/><circle cx="32" cy="32" r="20" fill="none" stroke="url(#g)" stroke-width="4"/><circle cx="32" cy="32" r="4.5" fill="#0d0d14"/></svg>`
);
console.log('Icônes générées dans /public');
