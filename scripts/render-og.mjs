// Erzeugt die Vorschaubilder für geteilte Links (WhatsApp, Signal, Telegram …), je 1200×630:
//   og.jpg         – biblebluff.de und alle übrigen Seiten
//   og-invite.jpg  – Einladungslinks /r/CODE (Titel und Text setzt der Worker, siehe server/preview.ts)
// Das Logo kommt direkt aus der gebauten App im Farbkonzept See Genezareth, so passt es immer zum Spiel.
// Alles Wichtige steht in der Mitte: Manche Apps zeigen nur einen quadratischen Ausschnitt.
// Aufruf: npm run build && node scripts/render-og.mjs   (braucht den Playwright-Chromium)

import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const DIST = new URL('../dist/client/', import.meta.url).pathname;
const PUBLIC = new URL('../src/client/public/', import.meta.url);

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('Keine gebaute App gefunden. Bitte zuerst "npm run build" ausführen.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const VARIANTS = [
  { file: 'og.jpg', pill: null, lines: ['Erfinde Bluffs. Finde die Wahrheit.', 'Entdecke die Bibel.'], url: 'biblebluff.de' },
  { file: 'og-invite.jpg', pill: 'Du bist eingeladen!', lines: ['Antippen und mitspielen –', 'ganz ohne Anmeldung.'], url: null },
];

const STYLE = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  html, body { margin: 0; background: var(--brown); }
  .og {
    position: relative; width: 1200px; height: 630px; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px;
    background: var(--brown); color: var(--cream);
  }
  .og::before, .og::after { content: ''; position: absolute; width: 720px; height: 720px; border-radius: 50%; }
  .og::before { left: 240px; top: -330px; background: radial-gradient(circle, color-mix(in srgb, var(--gold) 15%, transparent), transparent 66%); }
  .og::after { right: -200px; bottom: -360px; background: radial-gradient(circle, color-mix(in srgb, var(--olive) 38%, transparent), transparent 68%); }
  .og > * { position: relative; z-index: 1; }
  .og .logo { width: 600px; }
  .og.has-pill .logo { width: 540px; }
  .og-pill {
    margin: 0; padding: 10px 34px; border-radius: 999px;
    background: var(--gold); color: var(--on-gold); font-size: 42px; font-weight: 800; letter-spacing: -0.01em;
    box-shadow: 0 5px 0 color-mix(in srgb, var(--gold) 45%, #000);
  }
  .og-lines { margin: 0; text-align: center; font-size: 38px; line-height: 1.3; font-weight: 600; opacity: 0.95; }
  .og-url { position: absolute; bottom: 28px; margin: 0; font-size: 26px; font-weight: 800; color: var(--gold); letter-spacing: 0.02em; }
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.route('http://og.local/**', (route) => {
  const path = new URL(route.request().url()).pathname;
  // Ohne Server gibt es keine API – die Startseite kommt für das Logo auch so aus
  if (path.startsWith('/api/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  let file = normalize(join(DIST, decodeURIComponent(path)));
  if (!file.startsWith(DIST) || !existsSync(file) || path.endsWith('/')) file = join(DIST, 'index.html');
  return route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] ?? 'application/octet-stream' });
});
await page.goto('http://og.local/?farbe=see');
await page.waitForSelector('.hero .logo svg');
const logo = await page.evaluate(() => document.querySelector('.hero .logo').outerHTML);

for (const v of VARIANTS) {
  await page.evaluate(
    ({ style, logo, pill, lines, url }) => {
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      document.body.innerHTML = `
        <style>${style}</style>
        <div class="og${pill ? ' has-pill' : ''}">
          ${pill ? `<p class="og-pill">${esc(pill)}</p>` : ''}
          ${logo}
          <p class="og-lines">${lines.map(esc).join('<br>')}</p>
          ${url ? `<p class="og-url">${esc(url)}</p>` : ''}
        </div>`;
    },
    { style: STYLE, logo, ...v },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(v.file, PUBLIC).pathname, type: 'jpeg', quality: 88 });
  console.log('✓', v.file);
}
await browser.close();
