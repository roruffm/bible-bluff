// Cloudflare-D1-Anbindung. Nur die Methoden, die wir wirklich brauchen, als schmale Schnittstelle.

import type { BluffStatus, NicknameView, NicknamesResponse, RecapView } from '../shared/types';
import { NICKNAMES_SCHEMA, nicknameKey, nicknamePage, type NicknameQuery } from './nicknames';
import type { RoomState } from './state';
import type { BluffCandidateInput, BluffRow, RoomRecord, RoomStore } from './store';

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

/** Gleicher Inhalt wie migrations/0003_bluff_pool.sql */
const CREATE_BLUFF_POOL = [
  "CREATE TABLE IF NOT EXISTS bluff_pool (question_id TEXT NOT NULL, norm TEXT NOT NULL, text TEXT NOT NULL, fooled INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, times INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'new', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (question_id, norm))",
  'CREATE INDEX IF NOT EXISTS bluff_pool_status ON bluff_pool (status, updated_at)',
];

interface BluffDbRow {
  question_id: string;
  norm: string;
  text: string;
  fooled: number;
  likes: number;
  times: number;
  status: BluffStatus;
  created_at: number;
  updated_at: number;
}

/** Gleicher Inhalt wie migrations/0004_listed_rooms.sql: findet öffentliche Räume ohne alle Räume zu lesen */
const CREATE_LISTED_INDEX = "CREATE INDEX IF NOT EXISTS rooms_listed ON rooms (json_extract(state, '$.listed'))";
const LISTED = "json_extract(state, '$.listed') = 1";

function isMissingTable(err: unknown): boolean {
  return /no such table/i.test(String((err as Error | null)?.message ?? err));
}

export class D1Store implements RoomStore {
  /** Index für öffentliche Räume einmal je Worker-Instanz anlegen (falls die Migration fehlt) */
  private listedIndex: Promise<void> | null = null;

  constructor(private db: D1Like) {}

  async listedRooms(limit: number): Promise<RoomRecord[]> {
    this.listedIndex ??= this.db
      .prepare(CREATE_LISTED_INDEX)
      .run()
      .then(
        () => undefined,
        // Ohne Index geht es auch, nur langsamer
        (err: unknown) => console.error('Index für öffentliche Räume nicht angelegt', err),
      );
    await this.listedIndex;
    const [roomRes, presenceRes] = await this.db.batch<Record<string, unknown>>([
      this.db.prepare(`SELECT code, state, version FROM rooms WHERE ${LISTED} ORDER BY updated_at DESC LIMIT ?`).bind(limit),
      this.db.prepare(`SELECT code, player_id, last_seen FROM presence WHERE code IN (SELECT code FROM rooms WHERE ${LISTED})`),
    ]);
    const presence = new Map<string, Record<string, number>>();
    for (const p of presenceRes.results as { code: string; player_id: string; last_seen: number }[]) {
      let map = presence.get(p.code);
      if (!map) presence.set(p.code, (map = {}));
      map[p.player_id] = Number(p.last_seen);
    }
    return (roomRes.results as { code: string; state: string; version: number }[]).map((row) => ({
      state: JSON.parse(row.state) as RoomState,
      version: Number(row.version),
      presence: presence.get(row.code) ?? {},
    }));
  }

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

  async update(code: string, state: RoomState, expectedVersion: number, now: number, playedNames: string[] = []): Promise<boolean> {
    const update = this.db
      .prepare('UPDATE rooms SET state = ?, version = version + 1, updated_at = ? WHERE code = ? AND version = ?')
      .bind(JSON.stringify(state), now, code, expectedVersion);
    if (!playedNames.length) return ((await update.run()).meta.changes ?? 0) === 1;
    // D1 batch ist eine Transaktion. Nur bei passender Raumversion werden Namen UND Raum gespeichert.
    // Ein Konflikt oder Fehler kann deshalb weder falsche Einträge noch verlorene Erfassungen erzeugen.
    const res = await this.withNicknames(() => this.db.batch([
      ...playedNames.map((name) => this.db.prepare(
        'INSERT INTO played_nicknames (nickname_key, name, first_played_at, last_played_at) ' +
        'SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM rooms WHERE code = ? AND version = ?) ' +
        'ON CONFLICT(nickname_key) DO UPDATE SET ' +
        'name = CASE WHEN excluded.last_played_at >= last_played_at THEN excluded.name ELSE name END, ' +
        'first_played_at = MIN(first_played_at, excluded.first_played_at), ' +
        'last_played_at = MAX(last_played_at, excluded.last_played_at)',
      ).bind(nicknameKey(name), name, now, now, code, expectedVersion)),
      update,
    ]));
    return (res[res.length - 1].meta?.changes ?? 0) === 1;
  }

  private async withNicknames<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (!isMissingTable(err)) throw err;
      await this.db.batch(NICKNAMES_SCHEMA.map((sql) => this.db.prepare(sql)));
      return fn();
    }
  }

  async listNicknames(query: NicknameQuery): Promise<NicknamesResponse> {
    const search = nicknameKey(query.search);
    // instr behandelt auch %, _ und Anführungszeichen als gewöhnlichen Suchtext.
    const [count, rows] = await this.withNicknames(() => this.db.batch<Record<string, unknown>>([
      this.db.prepare('SELECT COUNT(*) AS total FROM played_nicknames WHERE instr(nickname_key, ?) > 0').bind(search),
      this.db.prepare(
        'SELECT nickname_key, name, first_played_at, last_played_at FROM played_nicknames ' +
        'WHERE instr(nickname_key, ?) > 0 ORDER BY last_played_at DESC, nickname_key LIMIT ? OFFSET ?',
      ).bind(search, query.limit, query.offset),
    ]));
    const items: NicknameView[] = rows.results.map((row) => ({
      key: String(row.nickname_key), name: String(row.name),
      firstPlayedAt: Number(row.first_played_at), lastPlayedAt: Number(row.last_played_at),
    }));
    return nicknamePage(items, Number(count.results[0]?.total ?? 0), query);
  }

  async deleteNickname(key: string): Promise<void> {
    await this.withNicknames(() => this.db.prepare('DELETE FROM played_nicknames WHERE nickname_key = ?').bind(key).run());
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

  /** Führt `fn` aus; fehlt die Tabelle bluff_pool noch, wird sie angelegt und `fn` wiederholt. */
  private async withBluffPool<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (!isMissingTable(err)) throw err;
      await this.db.batch(CREATE_BLUFF_POOL.map((sql) => this.db.prepare(sql)));
      return fn();
    }
  }

  async addBluffCandidates(items: BluffCandidateInput[], now: number): Promise<void> {
    if (!items.length) return;
    await this.withBluffPool(() =>
      this.db.batch(
        items.map((i) =>
          this.db
            .prepare(
              "INSERT INTO bluff_pool (question_id, norm, text, fooled, likes, times, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, 'new', ?, ?) " +
                'ON CONFLICT(question_id, norm) DO UPDATE SET fooled = fooled + excluded.fooled, likes = likes + excluded.likes, times = times + 1, updated_at = excluded.updated_at',
            )
            .bind(i.questionId, i.key, i.text, i.fooled, i.likes, now, now),
        ),
      ),
    );
  }

  async listBluffs(status: BluffStatus, limit: number): Promise<BluffRow[]> {
    const res = await this.withBluffPool(() =>
      this.db
        .prepare(
          'SELECT question_id, norm, text, fooled, likes, times, status, created_at, updated_at FROM bluff_pool WHERE status = ? ORDER BY (fooled + likes) DESC, updated_at DESC LIMIT ?',
        )
        .bind(status, limit)
        .all<BluffDbRow>(),
    );
    return res.results.map((r) => ({
      questionId: r.question_id,
      key: r.norm,
      text: r.text,
      fooled: Number(r.fooled),
      likes: Number(r.likes),
      times: Number(r.times),
      status: r.status,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    }));
  }

  async decideBluff(questionId: string, key: string, status: BluffStatus, text: string | null, now: number): Promise<boolean> {
    const res = await this.withBluffPool(() =>
      this.db
        .prepare('UPDATE bluff_pool SET status = ?, text = COALESCE(?, text), updated_at = ? WHERE question_id = ? AND norm = ?')
        .bind(status, text, now, questionId, key)
        .run(),
    );
    return (res.meta.changes ?? 0) === 1;
  }

  async approvedBluffs(): Promise<Record<string, string[]>> {
    const res = await this.withBluffPool(() =>
      this.db.prepare("SELECT question_id, text FROM bluff_pool WHERE status = 'approved'").all<{ question_id: string; text: string }>(),
    );
    const out: Record<string, string[]> = {};
    for (const r of res.results) (out[r.question_id] ??= []).push(r.text);
    return out;
  }
}
