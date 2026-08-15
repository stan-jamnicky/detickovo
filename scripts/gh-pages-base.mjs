// Rewrites root-absolute internal URLs in dist/ for GitHub Pages project-site hosting.
// Used only by the showcase workflow; the Forpsi production build stays untouched.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BASE = '/detickovo';
const DIST = 'dist';
const INTERNAL = 'objednavka|akcie|narodeniny|svadby|velke-akcie|maskoti|uploads|admin|ochrana-sukromia';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let changed = 0;
for await (const file of walk(DIST)) {
  const ext = extname(file);
  if (!['.html', '.css', '.js'].includes(ext)) continue;
  const original = await readFile(file, 'utf8');
  let content = original;

  if (ext === '.html') {
    content = content.replaceAll(/(href|src|content|data-cta-base)="\/(?!\/)/g, `$1="${BASE}/`);
    // Showcase build must not be indexed alongside the future production site
    content = content.replace('</head>', '<meta name="robots" content="noindex"></head>');
  }
  if (ext === '.html' || ext === '.css') {
    content = content.replaceAll(/url\(\/(?!\/)/g, `url(${BASE}/`);
  }
  if (ext === '.js' || ext === '.html') {
    content = content.replaceAll(new RegExp(`(["'\`])/(${INTERNAL})`, 'g'), `$1${BASE}/$2`);
  }

  if (content !== original) {
    await writeFile(file, content);
    changed++;
  }
}
console.log(`gh-pages-base: rewrote ${changed} files with base ${BASE}`);
