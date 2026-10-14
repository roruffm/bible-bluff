import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { MemoryStore } from '../src/server/store';
import type { SessionResponse } from '../src/shared/types';
import { Clock, seeded } from './helpers';

const KEY = 'nicknames-test-admin-key';

function setup(adminKey: string | undefined = KEY) {
  const clock = new Clock();
  const store = new MemoryStore();
  const api = createApi({ store, adminKey, now: () => clock.now, rng: seeded(53) });
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const response = await api(new Request(`http://test${path}`, {
      method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }));
    return { response, body: await response.json() };
  };
  const list = async (query = '') => (await call('GET', `/api/admin/nicknames${query}`, undefined, KEY)).body;
  const startSolo = async (name: string) => {
    const host = (await call('POST', '/api/rooms', { name, bot: true, settings: { lang: 'en' } })).body as SessionResponse;
    const started = await call('POST', `/api/rooms/${host.code}/action`, { type: 'start' }, host.token);
    expect(started.response.status).toBe(200);
    return host;
  };
  return { store, clock, call, list, startSolo };
}

describe('Gespielte Nicknamen', () => {
  it('schützt Lesen und Entfernen mit ADMIN_KEY und verhindert Caching', async () => {
    const t = setup();
    for (const method of ['GET', 'POST']) {
      for (const token of [undefined, 'falsch']) {
        const res = await t.call(method, '/api/admin/nicknames', method === 'POST' ? { action: 'delete', key: 'lena' } : undefined, token);
        expect(res.response.status).toBe(401);
        expect(res.response.headers.get('cache-control')).toBe('no-store');
      }
    }
    const off = createApi({ store: t.store });
    expect((await off(new Request('http://test/api/admin/nicknames'))).status).toBe(404);
    const ok = await t.call('GET', '/api/admin/nicknames', undefined, KEY);
    expect(ok.response.status).toBe(200);
    expect(ok.body).toEqual({ items: [], total: 0, nextOffset: null });
    expect(ok.response.headers.get('cache-control')).toBe('no-store');
  });

  it('erfasst erst ab Spielstart und lässt reine Spielleitungen und Lobbygäste aus', async () => {
    const t = setup();
    const host = (await t.call('POST', '/api/rooms', { name: 'Leitung', plays: false })).body as SessionResponse;
    const join = (name: string) => t.call('POST', `/api/rooms/${host.code}/join`, { name });
    await join('Lena');
    await join('Jona');
    const guest = (await join('Nur Lobby')).body as SessionResponse;
    await t.call('POST', `/api/rooms/${host.code}/action`, { type: 'leave' }, guest.token);
    expect((await t.list()).total).toBe(0);
    await t.call('POST', `/api/rooms/${host.code}/action`, { type: 'start' }, host.token);
    expect((await t.list()).items.map((i: { name: string }) => i.name)).toEqual(['Jona', 'Lena']);
  });

  it('erfasst menschliche Namen auch im englischen Botspiel; Polling und Wiederverbinden ändern den Zeitstempel nicht', async () => {
    const t = setup();
    const host = await t.startSolo('Lena');
    const first = await t.list();
    expect(first.items).toEqual([{ key: 'lena', name: 'Lena', firstPlayedAt: t.clock.now, lastPlayedAt: t.clock.now }]);
    t.clock.advance(60_000);
    await t.call('POST', `/api/rooms/${host.code}/join`, { name: 'Lena', reclaim: true });
    await t.call('GET', `/api/rooms/${host.code}`);
    expect(await t.list()).toEqual(first);
  });

  it('nimmt spätere Beitritte auf und bewahrt Namen nach dem Aufräumen der Räume', async () => {
    const t = setup();
    const host = await t.startSolo('Lena');
    t.clock.advance(1000);
    await t.call('POST', `/api/rooms/${host.code}/join`, { name: 'Änna' });
    const list = await t.list();
    expect(list.items.map((i: { name: string }) => i.name)).toEqual(['Änna', 'Lena']);
    expect(list.items[0].firstPlayedAt).toBe(t.clock.now);
    await t.store.cleanup(t.clock.now + 1);
    expect(await t.store.load(host.code)).toBeNull();
    expect(await t.list()).toEqual(list);
    expect(JSON.stringify(list)).not.toMatch(/token|playerId|roomCode|bluff|score/);
  });

  it('fasst wiederholte Namen zusammen und setzt das letzte Datum erst bei einer neuen Partie', async () => {
    const t = setup();
    await t.startSolo('Lena');
    const first = t.clock.now;
    t.clock.advance(1000);
    await t.startSolo('LENA');
    expect((await t.list()).items).toEqual([{ key: 'lena', name: 'LENA', firstPlayedAt: first, lastPlayedAt: t.clock.now }]);
  });

  it('liefert alle Ergebnisse über Seiten, sucht ohne Groß-/Kleinschreibung und validiert Parameter', async () => {
    const t = setup();
    for (let i = 0; i < 53; i++) { await t.startSolo(`Name ${i}`); t.clock.advance(1); }
    const page1 = await t.list();
    const page2 = await t.list('?offset=50');
    expect(page1.items).toHaveLength(50);
    expect(page1.nextOffset).toBe(50);
    expect(page2.items).toHaveLength(3);
    expect(page2.total).toBe(53);
    expect(page2.nextOffset).toBeNull();
    expect(new Set([...page1.items, ...page2.items].map((i: { key: string }) => i.key)).size).toBe(53);
    expect((await t.list('?q=NAME%205')).total).toBe(4);
    expect((await t.list('?q=%25')).total).toBe(0);
    for (const query of ['?offset=-1', '?offset=1.5', '?offset=bad', `?q=${'a'.repeat(81)}`]) {
      expect((await t.call('GET', `/api/admin/nicknames${query}`, undefined, KEY)).response.status).toBe(400);
    }
  });

  it('entfernt einen Namen und stellt ihn in derselben Partie nicht durch Neuladen wieder her', async () => {
    const t = setup();
    const host = await t.startSolo('Lena');
    await t.call('POST', '/api/admin/nicknames', { action: 'delete', key: 'lena' }, KEY);
    t.clock.advance(5000);
    await t.call('POST', `/api/rooms/${host.code}/action`, { type: 'lock', locked: true }, host.token);
    await t.call('GET', `/api/rooms/${host.code}`, undefined, host.token);
    expect((await t.list()).total).toBe(0);
    await t.startSolo('Lena');
    expect((await t.list()).total).toBe(1);
  });

  it('kann auch Namen entfernen, deren Unicode-Normalform länger als die Eingabe ist', async () => {
    const t = setup();
    await t.startSolo('\uFDFA'.repeat(16));
    const key = (await t.list()).items[0].key;
    expect(key.length).toBeGreaterThan(80);
    expect((await t.call('POST', '/api/admin/nicknames', { action: 'delete', key }, KEY)).response.status).toBe(200);
    expect((await t.list()).total).toBe(0);
  });
});
