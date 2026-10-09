// Lokaler Spielserver ohne Cloudflare: liefert die gebaute App aus und hält Räume im Arbeitsspeicher.
// Ideal für einen Spieleabend im eigenen WLAN:  npm run build && npm start
// Alle Handys im selben Netz öffnen dann die angezeigte Adresse.

import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { createApi } from '../src/server/api';
import { sendWebResponse, toWebRequest } from '../src/server/node-adapter';
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
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
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
    let file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(ROOT, 'index.html'); // Single-Page-App
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    res.setHeader('content-type', type);
    res.setHeader('cache-control', file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Bible Bluff läuft auf http://localhost:${PORT}`);
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`  Im WLAN:            http://${net.address}:${PORT}`);
    }
  }
  console.log('');
});
