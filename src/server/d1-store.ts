// Cloudflare-D1-Anbindung. Nur die Methoden, die wir wirklich brauchen, als schmale Schnittstelle.

import type { RecapView } from '../shared/types';
import type { RoomState } from './state';
import type { RoomRecord, RoomStore } from './store';

export interface D1PreparedLike {
  bind(...values: unknown[]): D1PreparedLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
}

export interface D1Like {
  prepare(sql: string): D1PreparedLike;
  batch<T = unknown>(statements: D1PreparedLike[]): Promise<{ results: T[]; meta?: { changes?: number } }[]>;
}

/** Gleicher Inhalt wie migrations/0002_recaps.sql */
const CREATE_RECAPS = 'CREATE TABLE IF NOT EXISTS recaps (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at INTEGER NOT NULL)';

function isMissingTable(err: unknown): boolean {
  return /no such table/i.test(String((err as Error | null)?.message ?? err));
}

export class D1Store implements RoomStore {
  constructor(private db: D1Like) {}

  async load(code: string): Promise<RoomRecord | null> {
    const [roomRes, presenceRes] = await this.db.batch<Record<string, unknown>>([
      this.db.prepare('SELECT state, version FROM rooms WHERE code = ?').bind(code),
      this.db.prepare('SELECT player_id, last_seen FROM presence WHERE code = ?').bind(code),
    ]);
    const row = roomRes.results[0] as { state: string; version: number } | undefined;
    if (!row) return null;
    const presence: Record<string, number> = {};
    for (const p of presenceRes.results as { player_id: string; last_seen: number }[]) {
      presence[p.player_id] = Number(p.last_seen);
    }
    return { state: JSON.parse(row.state) as RoomState, version: Number(row.version), presence };
  }

  async insert(code: string, state: RoomState, now: number): Promise<boolean> {
    const res = await this.db
      .prepare(
        'INSERT INTO rooms (code, state, version, created_at, updated_at) VALUES (?, ?, 1, ?, ?) ON CONFLICT(code) DO NOTHING',
      )
      .bind(code, JSON.stringify(state), now, now)
      .run();
    return (res.meta.changes ?? 0) === 1;
  }

  async update(code: string, state: RoomState, expectedVersion: number, now: number): Promise<boolean> {
    const res = await this.db
      .prepare('UPDATE rooms SET state = ?, version = version + 1, updated_at = ? WHERE code = ? AND version = ?')
      .bind(JSON.stringify(state), now, code, expectedVersion)
      .run();
    return (res.meta.changes ?? 0) === 1;
  }

  async touch(code: string, playerId: string, now: number): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO presence (code, player_id, last_seen) VALUES (?, ?, ?) ON CONFLICT(code, player_id) DO UPDATE SET last_seen = excluded.last_seen',
      )
      .bind(code, playerId, now)
      .run();
  }

  async cleanup(updatedBefore: number): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM presence WHERE code IN (SELECT code FROM rooms WHERE updated_at < ?)').bind(updatedBefore),
      this.db.prepare('DELETE FROM rooms WHERE updated_at < ?').bind(updatedBefore),
    ]);
  }

  async saveRecap(recap: RecapView, now: number): Promise<void> {
    const insert = () =>
      this.db
        .prepare('INSERT INTO recaps (id, data, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .bind(recap.id, JSON.stringify(recap), now)
        .run();
    try {
      await insert();
    } catch (err) {
      // Migration noch nicht eingespielt (z. B. in der Vorschau-Datenbank) → Tabelle anlegen und nochmal
      if (!isMissingTable(err)) throw err;
      await this.db.prepare(CREATE_RECAPS).run();
      await insert();
    }
  }

  async loadRecap(id: string): Promise<RecapView | null> {
    try {
      const row = await this.db.prepare('SELECT data FROM recaps WHERE id = ?').bind(id).first<{ data: string }>();
      return row ? (JSON.parse(row.data) as RecapView) : null;
    } catch (err) {
      if (isMissingTable(err)) return null;
      throw err;
    }
  }
}
