import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { MemoryStore } from '../src/server/store';
import { D1KidsRemoteStore, MemoryKidsRemoteStore, type KidsRemoteStore } from '../src/server/kids-remote-store';
import { KIDS_REMOTE_TTL } from '../src/server/kids-remote-api';
import type { D1Like, D1PreparedLike } from '../src/server/d1-store';
import { createKidsGame, updateKidsGame } from '../src/shared/kids-game';
import { packKidsGame, type KidsRemoteCreated } from '../src/shared/kids-remote';
import { Clock } from './helpers';

class Statement implements D1PreparedLike {
  constructor(private db: DatabaseSync, private sql: string, private values: SQLInputValue[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.db, this.sql, values.map((v) => { if (v === null || typeof v === 'string' || typeof v === 'number') return v; throw Error('Invalid binding'); })); }
  async first<T>() { return this.db.prepare(this.sql).get(...this.values) as T ?? null; }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...this.values) as T[] }; }
  async run() { return { meta: { changes: Number(this.db.prepare(this.sql).run(...this.values).changes) } }; }
}
const reading = () => updateKidsGame(updateKidsGame(createKidsGame(), 'next', 0), 'next', 0);
function setup(store: KidsRemoteStore = new MemoryKidsRemoteStore()) {
  const clock = new Clock();
  let api = createApi({ store: new MemoryStore(), kidsRemoteStore: store, now: () => clock.now });
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await api(new Request(`https://test${path}`, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }));
    return { status: res.status, body: await res.json() as KidsRemoteCreated & { error?: { code: string } } };
  };
  const create = async (game = reading()) => (await call('POST', '/api/kids-remotes', { easy: true, game: packKidsGame(game, clock.now) })).body;
  return { clock, call, create, reboot: (next: KidsRemoteStore = store) => { api = createApi({ store: new MemoryStore(), kidsRemoteStore: next, now: () => clock.now }); } };
}

describe('Kids-Fernbedienung', () => {
  it('behält die laufende Frage und erlaubt nur den beiden Schlüsseln Zugriff', async () => {
    const t = setup();
    let game = updateKidsGame(reading(), 'start', t.clock.now);
    t.clock.advance(12345); game = updateKidsGame(game, 'pause', t.clock.now);
    const made = await t.create(game); const path = `/api/kids-remotes/${made.id}`;
    expect(made.game.phase).toBe('paused');
    expect(made.game.remainingMs).toBe(17655);
    expect(made.game.rounds.map((r) => r.answers)).toEqual(game.rounds.map((r) => r.answers));
    expect((await t.call('GET', path)).status).toBe(401);
    expect((await t.call('GET', path, undefined, 'a'.repeat(48))).status).toBe(403);
    for (const key of [made.ownerToken, made.remoteToken]) {
      const read = await t.call('GET', path, undefined, key);
      expect(read.status).toBe(200);
      expect(read.body.game.index).toBe(game.index);
      expect(read.body.ownerToken).toBeUndefined();
      expect(read.body.remoteToken).toBeUndefined();
    }
  });
  it('synchronisiert Start, Pause, Fortsetzen, Stopp und Aufdecken ohne verfrühte Auflösung', async () => {
    const t = setup(); const made = await t.create(); const path = `/api/kids-remotes/${made.id}`;
    const action = (action: string, version: number, key = made.remoteToken) => t.call('POST', `${path}/action`, { action, version }, key);
    expect((await action('correct', 1)).status).toBe(409);
    expect((await action('start', 1)).body.version).toBe(2);
    t.clock.advance(10000);
    expect((await action('pause', 2, made.ownerToken)).body.game.remainingMs).toBe(20000);
    t.clock.advance(100000);
    expect((await t.call('GET', path, undefined, made.remoteToken)).body.game.phase).toBe('paused');
    expect((await action('resume', 3)).body.version).toBe(4);
    t.clock.advance(19999); expect((await action('correct', 4)).status).toBe(409);
    t.clock.advance(1);
    const stopped = await t.call('GET', path, undefined, made.ownerToken);
    expect(stopped.body.game.phase).toBe('locked'); expect(stopped.body.version).toBe(4);
    expect((await action('return', 4)).body.game.phase).toBe('returning');
    expect((await action('correct', 5)).status).toBe(409);
    expect((await action('ready', 5)).body.game.phase).toBe('judging');
    expect((await action('correct', 6)).body.game.phase).toBe('revealed');
    const next = await action('next', 7);
    expect(next.body.game.index).toBe(1); expect(next.body.game.phase).toBe('reading');
  });
  it('führt Doppelklicks und gleichzeitige Befehle nur einmal aus', async () => {
    const t = setup(); const made = await t.create(); const path = `/api/kids-remotes/${made.id}`;
    const responses = await Promise.all([made.ownerToken, made.remoteToken].map((token) => t.call('POST', `${path}/action`, { action: 'start', version: 1 }, token)));
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const read = await t.call('GET', path, undefined, made.ownerToken);
    expect(read.body.version).toBe(2); expect(read.body.game.index).toBe(0);
  });
  it('lässt nur den Beamer die Verbindung trennen und beendet abgelaufene Sitzungen', async () => {
    const t = setup(); const made = await t.create(); const path = `/api/kids-remotes/${made.id}`;
    expect((await t.call('DELETE', path, undefined, made.remoteToken)).status).toBe(403);
    expect((await t.call('DELETE', path, undefined, made.ownerToken)).status).toBe(200);
    expect((await t.call('GET', path, undefined, made.remoteToken)).status).toBe(410);
    const expired = await t.create(); t.clock.advance(KIDS_REMOTE_TTL);
    expect((await t.call('GET', `/api/kids-remotes/${expired.id}`, undefined, expired.ownerToken)).status).toBe(410);
  });
  it('prüft fremde Fragen, manipulierte Antworten, Duplikate und zu große Eingaben', async () => {
    const t = setup();
    for (const change of [
      (g: ReturnType<typeof packKidsGame>) => { g.rounds[0].id = 'unbekannt'; },
      (g: ReturnType<typeof packKidsGame>) => { g.rounds[0].answers = ['frei', 'erfunden', 'unsicher']; },
      (g: ReturnType<typeof packKidsGame>) => { g.rounds[1] = g.rounds[0]; },
      (g: ReturnType<typeof packKidsGame>) => { g.remainingMs = -1; },
    ]) {
      const game = packKidsGame(reading(), t.clock.now); change(game);
      expect((await t.call('POST', '/api/kids-remotes', { game, easy: true })).status).toBe(400);
    }
    expect((await t.call('POST', '/api/kids-remotes', { long: 'x'.repeat(9000) })).status).toBe(413);
  });
  it('kann nach dem Finale über die Fernbedienung eine neue Show starten', async () => {
    const t = setup();
    const game = { ...reading(), phase: 'finished' as const, index: 9, remainingMs: 0, results: Array(10).fill('correct') };
    const made = await t.create(game);
    const next = await t.call('POST', `/api/kids-remotes/${made.id}/action`, { action: 'restart', version: 1 }, made.remoteToken);
    expect(next.body.game.phase).toBe('welcome'); expect(next.body.game.index).toBe(0);
    expect(next.body.game.rounds).toHaveLength(10);
    expect(next.body.game.results.every(r=>r===null)).toBe(true);
  });
});

describe('Kids-Fernbedienung in D1 / SQLite', () => {
  for (const migrated of [false, true]) it(`überlebt einen Worker-Neustart, Migration ${migrated ? 'vorhanden' : 'automatisch'}`, async () => {
    const db = new DatabaseSync(':memory:');
    if (migrated) db.exec(readFileSync(new URL('../migrations/0006_kids_remotes.sql', import.meta.url), 'utf8'));
    const binding: D1Like = { prepare: (sql) => new Statement(db, sql), async batch() { throw Error('Unexpected batch'); } };
    const store = new D1KidsRemoteStore(binding); const t = setup(store); const made = await t.create();
    const raw = db.prepare('SELECT * FROM kids_remotes WHERE id = ?').get(made.id)!;
    expect(raw.owner_hash).not.toBe(made.ownerToken); expect(raw.remote_hash).not.toBe(made.remoteToken);
    t.reboot(new D1KidsRemoteStore(binding));
    const started = await t.call('POST', `/api/kids-remotes/${made.id}/action`, { action: 'start', version: 1 }, made.remoteToken);
    expect(started.status).toBe(200); expect(started.body.game.phase).toBe('moving');
    expect(await store.update(made.id, 1, made.game, true)).toBe(false);
    t.clock.advance(KIDS_REMOTE_TTL); await store.cleanup(t.clock.now);
    expect(await store.load(made.id)).toBeNull(); db.close();
  });
});
