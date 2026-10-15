-- Befristete Fernbedienungen für die Spielleitung, ohne Spielerprofile.
CREATE TABLE IF NOT EXISTS kids_remotes (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  owner_hash TEXT NOT NULL,
  remote_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS kids_remotes_expiry ON kids_remotes (expires_at);
