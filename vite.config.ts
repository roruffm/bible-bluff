import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { type Plugin, type ViteDevServer, defineConfig } from 'vite';

type Handler = (request: Request) => Promise<Response>;

/**
 * Hängt die Spiel-API (mit In-Memory-Speicher) in den Vite-Dev-Server ein.
 * So reicht `npm run dev` – ganz ohne Cloudflare-Konto.
 */
function apiDevPlugin(): Plugin {
  let ready: Promise<{ handle: Handler; adapter: Record<string, any> }> | null = null;
  const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));

  const load = (server: ViteDevServer) =>
    (ready ??= (async () => {
      const api = await server.ssrLoadModule(file('./src/server/api.ts'));
      const store = await server.ssrLoadModule(file('./src/server/store.ts'));
      const adapter = await server.ssrLoadModule(file('./src/server/node-adapter.ts'));
      return { handle: api.createApi({ store: new store.MemoryStore() }) as Handler, adapter };
    })());

  return {
    name: 'bible-bluff-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        load(server)
          .then(async ({ handle, adapter }) => {
            const request = await adapter.toWebRequest(req, `http://${req.headers.host ?? 'localhost'}`);
            await adapter.sendWebResponse(res, await handle(request));
          })
          .catch((err) => {
            console.error(err);
            res.statusCode = 500;
            res.end();
          });
      });
    },
  };
}

export default defineConfig({
  root: 'src/client',
  publicDir: 'public',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    target: 'es2020',
  },
  plugins: [preact(), apiDevPlugin()],
  server: { host: true, port: 5173 },
});
