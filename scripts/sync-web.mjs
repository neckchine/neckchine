// Copie les fichiers de la PWA vers www/ (le "webDir" utilisé par Capacitor).
// La source reste à la racine du dépôt (l'app fonctionne toujours en ouvrant
// index.html directement dans un navigateur). www/ est régénéré à chaque build.
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
const DIRS = ['assets'];

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });

for (const f of FILES) {
  if (existsSync(join(root, f))) await cp(join(root, f), join(www, f));
}
for (const d of DIRS) {
  if (existsSync(join(root, d))) await cp(join(root, d), join(www, d), { recursive: true });
}

console.log('www/ synchronisé depuis la racine.');
