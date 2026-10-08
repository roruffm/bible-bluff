// Cloudflare-D1-Anbindung. Nur die Methoden, die wir wirklich brauchen, als schmale Schnittstelle.

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
}
