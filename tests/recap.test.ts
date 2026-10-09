import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { D1Store, type D1Like, type D1PreparedLike } from '../src/server/d1-store';
import { isRecapId, randomRecapId } from '../src/server/recap';
import { MemoryStore } from '../src/server/store';
import type { RecapView, RoomView, SessionResponse } from '../src/shared/types';
import { Clock, seeded } from './helpers';

function setup() {
  const clock = new Clock();
  const store = new MemoryStore();
  const api = createApi({ store, now: () => clock.now, rng: seeded(5) });
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await api(
      new Request(`http://test${path}`, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return { status: res.status, headers: res.headers, body: (await res.json()) as any };
  };
  return { clock, store, call };
}

const BLUFFS = ['Zwölf Fässer mit Wein', 'Eine Posaune aus Messing', 'Ein Korb voller Feigen'];

/** Spielt eine Partie mit vier Fragen über die API durch; in Runde 1 bekommt Rahels Bluff ein Herz. */
async function playGame(t: ReturnType<typeof setup>) {
  const created = (await t.call('POST', '/api/rooms', { name: 'Rahel', settings: { rounds: 4 } })).body as SessionResponse;
  const code = created.code;
  const players = [created];
  for (const name of ['Jonas', 'Mirjam']) players.push((await t.call('POST', `/api/rooms/${code}/join`, { name })).body);
  const view = async (p: SessionResponse) => (await t.call('GET', `/api/rooms/${code}`, undefined, p.token)).body.view as RoomView;
  const act = (p: SessionResponse, action: unknown) => t.call('POST', `/api/rooms/${code}/action`, action, p.token);

  expect((await t.call('POST', `/api/rooms/${code}/recap`)).body.error.code).toBe('not_finished');
  await act(created, { type: 'start' });
  for (let r = 0; r < 4; r++) {
    for (const [i, p] of players.entries()) {
      const res = await act(p, { type: 'bluff', text: `${BLUFFS[i]} ${r}` });
      expect(res.status, `Runde ${r}: ${JSON.stringify(res.body.error)}`).toBe(200);
    }
    for (const p of players) {
      const option = (await view(p)).round!.options!.find((o) => !o.mine)!;
      await act(p, { type: 'vote', optionId: option.id });
    }
    const reveal = await view(created);
    t.clock.advance(reveal.round!.deadline! - reveal.serverNow + 1);
    // Alle Geräte melden sich wieder, sonst zählen sie in der nächsten Runde als offline
    for (const p of players) await view(p);
    const scores = await view(players[1]);
    expect(scores.round!.phase).toBe('scores');
    if (r === 0) {
      const rahels = scores.round!.favorites!.find((f) => f.text.startsWith(BLUFFS[0]))!;
      expect((await act(players[1], { type: 'like', optionId: rahels.optionId })).status).toBe(200);
    }
    await act(created, { type: 'next' });
  }
  return { code, players, view, act };
}

describe('Entdeckungen zum Mitnehmen', () => {
  it('legt pro Partie genau eine Seite an, auch wenn mehrere Geräte gleichzeitig fragen', async () => {
    const t = setup();
    const { code, players, view } = await playGame(t);
    expect((await view(players[0])).status).toBe('finished');
    expect((await view(players[0])).final!.recapId).toBeNull();

    const answers = await Promise.all([1, 2, 3, 4].map(() => t.call('POST', `/api/rooms/${code}/recap`)));
    const ids = new Set(answers.map((a) => a.body.id));
    expect(ids.size).toBe(1);
    const [id] = ids;
    expect(isRecapId(id)).toBe(true);
    expect((await view(players[2])).final!.recapId).toBe(id);

    const res = await t.call('GET', `/api/recaps/${id}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('immutable');
    const recap = res.body.recap as RecapView;
    expect(recap).toMatchObject({ id, players: 3 });
    expect(recap.items).toHaveLength(4);
    expect(recap.items[0].ref).toBeTruthy();
    expect(recap.items[0].discovery).toBeTruthy();
    expect(recap.items[0].favorites).toEqual([`${BLUFFS[0]} 0`]);
    expect(recap.items[1].favorites).toEqual([]);
    // Keine Namen und keine Raumdaten auf der öffentlichen Seite
    const json = JSON.stringify(recap);
    for (const name of ['Rahel', 'Jonas', 'Mirjam', code]) expect(json).not.toContain(name);
  });

  it('bleibt erhalten, wenn danach eine neue Partie beginnt', async () => {
    const t = setup();
    const { code, players, act } = await playGame(t);
    const { id } = (await t.call('POST', `/api/rooms/${code}/recap`)).body;
    await act(players[0], { type: 'playAgain' });
    expect((await t.call('POST', `/api/rooms/${code}/recap`)).status).toBe(409);
    expect((await t.call('GET', `/api/recaps/${id}`)).body.recap.items).toHaveLength(4);
  });

  it('meldet unbekannte und ungültige Links mit 404', async () => {
    const t = setup();
    expect((await t.call('GET', `/api/recaps/${randomRecapId()}`)).status).toBe(404);
    expect((await t.call('GET', '/api/recaps/..%2Fetc')).status).toBe(404);
    expect((await t.call('POST', '/api/rooms/NIRGENDS9/recap')).status).toBe(404);
  });

  it('erzeugt gut lesbare, zufällige IDs', () => {
    const ids = new Set(Array.from({ length: 200 }, randomRecapId));
    expect(ids.size).toBe(200);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z2-9]{10}$/);
      expect(id).not.toMatch(/[01ilo]/);
    }
    expect(isRecapId('abc')).toBe(false);
    expect(isRecapId('ABCDEFGHJK')).toBe(false);
  });
});

describe('D1Store: Entdeckungen', () => {
  /** Winzige D1-Attrappe: kennt die Tabelle recaps erst nach CREATE TABLE */
  function fakeD1() {
    const rows = new Map<string, string>();
    let created = false;
    const statements: string[] = [];
    const db: D1Like = {
      prepare(sql: string) {
        let args: unknown[] = [];
        const stmt: D1PreparedLike = {
          bind(...values) {
            args = values;
            return stmt;
          },
          async run() {
            statements.push(sql);
            if (sql.startsWith('CREATE TABLE')) created = true;
            else if (!created) throw new Error('D1_ERROR: no such table: recaps: SQLITE_ERROR');
            else if (!rows.has(String(args[0]))) rows.set(String(args[0]), String(args[1]));
            return { meta: { changes: 1 } };
          },
          async first<T>() {
            if (!created) throw new Error('D1_ERROR: no such table: recaps: SQLITE_ERROR');
            const data = rows.get(String(args[0]));
            return (data ? { data } : null) as T | null;
          },
          async all<T>() {
            return { results: [] as T[] };
          },
        };
        return stmt;
      },
      async batch() {
        return [];
      },
    };
    return { db, statements };
  }

  it('legt die Tabelle selbst an, falls die Migration noch fehlt', async () => {
    const { db, statements } = fakeD1();
    const store = new D1Store(db);
    expect(await store.loadRecap('abcdefghjk')).toBeNull();
    const recap: RecapView = { id: 'abcdefghjk', playedAt: 1, players: 2, items: [] };
    await store.saveRecap(recap, 1);
    expect(statements.filter((s) => s.startsWith('CREATE TABLE'))).toHaveLength(1);
    expect(await store.loadRecap('abcdefghjk')).toEqual(recap);
    // Zweites Speichern derselben ID ändert nichts
    await store.saveRecap({ ...recap, players: 9 }, 2);
    expect((await store.loadRecap('abcdefghjk'))!.players).toBe(2);
  });
});
