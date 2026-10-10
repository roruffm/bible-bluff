import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { homePreview, inviteCode, invitePreview } from '../src/server/preview';
import worker from '../src/worker';

const index = readFileSync(new URL('../src/client/index.html', import.meta.url), 'utf8');

function meta(html: string, key: string): string | undefined {
  return new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];
}

/** Breite und Höhe aus dem Kopf einer JPEG-Datei (SOF-Marker) */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

describe('Link-Vorschau', () => {
  it('hat auf jeder Seite Titel, Text und ein großes Bild von biblebluff.de', () => {
    expect(meta(index, 'og:title')).toContain('Bible Bluff');
    expect(meta(index, 'og:description')).toContain('Bibelfragen');
    expect(meta(index, 'og:image')).toBe('https://biblebluff.de/og.jpg');
    expect(meta(index, 'og:image:width')).toBe('1200');
    expect(meta(index, 'og:image:height')).toBe('630');
    expect(meta(index, 'twitter:card')).toBe('summary_large_image');
  });

  it('liefert beide Bilder in 1200 × 630 und klein genug für WhatsApp', () => {
    for (const file of ['og.jpg', 'og-invite.jpg']) {
      const buf = readFileSync(new URL(`../src/client/public/${file}`, import.meta.url));
      expect(jpegSize(buf), file).toEqual({ width: 1200, height: 630 });
      expect(buf.length, file).toBeLessThan(300 * 1024);
    }
  });

  it('hält Suchmaschinen von Einladungslinks fern, Vorschau-Dienste nicht', () => {
    const robots = readFileSync(new URL('../src/client/public/robots.txt', import.meta.url), 'utf8');
    const [search, previews] = robots.split(/\n\s*\n(?=#|User-agent)/).filter((g) => g.includes('User-agent'));
    expect(search).toContain('User-agent: *');
    expect(search).toContain('Disallow: /r/');
    for (const bot of ['facebookexternalhit', 'Twitterbot', 'TelegramBot']) expect(previews).toContain(`User-agent: ${bot}`);
    expect(previews).not.toContain('Disallow: /r/');
    expect(previews).toContain('Disallow: /api/');
  });

  it('lässt Cloudflare Einladungslinks zuerst durch den Worker laufen', () => {
    const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
    expect(toml).toMatch(/run_worker_first = \[[^\]]*"\/r\/\*"/);
    expect(toml).toMatch(/run_worker_first = \[[^\]]*"\/"[,\]]/);
  });
});

describe('Einladungslinks', () => {
  it('erkennen den Raumcode', () => {
    expect(inviteCode('/r/lampe7')).toBe('LAMPE7');
    expect(inviteCode('/r/LAMPE7/')).toBe('LAMPE7');
    expect(inviteCode('/r/lam-pe7')).toBe('LAMPE7');
    for (const path of ['/', '/r/', '/r/---', '/r/a/b', '/tv/LAMPE7', '/e/abcdefghjk', '/r/%E0%A4%A']) {
      expect(inviteCode(path), path).toBeNull();
    }
  });

  it('tauschen Titel, Text und Bild der Vorschau aus – und sonst nichts', () => {
    const html = invitePreview(index, 'LAMPE7', 'https://biblebluff.de');
    expect(meta(html, 'og:title')).toBe('Du bist eingeladen – Raum LAMPE7');
    expect(meta(html, 'og:description')).toContain('Antippen und mitspielen');
    expect(meta(html, 'description')).toBe(meta(html, 'og:description'));
    expect(meta(html, 'og:image')).toBe('https://biblebluff.de/og-invite.jpg');
    expect(meta(html, 'og:image:alt')).toContain('eingeladen');
    const swapped = /<meta (property|name)="(og:title|og:description|og:image|og:image:alt|description)" content="[^"]*"/g;
    expect(html.replace(swapped, '')).toBe(index.replace(swapped, ''));
  });

  it('holen das Vorschaubild der Startseite auf Testadressen von dort', () => {
    const html = homePreview(index, 'https://vorschau.example');
    expect(meta(html, 'og:image')).toBe('https://vorschau.example/og.jpg');
    expect(html.replace(/<meta property="og:image" content="[^"]*"/, '')).toBe(index.replace(/<meta property="og:image" content="[^"]*"/, ''));
    expect(homePreview(index, 'https://biblebluff.de')).toBe(index);
    expect(homePreview(index.replace('https://biblebluff.de/og.jpg', 'https://cdn.example/og.jpg'), 'https://x.example')).toContain('https://cdn.example/og.jpg');
  });

  it('maskieren, was sie in die Seite schreiben', () => {
    const html = invitePreview(index, 'X', 'https://a.test/"><script>');
    expect(html).not.toContain('"><script>');
    expect(meta(html, 'og:image')).toBe('https://a.test/&quot;&gt;&lt;script&gt;/og-invite.jpg');
  });
});

describe('Worker', () => {
  function setup(indexStatus = 200) {
    const calls: string[] = [];
    const env = {
      DB: {} as never,
      ASSETS: {
        async fetch(request: Request) {
          const path = new URL(request.url).pathname;
          calls.push(`${request.method} ${path}${request.headers.has('if-none-match') ? ' (bedingt)' : ''}`);
          if (path === '/' && indexStatus !== 200) return new Response('weg', { status: indexStatus });
          return new Response(index, {
            headers: { 'content-type': 'text/html; charset=utf-8', etag: '"abc"', 'content-security-policy': "default-src 'self'" },
          });
        },
      },
    };
    const fetch = (path: string, init?: RequestInit, origin = 'https://biblebluff.de') => worker.fetch(new Request(`${origin}${path}`, init), env);
    return { calls, fetch };
  }

  it('liefert Einladungslinks mit Einladungs-Vorschau, ohne veraltetes ETag', async () => {
    const { calls, fetch } = setup();
    const res = await fetch('/r/lampe7', { headers: { 'if-none-match': '"abc"' } });
    expect(res.status).toBe(200);
    expect(meta(await res.text(), 'og:title')).toBe('Du bist eingeladen – Raum LAMPE7');
    expect(res.headers.get('etag')).toBeNull();
    expect(res.headers.get('cache-control')).toBe('no-cache');
    expect(res.headers.get('content-security-policy')).toBe("default-src 'self'");
    expect(calls).toEqual(['GET /']);
  });

  it('antwortet auf HEAD ohne Inhalt', async () => {
    const res = await setup().fetch('/r/lampe7', { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toBe('');
  });

  it('reicht alles andere unverändert an die statische App weiter', async () => {
    const { calls, fetch } = setup();
    expect(meta(await (await fetch('/')).text(), 'og:title')).toContain('Bible Bluff');
    await fetch('/r/lampe7', { method: 'POST' });
    await fetch('/r/a/b');
    expect(calls).toEqual(['GET /', 'POST /r/lampe7', 'GET /r/a/b']);
  });

  it('gibt der Startseite auf Testadressen ihr eigenes Vorschaubild, auf biblebluff.de bleibt sie unverändert', async () => {
    const { calls, fetch } = setup();
    const preview = await fetch('/', undefined, 'https://claude-test.biblebluff.de');
    expect(meta(await preview.text(), 'og:image')).toBe('https://claude-test.biblebluff.de/og.jpg');
    const home = await fetch('/', { headers: { 'if-none-match': '"abc"' } });
    expect(meta(await home.text(), 'og:image')).toBe('https://biblebluff.de/og.jpg');
    // Auf biblebluff.de geht die Anfrage samt Bedingungen unverändert an die statische App
    expect(calls).toEqual(['GET /', 'GET / (bedingt)']);
  });

  it('fällt auf die normale Seite zurück, wenn die App-Seite fehlt', async () => {
    const { calls, fetch } = setup(404);
    const res = await fetch('/r/lampe7');
    expect(meta(await res.text(), 'og:title')).toContain('Bible Bluff');
    expect(calls).toEqual(['GET /', 'GET /r/lampe7']);
  });
});
