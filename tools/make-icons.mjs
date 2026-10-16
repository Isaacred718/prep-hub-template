#!/usr/bin/env node
/* make-icons.mjs — generate an app's install icons and web app manifest.

   Usage:
     node tools/make-icons.mjs <app-dir> [--name "CTS Prep"] [--short "CTS Prep"]
          [--text CTS] [--accent sky] [--theme "#0f172a"]

   Writes icon-192.png, icon-512.png, apple-touch-icon.png (180) and
   manifest.json into <app-dir>. Real PNG files (not data URLs): browsers
   only offer a true "Install" when the manifest's icons are fetchable
   files of at least 192px and 512px. The artwork matches the runtime
   icon in settings.js — the topic's two-stop gradient with its iconText
   letters in white — rendered with a tiny built-in bitmap font, so no
   dependencies are needed. Used by new-topic.mjs and from-dossier.mjs;
   safe to re-run after a rename or accent change. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const GRADIENTS = {
  sky: ['#0284c7', '#2563eb'], violet: ['#7c3aed', '#6d28d9'], emerald: ['#059669', '#0d9488'],
  amber: ['#d97706', '#ea580c'], rose: ['#e11d48', '#db2777'], indigo: ['#4f46e5', '#4338ca']
};

/* 5x7 bitmap font, rows top→bottom, 5 bits per row (MSB = leftmost pixel). */
const FONT = {
  A: [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11], B: [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
  C: [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E], D: [0x1C, 0x12, 0x11, 0x11, 0x11, 0x12, 0x1C],
  E: [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F], F: [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
  G: [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F], H: [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  I: [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E], J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11], L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
  M: [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11], N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], P: [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
  Q: [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D], R: [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
  S: [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E], T: [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11], X: [0x11, 0x0A, 0x04, 0x04, 0x04, 0x0A, 0x11],
  Y: [0x11, 0x0A, 0x04, 0x04, 0x04, 0x04, 0x04], Z: [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
  '0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E], '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
  '2': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F], '3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
  '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02], '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
  '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E], '7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E], '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
  '-': [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00], '+': [0x00, 0x04, 0x04, 0x1F, 0x04, 0x04, 0x00],
  ' ': [0, 0, 0, 0, 0, 0, 0]
};

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function renderIconPng(size, text, accent) {
  const [c0, c1] = (GRADIENTS[accent] || GRADIENTS.sky).map(hexRgb);
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const t = (x + y) / (2 * (size - 1));
    const i = (y * size + x) * 4;
    px[i] = Math.round(c0[0] + (c1[0] - c0[0]) * t);
    px[i + 1] = Math.round(c0[1] + (c1[1] - c0[1]) * t);
    px[i + 2] = Math.round(c0[2] + (c1[2] - c0[2]) * t);
    px[i + 3] = 255;
  }
  const chars = String(text || '?').toUpperCase().split('').filter(ch => FONT[ch]);
  if (chars.length) {
    const gap = 1; // glyph columns between characters, in glyph units
    const unitsW = chars.length * 5 + (chars.length - 1) * gap;
    const scale = Math.max(1, Math.floor(Math.min(size * 0.78 / unitsW, size * 0.58 / 7)));
    const w = unitsW * scale, h = 7 * scale;
    const x0 = Math.round((size - w) / 2), y0 = Math.round((size - h) / 2);
    chars.forEach((ch, ci) => {
      const glyph = FONT[ch];
      for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
        if (!(glyph[r] & (1 << (4 - col)))) continue;
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
          const x = x0 + (ci * (5 + gap) + col) * scale + dx;
          const y = y0 + r * scale + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const i = (y * size + x) * 4;
          px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = 255;
        }
      }
    });
  }
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

export function writeInstallAssets(dir, opts) {
  const { name, shortName, text, accent, description } = opts;
  fs.writeFileSync(path.join(dir, 'icon-192.png'), renderIconPng(192, text, accent));
  fs.writeFileSync(path.join(dir, 'icon-512.png'), renderIconPng(512, text, accent));
  fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), renderIconPng(180, text, accent));
  const manifest = {
    name: name,
    short_name: shortName || name,
    description: description || 'Offline-first study app: guides, flashcards, quizzes, practice tests, drills and an endless adaptive mode.',
    start_url: '.',
    scope: '.',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/* ---------- CLI ---------- */
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
  const target = path.resolve(args.filter(a => !a.startsWith('--'))[0] || '.');
  writeInstallAssets(target, {
    name: opt('name') || 'Study App',
    shortName: opt('short'),
    text: opt('text') || 'ST',
    accent: opt('accent') || 'sky',
    description: opt('desc')
  });
  console.log('make-icons: wrote icon-192.png, icon-512.png, apple-touch-icon.png, manifest.json to ' + target);
}
