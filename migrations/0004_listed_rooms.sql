-- Öffentliche Räume: Die Leitung kann einen Raum auf der Startseite anzeigen (state.listed).
-- Der Index findet diese Räume, ohne alle Räume zu lesen. Der Worker legt ihn beim ersten Bedarf
-- auch selbst an (siehe D1Store.listedRooms).

CREATE INDEX IF NOT EXISTS rooms_listed ON rooms (json_extract(state, '$.listed'));
