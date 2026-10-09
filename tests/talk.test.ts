import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/server/questions';
import { TALK, talkNotes } from '../src/server/talk';

const BOOKS = [
  '1. Mose', '2. Mose', '3. Mose', '4. Mose', '5. Mose', 'Josua', 'Richter', 'Rut', '1. Samuel', '2. Samuel', '1. Könige',
  '2. Könige', '1. Chronik', '2. Chronik', 'Esra', 'Nehemia', 'Ester', 'Hiob', 'Psalm', 'Sprüche', 'Prediger', 'Hoheslied',
  'Jesaja', 'Jeremia', 'Klagelieder', 'Hesekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadja', 'Jona', 'Micha', 'Nahum',
  'Habakuk', 'Zefanja', 'Haggai', 'Sacharja', 'Maleachi', 'Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte',
  'Römer', '1. Korinther', '2. Korinther', 'Galater', 'Epheser', 'Philipper', 'Kolosser', '1. Thessalonicher',
  '2. Thessalonicher', '1. Timotheus', '2. Timotheus', 'Titus', 'Philemon', 'Hebräer', 'Jakobus', '1. Petrus', '2. Petrus',
  '1. Johannes', '2. Johannes', '3. Johannes', 'Judas', 'Offenbarung',
];

describe('Gesprächsstoff', () => {
  it('gibt es für jede Frage genau einmal', () => {
    expect(Object.keys(TALK).sort()).toEqual(QUESTIONS.map((q) => q.id).sort());
    for (const q of QUESTIONS) expect(talkNotes(q.id), q.id).not.toBeNull();
    expect(talkNotes('gibt-es-nicht')).toBeNull();
  });

  it('hält die Längen ein, damit Spickzettel und Leinwand lesbar bleiben', () => {
    for (const [id, t] of Object.entries(TALK)) {
      expect(t.background.length, `${id} Hintergrund`).toBeLessThanOrEqual(230);
      expect(t.question.length, `${id} Frage`).toBeLessThanOrEqual(140);
      expect(t.crossRef.note.length, `${id} Querverweis`).toBeLessThanOrEqual(140);
      expect(t.question.trim().endsWith('?'), `${id} endet mit Fragezeichen`).toBe(true);
    }
  });

  it('verweist auf echte Buchnamen im Format „Buch Kapitel,Vers“ und nicht auf die eigene Stelle', () => {
    const pattern = /^((?:[1-5]\. )?[A-ZÄÖÜ][a-zäöüß]+) (\d+),(\d+)(?:-(\d+))?$/;
    for (const q of QUESTIONS) {
      const ref = TALK[q.id].crossRef.ref;
      const m = pattern.exec(ref);
      expect(m, `${q.id}: ${ref}`).not.toBeNull();
      expect(BOOKS, `${q.id}: ${ref}`).toContain(m![1]);
      if (m![4]) expect(Number(m![4]), `${q.id}: ${ref}`).toBeGreaterThan(Number(m![3]));
      expect(ref, q.id).not.toBe(q.ref);
    }
  });
});
