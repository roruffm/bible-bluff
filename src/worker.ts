// Cloudflare Worker: API unter /api/*, Einladungslinks /r/CODE mit eigener Link-Vorschau,
// alles andere liefert die statische App aus.

import { createApi } from './server/api';
import { D1Store, type D1Like } from './server/d1-store';
import { HOME, homePreview, inviteCode, invitePreview } from './server/preview';

interface Env {
  DB: D1Like;
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Schlüssel für die Freigabe-Seite /admin (Secret im Cloudflare-Dashboard) */
  ADMIN_KEY?: string;
}

// Einmal je Worker-Instanz: So wirkt der Zwischenspeicher für freigegebene Bluffs über viele Anfragen.
let handleApi: ((request: Request) => Promise<Response>) | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      handleApi ??= createApi({ store: new D1Store(env.DB), adminKey: env.ADMIN_KEY || undefined });
      return handleApi(request);
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      const code = inviteCode(url.pathname);
      if (code) return appPage(request, env, (html) => invitePreview(html, code, url.origin));
      // Auf Testadressen bekommt auch die Startseite ihr Vorschaubild von dort; auf biblebluff.de bleibt alles statisch
      if (url.pathname === '/' && url.origin !== HOME) return appPage(request, env, (html) => homePreview(html, url.origin));
    }
    return env.ASSETS.fetch(request);
  },
};

/** Dieselbe App-Seite wie unter „/“, mit angepasster Link-Vorschau */
async function appPage(request: Request, env: Env, preview: (html: string) => string): Promise<Response> {
  const url = new URL(request.url);
  // Ohne die Bedingungen der Anfrage (If-None-Match …) holen, sonst kommt evtl. ein leeres 304
  const page = await env.ASSETS.fetch(new Request(new URL('/', url)));
  if (!page.ok) return env.ASSETS.fetch(request);
  const headers = new Headers(page.headers);
  for (const name of ['etag', 'content-length', 'content-encoding']) headers.delete(name);
  headers.set('cache-control', 'no-cache');
  const body = request.method === 'HEAD' ? null : preview(await page.text());
  return new Response(body, { status: 200, headers });
}
