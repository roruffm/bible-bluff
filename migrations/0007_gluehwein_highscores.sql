CREATE TABLE IF NOT EXISTS gluehwein_runs (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  seed INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS gluehwein_runs_expiry ON gluehwein_runs (expires_at);
CREATE TABLE IF NOT EXISTS gluehwein_scores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score > 0),
  served INTEGER NOT NULL CHECK (served > 0),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS gluehwein_scores_ranking ON gluehwein_scores (score DESC, served DESC, created_at ASC, id ASC);
