// Speicher-Schnittstelle. Raumzustand wird mit Versionsnummer gespeichert (optimistische Sperre):
// Ein Update gelingt nur, wenn niemand dazwischen geschrieben hat.

import type { RoomState } from './state';

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
}

/** Für Tests und den lokalen Node-Server (z. B. Spieleabend im eigenen WLAN). */
export class MemoryStore implements RoomStore {
  private rooms = new Map<string, { json: string; version: number; updatedAt: number }>();
  private presence = new Map<string, Map<string, number>>();

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
}
