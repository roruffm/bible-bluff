-- Frische Hausbluffs: starke Bluffs aus echten Partien (ohne Namen), die erst nach Freigabe
-- auf /admin als zusätzliche Hausbluffs und Vorschläge ins Spiel kommen.
-- Der Worker legt die Tabelle beim ersten Bedarf auch selbst an (siehe D1Store.withBluffPool).

CREATE TABLE IF NOT EXISTS bluff_pool (
  question_id TEXT NOT NULL,
  norm TEXT NOT NULL,
  text TEXT NOT NULL,
  fooled INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  times INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'new',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (question_id, norm)
);

CREATE INDEX IF NOT EXISTS bluff_pool_status ON bluff_pool (status, updated_at);
