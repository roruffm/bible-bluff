import type { KidsGame } from '../shared/kids-game';
import type { D1Like } from './d1-store';

export const KIDS_REMOTE_SCHEMA = 'CREATE TABLE IF NOT EXISTS kids_remotes (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL, owner_hash TEXT NOT NULL, remote_hash TEXT NOT NULL, expires_at INTEGER NOT NULL)';
export interface KidsRemoteRecord { id: string; game: KidsGame; easy: boolean; version: number; ownerHash: string; remoteHash: string; expiresAt: number }
export interface KidsRemoteStore {
  insert(rec: KidsRemoteRecord): Promise<boolean>;
  load(id: string): Promise<KidsRemoteRecord | null>;
  update(id: string, version: number, game: KidsGame, easy: boolean): Promise<boolean>;
  delete(id: string): Promise<void>;
  cleanup(now: number): Promise<void>;
}
export class MemoryKidsRemoteStore implements KidsRemoteStore {
  private records = new Map<string, KidsRemoteRecord>();
  async insert(rec: KidsRemoteRecord) { if (this.records.has(rec.id)) return false; this.records.set(rec.id, structuredClone(rec)); return true; }
  async load(id: string) { return structuredClone(this.records.get(id) ?? null); }
  async update(id: string, version: number, game: KidsGame, easy: boolean) {
    const rec = this.records.get(id);
    if (!rec || rec.version !== version) return false;
    this.records.set(id, { ...rec, game: structuredClone(game), easy, version: version + 1 });
    return true;
  }
  async delete(id: string) { this.records.delete(id); }
  async cleanup(now: number) { for (const [id, rec] of this.records) if (rec.expiresAt <= now) this.records.delete(id); }
}

export class D1KidsRemoteStore implements KidsRemoteStore {
  constructor(private db: D1Like) {}
  private async withSchema<T>(fn: () => Promise<T>): Promise<T> {
    try { return await fn(); } catch (error) {
      if (!/no such table/i.test(String((error as Error).message))) throw error;
      await this.db.prepare(KIDS_REMOTE_SCHEMA).run();
      await this.db.prepare('CREATE INDEX IF NOT EXISTS kids_remotes_expiry ON kids_remotes (expires_at)').run();
      return fn();
    }
  }
  async insert(rec: KidsRemoteRecord) {
    const result = await this.withSchema(() => this.db.prepare('INSERT OR IGNORE INTO kids_remotes (id, data, version, owner_hash, remote_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?)').bind(rec.id, JSON.stringify({ game: rec.game, easy: rec.easy }), rec.version, rec.ownerHash, rec.remoteHash, rec.expiresAt).run());
    return result.meta.changes === 1;
  }
  async load(id: string): Promise<KidsRemoteRecord | null> {
    const row = await this.withSchema(() => this.db.prepare('SELECT * FROM kids_remotes WHERE id = ?').bind(id).first<{ id: string; data: string; version: number; owner_hash: string; remote_hash: string; expires_at: number }>());
    if (!row) return null;
    const data = JSON.parse(row.data) as { game: KidsGame; easy: boolean };
    return { id: row.id, ...data, version: row.version, ownerHash: row.owner_hash, remoteHash: row.remote_hash, expiresAt: row.expires_at };
  }
  async update(id: string, version: number, game: KidsGame, easy: boolean) {
    const result = await this.withSchema(() => this.db.prepare('UPDATE kids_remotes SET data = ?, version = version + 1 WHERE id = ? AND version = ?').bind(JSON.stringify({ game, easy }), id, version).run());
    return result.meta.changes === 1;
  }
  async delete(id: string) { await this.withSchema(() => this.db.prepare('DELETE FROM kids_remotes WHERE id = ?').bind(id).run()); }
  async cleanup(now: number) { await this.withSchema(() => this.db.prepare('DELETE FROM kids_remotes WHERE expires_at <= ?').bind(now).run()); }
}
