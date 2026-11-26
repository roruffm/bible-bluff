import { describe, it, expect } from 'vitest';
import { createApi } from '../../src/server/api';
import { MemoryStore } from '../../src/server/store';
import { MemoryGlühweinStore } from '../../src/server/gluehwein-store';
import { GameEngine } from '../../src/client/gluehwein/engine.js';

function setup() {
  let clock = 1_000_000;
  const store = new MemoryGlühweinStore();
  const api = createApi({ store: new MemoryStore(), gluehweinStore: store, now: () => clock });
  const call = async (path, data, headers = {}) => {
    const response = await api(new Request('https://game.test/api/gluehwein/' + path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }));
    return { status: response.status, data: await response.json() };
  };
  return { call, store, advance: ms => clock += ms };
}
function play(seed) {
  const game = new GameEngine({ record: true }); game.start(seed);
  game.beginCharge(0);
  for (let i = 0; i < 40; i++) game.update(.02);
  game.releaseCharge();
  game.pause(); game.resume(); // No simulation time while paused.
  while (game.state === 'playing') game.update(.02);
  expect(game.score).toBeGreaterThan(0);
  return game;
}
async function completed(t, name = 'Anne') {
  const run = (await t.call('runs', {})).data;
  const game = play(run.seed);
  t.advance(65_000);
  return { runId: run.id, token: run.token, name, history: game.history, score: game.score };
}

describe('Gemeinsame Glühwein-Rangliste', () => {
  it('veröffentlicht erst nach Namenseingabe und berechnet Punkte aus der Runde', async () => {
    const t = setup(), round = await completed(t, '  Änne   Frost  ');
    expect((await t.call('highscores')).data.entries).toEqual([]);
    const result = await t.call('highscores', { ...round, score: 999999 });
    expect(result.status).toBe(201);
    expect(result.data.entry).toMatchObject({ name: 'Änne Frost', score: round.score });
    expect(result.data.rank).toBe(1);
    expect(result.data.entries).toHaveLength(1);
    expect(JSON.stringify((await t.call('highscores')).data)).not.toMatch(/token|seed|history/);
  });
  it('trägt eine Runde auch bei parallelem Senden nur einmal ein', async () => {
    const t = setup(), round = await completed(t);
    const results = await Promise.all([t.call('highscores', round), t.call('highscores', round)]);
    expect(results.every(r => r.status < 300)).toBe(true);
    expect((await t.call('highscores', { ...round, name: 'Anderer Name' })).data.entry.name).toBe('Anne');
    expect((await t.call('highscores')).data.entries).toHaveLength(1);
  });
  it('sortiert nach Punkten, Bechern und Zeitpunkt und liefert auch Plätze außerhalb der Top 20', async () => {
    const t = setup();
    for (let i = 0; i < 24; i++) await t.store.save({ id: `id${i.toString().padStart(2, '0')}`, name: 'Gast ' + i, score: i + 10, served: 1, createdAt: 1 });
    const entries = (await t.call('highscores')).data.entries;
    expect(entries).toHaveLength(20);
    expect(entries[0].score).toBe(33);
    expect(await t.store.rank({ id: 'last', name: 'Last', score: 1, served: 1, createdAt: 2 })).toBe(25);
    await t.store.save({ id: 'tiebreak', name: 'Profi', score: 33, served: 2, createdAt: 99 });
    expect((await t.store.top())[0].name).toBe('Profi');
    await t.store.save({ id: 'later', name: 'Später', score: 33, served: 2, createdAt: 100 });
    expect((await t.store.top()).slice(0, 2).map(e => e.name)).toEqual(['Profi', 'Später']);
  });
  it.each(['x', 'x'.repeat(21), '<script>alert(1)</script>', '\u202eabc', '😀😀'])('weist ungültigen Spitznamen %s zurück', async name => {
    const t = setup(), round = await completed(t, name);
    expect((await t.call('highscores', round)).status).toBe(400);
    expect((await t.call('highscores')).data.entries).toHaveLength(0);
  });
  it('weist fremde Herkunft, falsche Tokens und abgelaufene Runden zurück', async () => {
    const t = setup();
    expect((await t.call('runs', {}, { Origin: 'https://other.test' })).status).toBe(403);
    const round = await completed(t);
    expect((await t.call('highscores', { ...round, token: 'wrong' })).status).toBe(403);
    t.advance(86_400_000);
    expect((await t.call('highscores', round)).status).toBe(403);
  });
  it('weist unvollständige, vorgetäuschte und zu große Aufzeichnungen zurück', async () => {
    const t = setup(), round = await completed(t);
    for (const history of [[], [NaN], [.2], [['b', 9]], [['r']], [['x']], round.history.slice(0, 45)]) {
      expect((await t.call('highscores', { ...round, history })).status).toBe(400);
    }
    expect((await t.call('highscores', { ...round, history: Array(20_001).fill(.02) })).status).toBe(400);
    expect((await t.call('highscores', { ...round, extra: 'x'.repeat(524289) })).status).toBe(413);
    const run = (await t.call('runs', {})).data;
    expect((await t.call('highscores', { runId: run.id, token: run.token, name: 'Fast', history: play(run.seed).history })).status).toBe(400);
  });
  it('prüft neue Runden mit Kinderpunsch und akzeptiert weiterhin laufende klassische Runden', async () => {
    const t = setup();
    const run = (await t.call('runs', { rulesVersion: 2 })).data;
    expect(run.id).toMatch(/^p2_/);
    const game = new GameEngine({ orders: true, record: true }); game.start(run.seed);
    game.beginCharge(1); game.update(.08); game.releaseCharge();
    game.beginCharge(1);
    for (let i = 0; i < 45; i++) game.update(.02);
    game.releaseCharge();
    while (game.state === 'playing') game.update(.02);
    expect(game.score).toBeGreaterThan(0);
    t.advance(65_000);
    const result = await t.call('highscores', { runId: run.id, token: run.token, name: 'Punschprofi', history: game.history });
    expect(result.status).toBe(201);
    expect(result.data.entry.score).toBe(game.score);
    expect((await t.call('highscores', await completed(t, 'Klassiker'))).status).toBe(201);
  });
  it('weist unbekannte Spielversionen zurück', async () => {
    const t = setup();
    expect((await t.call('runs', { rulesVersion: 99 })).status).toBe(400);
  });
  it('kann dieselbe Aufzeichnung mit variablem dt und Ladungsabbruch exakt wiederholen', () => {
    const original = new GameEngine({ record: true }); original.start(42);
    original.beginCharge(2); original.update(.013); original.cancelCharge();
    original.beginCharge(0);
    for (let i = 0; i < 50; i++) original.update(.016);
    original.releaseCharge();
    while (original.state === 'playing') original.update(.0137);
    const replay = new GameEngine(); replay.start(42);
    for (const step of original.history) {
      if (typeof step === 'number') replay.update(step);
      else if (step[0] === 'b') replay.beginCharge(step[1]);
      else if (step[0] === 'r') replay.releaseCharge();
      else replay.cancelCharge();
    }
    expect(replay.score).toBe(original.score);
    expect(replay.served).toBe(original.served);
    expect(replay.state).toBe('finished');
  });
});

describe('D1-Speicherung mit echter SQLite-Datenbank', () => {
  it('wendet Migration wiederholbar an und speichert nur einen dauerhaften Eintrag je Runde', async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const { readFileSync } = await import('node:fs');
    const { D1GlühweinStore } = await import('../../src/server/gluehwein-store');
    const db = new DatabaseSync(':memory:');
    const migration = readFileSync(new URL('../../migrations/0007_gluehwein_highscores.sql', import.meta.url), 'utf8');
    db.exec(migration); db.exec(migration);
    const store = new D1GlühweinStore({
      prepare(sql) {
        const query = db.prepare(sql); let params = [];
        return {
          bind(...values) { params = values; return this; },
          async run() { return { meta: { changes: Number(query.run(...params).changes) } }; },
          async first() { return query.get(...params) ?? null; },
          async all() { return { results: query.all(...params) }; },
        };
      },
    });
    try {
      await store.createRun({ id: 'abc', tokenHash: 'hash', seed: 42, createdAt: 100, expiresAt: 200 });
      expect(await store.run('abc')).toMatchObject({ tokenHash: 'hash', seed: 42 });
      const entry = { id: 'abc', name: 'Anne', score: 99, served: 3, createdAt: 150 };
      await store.save(entry); await store.save({ ...entry, name: 'Duplicate', score: 1000 });
      expect(await store.entry('abc')).toMatchObject(entry);
      await store.save({ ...entry, id: 'def', name: 'Profi', served: 4, createdAt: 151 });
      await store.save({ ...entry, id: 'ghi', name: 'Früher', served: 4, createdAt: 149 });
      expect((await store.top()).map(e => e.name)).toEqual(['Früher', 'Profi', 'Anne']);
      expect(await store.rank(entry)).toBe(3);
      await store.cleanup(201);
      expect(await store.run('abc')).toBeNull();
      expect(await store.entry('abc')).toMatchObject(entry);
    } finally { db.close(); }
  });
});
