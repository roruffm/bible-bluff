import type { D1Like } from './d1-store';

export interface GlühweinRun { id: string; tokenHash: string; seed: number; createdAt: number; expiresAt: number }
export interface GlühweinScore { id: string; name: string; score: number; served: number; createdAt: number }
export interface GlühweinStore {
  createRun(run: GlühweinRun): Promise<void>;
  run(id: string): Promise<GlühweinRun | null>;
  save(entry: GlühweinScore): Promise<void>;
  entry(id: string): Promise<GlühweinScore | null>;
  top(): Promise<GlühweinScore[]>;
  rank(entry: GlühweinScore): Promise<number>;
  cleanup(now: number): Promise<void>;
}
const compare = (a: GlühweinScore, b: GlühweinScore) => b.score - a.score || b.served - a.served || a.createdAt - b.createdAt || a.id.localeCompare(b.id);
export class MemoryGlühweinStore implements GlühweinStore {
  private runs = new Map<string, GlühweinRun>();
  private scores = new Map<string, GlühweinScore>();
  async createRun(run: GlühweinRun) { this.runs.set(run.id, { ...run }); }
  async run(id: string) { return this.runs.get(id) ?? null; }
  async save(entry: GlühweinScore) { if (!this.scores.has(entry.id)) this.scores.set(entry.id, { ...entry }); }
  async entry(id: string) { return this.scores.get(id) ?? null; }
  async top() { return [...this.scores.values()].sort(compare).slice(0, 20); }
  async rank(entry: GlühweinScore) { return 1 + [...this.scores.values()].filter(other => compare(other, entry) < 0).length; }
  async cleanup(now: number) { for (const [id, run] of this.runs) if (run.expiresAt <= now) this.runs.delete(id); }
}
export class D1GlühweinStore implements GlühweinStore {
  constructor(private db: D1Like) {}
  async createRun(run: GlühweinRun) {
    await this.db.prepare('INSERT INTO gluehwein_runs (id, token_hash, seed, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind(run.id, run.tokenHash, run.seed, run.createdAt, run.expiresAt).run();
  }
  async run(id: string): Promise<GlühweinRun | null> {
    const row = await this.db.prepare('SELECT token_hash AS tokenHash, seed, created_at AS createdAt, expires_at AS expiresAt, id FROM gluehwein_runs WHERE id = ?').bind(id).first<GlühweinRun>();
    return row;
  }
  async save(e: GlühweinScore) {
    await this.db.prepare('INSERT OR IGNORE INTO gluehwein_scores (id, name, score, served, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(e.id, e.name, e.score, e.served, e.createdAt).run();
  }
  async entry(id: string) {
    return this.db.prepare('SELECT id, name, score, served, created_at AS createdAt FROM gluehwein_scores WHERE id = ?').bind(id).first<GlühweinScore>();
  }
  async top() {
    return (await this.db.prepare('SELECT id, name, score, served, created_at AS createdAt FROM gluehwein_scores ORDER BY score DESC, served DESC, created_at ASC, id ASC LIMIT 20').all<GlühweinScore>()).results;
  }
  async rank(e: GlühweinScore) {
    const row = await this.db.prepare('SELECT COUNT(*) AS ahead FROM gluehwein_scores WHERE score > ? OR (score = ? AND served > ?) OR (score = ? AND served = ? AND created_at < ?) OR (score = ? AND served = ? AND created_at = ? AND id < ?)')
      .bind(e.score, e.score, e.served, e.score, e.served, e.createdAt, e.score, e.served, e.createdAt, e.id).first<{ ahead: number }>();
    return 1 + Number(row?.ahead ?? 0);
  }
  async cleanup(now: number) { await this.db.prepare('DELETE FROM gluehwein_runs WHERE expires_at <= ?').bind(now).run(); }
}
