-- Bible Bluff: Räume als JSON mit Versionsnummer (optimistische Sperre) und Präsenz je Gerät.

CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS rooms_updated_at ON rooms (updated_at);

CREATE TABLE IF NOT EXISTS presence (
  code TEXT NOT NULL,
  player_id TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (code, player_id)
);
