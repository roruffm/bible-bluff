// Offline-Kopie der Kids-Show, nur für Seiten unter /kids. „Show vorbereiten“ legt die Kopie an
// (src/client/lib/kids-ready.ts). Immer zuerst das Netz: Online kommt stets die aktuelle Fassung.
// Ohne Netz, oder wenn es länger als ein paar Sekunden dauert, springt die Kopie ein.
// Die API (Fernbedienung) läuft nie über die Kopie.
const CACHE = 'bb-kids-show';
const PATIENCE_MS = 4000;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(networkOrCopy(request, url.pathname.replace(/(.)\/+$/, '$1')));
});

async function networkOrCopy(request, path) {
  const network = fetch(request);
  network.catch(() => {});
  const copy = () => caches.match(path, { cacheName: CACHE });
  try {
    const first = await Promise.race([network, new Promise((resolve) => setTimeout(resolve, PATIENCE_MS, null))]);
    if (first) return first;
    return (await copy()) ?? (await network);
  } catch {
    return (await copy()) ?? Response.error();
  }
}
