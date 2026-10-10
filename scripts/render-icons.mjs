// Erzeugt App-Icons aus der Bildmarke src/client/public/logo-mark.svg (Buch mit Heiligenschein-Smiley):
//   icons/bible-bluff.svg (Favicon), favicon.ico (16/32/48 px), apple-touch-icon.png (180 px),
//   icons/bible-bluff-192.png, icons/bible-bluff-512.png, icons/bible-bluff-maskable-512.png
// Die Namen sind seit dem Logo-Wechsel neu: Messenger und Browser merken sich Symbole unter ihrer
// Adresse und zeigten unter den alten Namen noch das frühere Logo. Die alten Adressen leiten per
// public/_redirects hierher um. favicon.ico und apple-touch-icon.png liegen im Wurzelverzeichnis,
// weil viele Apps dort von sich aus nachsehen.
// Aufruf: node scripts/render-icons.mjs   (braucht den Playwright-Chromium)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PUBLIC = new URL('../src/client/public/', import.meta.url);
const logo = readFileSync(new URL('logo-mark.svg', PUBLIC), 'utf8');
const inner = logo
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .trim();

const BG = '#3d2e26';

/** Bildmarke auf dunklem Grund; rounded = abgerundete Ecken, scale = Größe der Marke */
function icon({ rounded, scale }) {
  const shape = rounded
    ? `<rect width="120" height="120" rx="26" fill="${BG}"/>`
    : `<rect width="120" height="120" fill="${BG}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  ${shape}
  <circle cx="60" cy="56" r="46" fill="#f2d9a0" opacity=".08"/>
  <g transform="translate(60 61) scale(${scale}) translate(-60 -61)">
    ${inner}
  </g>
</svg>
`;
}

/** ICO-Datei aus PNG-Bildern (so verstehen es alle Browser seit Windows Vista) */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // Typ: Icon
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  let offset = header.length + entries.length;
  images.forEach(({ size, png }, i) => {
    const at = i * 16;
    entries.writeUInt8(size, at);
    entries.writeUInt8(size, at + 1);
    entries.writeUInt16LE(1, at + 4); // Farbebenen
    entries.writeUInt16LE(32, at + 6); // Bit pro Pixel
    entries.writeUInt32LE(png.length, at + 8);
    entries.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });
  return Buffer.concat([header, entries, ...images.map((i) => i.png)]);
}

const favicon = icon({ rounded: true, scale: 0.86 });
mkdirSync(new URL('icons/', PUBLIC), { recursive: true });
writeFileSync(new URL('icons/bible-bluff.svg', PUBLIC), favicon);

const variants = [
  { file: 'apple-touch-icon.png', size: 180, svg: icon({ rounded: false, scale: 0.8 }) },
  { file: 'icons/bible-bluff-192.png', size: 192, svg: favicon },
  { file: 'icons/bible-bluff-512.png', size: 512, svg: favicon },
  { file: 'icons/bible-bluff-maskable-512.png', size: 512, svg: icon({ rounded: false, scale: 0.64 }) },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  return page.screenshot({ omitBackground: true });
}
for (const v of variants) {
  writeFileSync(new URL(v.file, PUBLIC), await render(v.svg, v.size));
  console.log('✓', v.file);
}
const small = [];
for (const size of [16, 32, 48]) small.push({ size, png: await render(favicon, size) });
writeFileSync(new URL('favicon.ico', PUBLIC), ico(small));
console.log('✓ favicon.ico');
await browser.close();
