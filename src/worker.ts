// Cloudflare Worker: API unter /api/*, alles andere liefert die statische App aus.

import { createApi } from './server/api';
import { D1Store, type D1Like } from './server/d1-store';

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
    return env.ASSETS.fetch(request);
  },
};
