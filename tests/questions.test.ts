import { describe, expect, it } from 'vitest';
import { BLUFF_MAX } from '../src/shared/rules';
import { QUESTIONS } from '../src/server/questions';
import { isDuplicate, isTooCloseToTruth } from '../src/server/text';
import { SAFE_BLUFFS } from '../e2e/bluffs';

describe('Fragenpool', () => {
  it('hat eindeutige IDs und deckt alle 27 Bücher ab', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    const books = new Set(QUESTIONS.map((q) => q.book));
    for (const book of [
      'Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte', 'Römer', '1. Korinther', '2. Korinther',
      'Galater', 'Epheser', 'Philipper', 'Kolosser', '1. Thessalonicher', '2. Thessalonicher', '1. Timotheus',
      '2. Timotheus', 'Titus', 'Philemon', 'Hebräer', 'Jakobus', '1. Petrus', '2. Petrus', '1. Johannes',
      '2. Johannes', '3. Johannes', 'Judas', 'Offenbarung',
    ]) {
      expect(books.has(book), book).toBe(true);
    }
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))('%s ist in sich stimmig', (_id, q) => {
    expect(q.prompt.length).toBeGreaterThan(10);
    expect(q.answer.length).toBeLessThanOrEqual(BLUFF_MAX);
    expect(q.ref).not.toBe('');
    expect(q.discovery.length).toBeGreaterThan(20);
    expect(q.bluffs.length).toBeGreaterThanOrEqual(3);
    // Die Antwort selbst wird als „zu nah“ erkannt …
    expect(isTooCloseToTruth(q.answer, q)).toBe(true);
    for (const v of q.variants ?? []) expect(isTooCloseToTruth(v, q)).toBe(true);
    // … die vorbereiteten Bluffs dagegen nicht.
    for (const b of q.bluffs) {
      expect(isTooCloseToTruth(b, q), b).toBe(false);
      expect(b.length).toBeLessThanOrEqual(BLUFF_MAX);
    }
    for (let i = 0; i < q.bluffs.length; i++) {
      for (let j = i + 1; j < q.bluffs.length; j++) expect(isDuplicate(q.bluffs[i], q.bluffs[j])).toBe(false);
    }
  });

  it('kollidiert nicht mit den Bluff-Texten der End-to-End-Tests', () => {
    for (const text of Object.values(SAFE_BLUFFS)) {
      for (const q of QUESTIONS) {
        expect(isTooCloseToTruth(text, q), `${text} ↔ ${q.id}`).toBe(false);
        for (const b of q.bluffs) expect(isDuplicate(text, b), `${text} ↔ ${b}`).toBe(false);
      }
    }
  });

  it('erkennt Schlüsselwörter nicht mitten in fremden Wörtern', () => {
    const eselin = QUESTIONS.find((q) => q.id === '2petr-eselin')!;
    expect(isTooCloseToTruth('Siebzehn polierte Kieselsteine', eselin)).toBe(false);
    expect(isTooCloseToTruth('Bileams Esel', eselin)).toBe(true);
  });
});
