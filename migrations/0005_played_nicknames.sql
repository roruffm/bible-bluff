-- Separate Adminliste: keine Raumcodes, Sitzungskennungen oder Zuordnung zu Spielzügen.
-- Bleibt nach Ablauf der Spielräume bestehen; Einträge lassen sich im Adminbereich entfernen.
CREATE TABLE IF NOT EXISTS played_nicknames (
  nickname_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  first_played_at INTEGER NOT NULL,
  last_played_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS played_nicknames_recent
  ON played_nicknames (last_played_at DESC, nickname_key);
