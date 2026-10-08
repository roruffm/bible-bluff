// Cloudflare Worker: API unter /api/*, alles andere liefert die statische App aus.

import { createApi } from './server/api';
import { D1Store, type D1Like } from './server/d1-store';

interface Env {
  DB: D1Like;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const handleApi = createApi({ store: new D1Store(env.DB) });
      return handleApi(request);
    }
    return env.ASSETS.fetch(request);
  },
};
