// Lokaler Spielserver ohne Cloudflare: liefert die gebaute App aus und hält Räume im Arbeitsspeicher.
// Ideal für einen Spieleabend im eigenen WLAN:  npm run build && npm start
// Alle Handys im selben Netz öffnen dann die angezeigte Adresse.

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { createApi } from '../src/server/api';
import { sendWebResponse, toWebRequest } from '../src/server/node-adapter';
import { homePreview, inviteCode, invitePreview, linkLang } from '../src/server/preview';
import { MemoryStore } from '../src/server/store';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '0.0.0.0';
const ROOT = resolve(process.env.STATIC_DIR ?? 'dist/client');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`Keine gebaute App in ${ROOT} gefunden. Bitte zuerst "npm run build" ausführen.`);
  process.exit(1);
}

const handleApi = createApi({ store: new MemoryStore(), adminKey: process.env.ADMIN_KEY || undefined });

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const request = await toWebRequest(req, `http://${req.headers.host ?? 'localhost'}`);
      return await sendWebResponse(res, await handleApi(request));
    }
    // Einladungslinks, Startseite und englische Entdeckungen-Seiten bekommen wie bei Cloudflare ihre eigene Link-Vorschau
    const code = inviteCode(url.pathname);
    if (code || url.pathname === '/' || (url.pathname.startsWith('/e/') && linkLang(url) === 'en')) {
      const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
      const origin = `http://${req.headers.host ?? 'localhost'}`;
      res.setHeader('content-type', TYPES['.html']);
      res.setHeader('cache-control', 'no-cache');
      const lang = linkLang(url);
      return res.end(code ? invitePreview(html, code, origin, lang) : homePreview(html, origin, lang));
    }
    let file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(ROOT, 'index.html'); // Single-Page-App
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    res.setHeader('content-type', type);
    res.setHeader('cache-control', file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    // Videoplayer laden und suchen mit Byte-Ranges, auch beim Neustart und Fortsetzen.
    if (extname(file) === '.mp4') {
      const size = statSync(file).size;
      res.setHeader('accept-ranges', 'bytes');
      const range = req.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        const start = match?.[1] ? Number(match[1]) : match?.[2] ? Math.max(0, size - Number(match[2])) : NaN;
        const end = match?.[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
        if (!Number.isSafeInteger(start) || start < 0 || start >= size || !Number.isSafeInteger(end) || end < start) {
          res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end();
        }
        res.writeHead(206, { 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
        if (req.method === 'HEAD') return res.end();
        return createReadStream(file, { start, end }).pipe(res);
      }
      res.setHeader('content-length', size);
      if (req.method === 'HEAD') return res.end();
    }
    createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Bible Bluff läuft auf http://localhost:${PORT}`);
  // Die optionale WLAN-Anzeige darf den Server in eingeschränkten Umgebungen nicht beenden.
  try {
    for (const list of Object.values(networkInterfaces())) {
      for (const net of list ?? []) {
        if (net.family === 'IPv4' && !net.internal) console.log(`  Im WLAN:            http://${net.address}:${PORT}`);
      }
    }
  } catch {
    // localhost funktioniert auch ohne Zugriff auf die Netzwerkschnittstellen.
  }
  console.log('');
});
