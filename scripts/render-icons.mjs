// Erzeugt App-Icons aus der Bildmarke src/client/public/logo-mark.svg (Buch mit Heiligenschein-Smiley):
//   icon.svg (Favicon), icons/apple-touch-icon.png, icons/icon-192.png, icons/icon-512.png,
//   icons/icon-maskable-512.png
// Aufruf: node scripts/render-icons.mjs   (braucht den Playwright-Chromium)

import { readFileSync, writeFileSync } from 'node:fs';
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

const favicon = icon({ rounded: true, scale: 0.86 });
writeFileSync(new URL('icon.svg', PUBLIC), favicon);

const variants = [
  { file: 'icons/apple-touch-icon.png', size: 180, svg: icon({ rounded: false, scale: 0.8 }) },
  { file: 'icons/icon-192.png', size: 192, svg: favicon },
  { file: 'icons/icon-512.png', size: 512, svg: favicon },
  { file: 'icons/icon-maskable-512.png', size: 512, svg: icon({ rounded: false, scale: 0.64 }) },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const v of variants) {
  await page.setViewportSize({ width: v.size, height: v.size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${v.size}px;height:${v.size}px}</style>${v.svg}`,
  );
  await page.screenshot({ path: new URL(v.file, PUBLIC).pathname, omitBackground: true });
  console.log('✓', v.file);
}
await browser.close();
