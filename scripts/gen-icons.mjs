// Génère les icônes d'app (Android + iOS) à partir de assets/icon-512.png.
// Nécessite sharp (devDependency). Lancer : node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'assets', 'icon-512.png');
const BRAND = { r: 0x7b, g: 0x1e, b: 0x2b }; // #7b1e2b

const brandBg = { create: { width: 1, height: 1, channels: 4, background: { ...BRAND, alpha: 1 } } };

async function write(path, buf) {
  await mkdir(dirname(path), { recursive: true });
  await sharp(buf).png().toFile(path);
}

// Icône pleine (logo sur fond bordeaux), carrée, taille donnée.
async function fullIcon(size) {
  const logo = await sharp(SRC).resize(Math.round(size * 0.82), Math.round(size * 0.82), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { ...BRAND, alpha: 1 } } })
    .composite([{ input: logo, gravity: 'center' }]).png().toBuffer();
}

// Icône ronde (masque circulaire).
async function roundIcon(size) {
  const base = await fullIcon(size);
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
  return sharp(base).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

// Foreground adaptatif : logo centré ~62% sur fond transparent (zone de sécurité).
async function foreground(size) {
  const logo = await sharp(SRC).resize(Math.round(size * 0.6), Math.round(size * 0.6), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, gravity: 'center' }]).png().toBuffer();
}

// ---- iOS : une seule icône 1024x1024 opaque ----
const iosDir = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
await write(join(iosDir, 'AppIcon-512@2x.png'), await fullIcon(1024));
console.log('iOS : AppIcon-512@2x.png (1024)');

// ---- Android ----
const andRes = join(root, 'android', 'app', 'src', 'main', 'res');
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

for (const [dpi, size] of Object.entries(LAUNCHER)) {
  await write(join(andRes, `mipmap-${dpi}`, 'ic_launcher.png'), await fullIcon(size));
  await write(join(andRes, `mipmap-${dpi}`, 'ic_launcher_round.png'), await roundIcon(size));
}
for (const [dpi, size] of Object.entries(FOREGROUND)) {
  await write(join(andRes, `mipmap-${dpi}`, 'ic_launcher_foreground.png'), await foreground(size));
}
// Play Store : icône haute résolution 512x512
await write(join(root, 'assets', 'playstore-icon.png'), await fullIcon(512));
console.log('Android : mipmaps (legacy + round + foreground) + playstore-icon.png');
console.log('OK');
