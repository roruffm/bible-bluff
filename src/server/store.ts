// Speicher-Schnittstelle. Raumzustand wird mit Versionsnummer gespeichert (optimistische Sperre):
// Ein Update gelingt nur, wenn niemand dazwischen geschrieben hat.

import type { BluffStatus, RecapView } from '../shared/types';
import type { RoomState } from './state';

/** Starker Bluff aus einer echten Partie – Kandidat für frische Hausbluffs */
export interface BluffCandidateInput {
  questionId: string;
  /** Normalform zum Zusammenführen gleicher Bluffs */
  key: string;
  text: string;
  fooled: number;
  likes: number;
}

export interface BluffRow extends BluffCandidateInput {
  /** wie oft dieser Bluff (in irgendeiner Schreibweise) schon stark war */
  times: number;
  status: BluffStatus;
  createdAt: number;
  updatedAt: number;
}

export interface RoomRecord {
  state: RoomState;
  version: number;
  presence: Record<string, number>;
}

export interface RoomStore {
  load(code: string): Promise<RoomRecord | null>;
  /** false, wenn der Code schon vergeben ist */
  insert(code: string, state: RoomState, now: number): Promise<boolean>;
  /** false bei Versionskonflikt */
  update(code: string, state: RoomState, expectedVersion: number, now: number): Promise<boolean>;
  touch(code: string, playerId: string, now: number): Promise<void>;
  cleanup(updatedBefore: number): Promise<void>;
  /** Entdeckungen-Seite dauerhaft ablegen; eine schon vorhandene ID bleibt unverändert */
  saveRecap(recap: RecapView, now: number): Promise<void>;
  loadRecap(id: string): Promise<RecapView | null>;
  /** Kandidaten sammeln; ein schon bekannter Bluff zählt hoch und behält seinen Status */
  addBluffCandidates(items: BluffCandidateInput[], now: number): Promise<void>;
  listBluffs(status: BluffStatus, limit: number): Promise<BluffRow[]>;
  /** false, wenn es den Kandidaten nicht gibt */
  decideBluff(questionId: string, key: string, status: BluffStatus, text: string | null, now: number): Promise<boolean>;
  /** freigegebene Bluffs je Frage */
  approvedBluffs(): Promise<Record<string, string[]>>;
}

/** Stärkste zuerst: Reingelegte und Herzen zusammen, dann die jüngsten */
export function byStrength(a: BluffRow, b: BluffRow): number {
  return b.fooled + b.likes - (a.fooled + a.likes) || b.updatedAt - a.updatedAt;
}

/** Für Tests und den lokalen Node-Server (z. B. Spieleabend im eigenen WLAN). */
export class MemoryStore implements RoomStore {
  private rooms = new Map<string, { json: string; version: number; updatedAt: number }>();
  private presence = new Map<string, Map<string, number>>();
  private recaps = new Map<string, string>();
  private bluffs = new Map<string, BluffRow>();

  async load(code: string): Promise<RoomRecord | null> {
    const row = this.rooms.get(code);
    if (!row) return null;
    return {
      state: JSON.parse(row.json) as RoomState,
      version: row.version,
      presence: Object.fromEntries(this.presence.get(code) ?? []),
    };
  }

  async insert(code: string, state: RoomState, now: number): Promise<boolean> {
    if (this.rooms.has(code)) return false;
    this.rooms.set(code, { json: JSON.stringify(state), version: 1, updatedAt: now });
    return true;
  }

  async update(code: string, state: RoomState, expectedVersion: number, now: number): Promise<boolean> {
    const row = this.rooms.get(code);
    if (!row || row.version !== expectedVersion) return false;
    this.rooms.set(code, { json: JSON.stringify(state), version: expectedVersion + 1, updatedAt: now });
    return true;
  }

  async touch(code: string, playerId: string, now: number): Promise<void> {
    let map = this.presence.get(code);
    if (!map) this.presence.set(code, (map = new Map()));
    map.set(playerId, now);
  }

  async cleanup(updatedBefore: number): Promise<void> {
    for (const [code, row] of this.rooms) {
      if (row.updatedAt < updatedBefore) {
        this.rooms.delete(code);
        this.presence.delete(code);
      }
    }
  }

  async saveRecap(recap: RecapView): Promise<void> {
    if (!this.recaps.has(recap.id)) this.recaps.set(recap.id, JSON.stringify(recap));
  }

  async loadRecap(id: string): Promise<RecapView | null> {
    const json = this.recaps.get(id);
    return json ? (JSON.parse(json) as RecapView) : null;
  }

  async addBluffCandidates(items: BluffCandidateInput[], now: number): Promise<void> {
    for (const item of items) {
      const id = `${item.questionId}\u0000${item.key}`;
      const row = this.bluffs.get(id);
      if (row) {
        row.fooled += item.fooled;
        row.likes += item.likes;
        row.times += 1;
        row.updatedAt = now;
      } else {
        this.bluffs.set(id, { ...item, times: 1, status: 'new', createdAt: now, updatedAt: now });
      }
    }
  }

  async listBluffs(status: BluffStatus, limit: number): Promise<BluffRow[]> {
    return [...this.bluffs.values()]
      .filter((r) => r.status === status)
      .sort(byStrength)
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async decideBluff(questionId: string, key: string, status: BluffStatus, text: string | null, now: number): Promise<boolean> {
    const row = this.bluffs.get(`${questionId}\u0000${key}`);
    if (!row) return false;
    row.status = status;
    if (text) row.text = text;
    row.updatedAt = now;
    return true;
  }

  async approvedBluffs(): Promise<Record<string, string[]>> {
    const out: Record<string, string[]> = {};
    for (const r of this.bluffs.values()) if (r.status === 'approved') (out[r.questionId] ??= []).push(r.text);
    return out;
  }
}
