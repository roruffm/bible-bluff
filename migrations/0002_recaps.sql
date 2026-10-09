-- Entdeckungen zum Mitnehmen: dauerhafte Seiten nach dem Spiel (/e/ID), unabhängig von Räumen.
-- Der Worker legt die Tabelle beim ersten Bedarf auch selbst an (siehe D1Store.saveRecap).

CREATE TABLE IF NOT EXISTS recaps (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
