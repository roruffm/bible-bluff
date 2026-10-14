import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { D1Store, type D1Like, type D1PreparedLike } from '../src/server/d1-store';
import { createRoom } from '../src/server/engine';
import { Clock, ctxFor } from './helpers';

/** Führt die echten D1-Statements gegen SQLite aus, inklusive Transaktions-Rollback. */
class Statement implements D1PreparedLike {
  constructor(private db: DatabaseSync, private sql: string, private values: SQLInputValue[] = []) {}
  bind(...values: unknown[]): Statement {
    const checked = values.map((v) => {
      if (v === null || typeof v === 'string' || typeof v === 'number') return v;
      throw new Error('Unsupported test binding');
    });
    return new Statement(this.db, this.sql, checked);
  }
  async first<T>(): Promise<T | null> { return (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null; }
  async all<T>(): Promise<{ results: T[] }> { return { results: this.db.prepare(this.sql).all(...this.values) as T[] }; }
  async run() { return { meta: { changes: Number(this.db.prepare(this.sql).run(...this.values).changes) } }; }
  execute<T>() {
    const statement = this.db.prepare(this.sql);
    if (statement.columns().length) return { results: statement.all(...this.values) as T[], meta: {} };
    return { results: [] as T[], meta: { changes: Number(statement.run(...this.values).changes) } };
  }
}

function setup(migrated = false) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8'));
  if (migrated) db.exec(readFileSync(new URL('../migrations/0005_played_nicknames.sql', import.meta.url), 'utf8'));
  const binding: D1Like = {
    prepare: (sql) => new Statement(db, sql),
    async batch<T>(statements: D1PreparedLike[]) {
      db.exec('BEGIN');
      try {
        const results = statements.map((statement) => {
          if (!(statement instanceof Statement)) throw new Error('Unexpected statement');
          return statement.execute<T>();
        });
        db.exec('COMMIT');
        return results;
      } catch (err) { db.exec('ROLLBACK'); throw err; }
    },
  };
  const clock = new Clock();
  const state = createRoom({ code: 'TEST7', hostId: 'host', hostName: 'Lena', tokenHash: 'hash', plays: true }, ctxFor(clock, ['host']));
  const store = new D1Store(binding);
  const list = (search = '', offset = 0, limit = 50) => store.listNicknames({ search, offset, limit });
  return { db, store, state, list, clock };
}

describe('Nicknamen in D1 / SQLite', () => {
  for (const migrated of [false, true]) {
    it(`speichert und sucht Unicode-Namen, Migration ${migrated ? 'vorhanden' : 'automatisch'}`, async () => {
      const t = setup(migrated);
      await t.store.insert('TEST7', t.state, t.clock.now);
      expect(await t.store.update('TEST7', t.state, 1, t.clock.now, ['Änna', '100%', 'A_B', 'Lena'])).toBe(true);
      const first = t.clock.now;
      t.clock.advance(1000);
      await t.store.update('TEST7', t.state, 2, t.clock.now, ['ÄNNA']);
      expect((await t.list('än')).items).toEqual([{ key: 'änna', name: 'ÄNNA', firstPlayedAt: first, lastPlayedAt: t.clock.now }]);
      expect((await t.list('%')).total).toBe(1);
      expect((await t.list('_')).total).toBe(1);
      expect((await t.list("' OR 1=1 --")).total).toBe(0);
      expect((await t.list('', 0, 2)).nextOffset).toBe(2);
      expect((await t.list('', 2, 2)).nextOffset).toBeNull();
      await t.store.cleanup(t.clock.now + 1);
      expect((await t.list()).total).toBe(4);
      await t.store.deleteNickname('änna');
      expect((await t.list()).total).toBe(3);
      t.db.close();
    });
  }

  it('schreibt keine Namen bei veralteter Raumversion', async () => {
    const t = setup();
    await t.store.insert('TEST7', t.state, t.clock.now);
    expect(await t.store.update('TEST7', t.state, 8, t.clock.now, ['Falscher Name'])).toBe(false);
    expect((await t.list()).items).toEqual([]);
    expect((await t.store.load('TEST7'))?.version).toBe(1);
    t.db.close();
  });

  it('rollt Nicknamen zurück, wenn der gemeinsame Raum-Schreibvorgang scheitert', async () => {
    const t = setup(true);
    await t.store.insert('TEST7', t.state, t.clock.now);
    t.db.exec("CREATE TRIGGER fail_room BEFORE UPDATE ON rooms BEGIN SELECT RAISE(ABORT, 'test failure'); END");
    await expect(t.store.update('TEST7', t.state, 1, t.clock.now, ['Lena'])).rejects.toThrow('test failure');
    expect((await t.list()).items).toEqual([]);
    expect((await t.store.load('TEST7'))?.version).toBe(1);
    t.db.close();
  });
});
