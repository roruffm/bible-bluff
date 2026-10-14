import type { NicknameView, NicknamesResponse } from '../shared/types';

/** Groß-/Kleinschreibung und gleichwertige Unicode-Schreibweisen zusammenführen. */
export function nicknameKey(name: string): string {
  return name.normalize('NFKC').toLowerCase();
}

export interface NicknameQuery {
  search: string;
  offset: number;
  limit: number;
}

export function nicknamePage(items: NicknameView[], total: number, query: NicknameQuery): NicknamesResponse {
  const next = query.offset + items.length;
  return { items, total, nextOffset: items.length && next < total ? next : null };
}

/** Identisch zu migrations/0005_played_nicknames.sql; auch frische Vorschau-Datenbanken funktionieren. */
export const NICKNAMES_SCHEMA = [
  'CREATE TABLE IF NOT EXISTS played_nicknames (nickname_key TEXT PRIMARY KEY, name TEXT NOT NULL, first_played_at INTEGER NOT NULL, last_played_at INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS played_nicknames_recent ON played_nicknames (last_played_at DESC, nickname_key)',
];
