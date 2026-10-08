import { describe, expect, it } from 'vitest';
import { canonical, isDuplicate, isTooCloseToTruth, matchesKeywordGroups, normalize } from '../src/server/text';

describe('normalize', () => {
  it('schreibt Umlaute aus und entfernt Satzzeichen', () => {
    expect(normalize('  Öl, Brot & Füße!  ')).toBe('oel brot fuesse');
    expect(normalize('Chloë')).toBe('chloe');
  });
});

describe('canonical', () => {
  it('ignoriert Reihenfolge, Füllwörter und Zahlwort-Schreibweise', () => {
    expect(canonical('Brot und Öl')).toBe(canonical('Öl, Brot'));
    expect(canonical('Drei Jahre')).toBe(canonical('3 Jahre'));
  });
});

describe('Schlüsselwörter', () => {
  const groups = [['=tu', '=auf'], ['oeffne'], ['*tuch']];
  it('unterscheidet Wortanfang, enthält und exakt', () => {
    expect(matchesKeywordGroups('Tu dich auf!', groups)).toBe(true);
    expect(matchesKeywordGroups('Öffne dich', groups)).toBe(true);
    expect(matchesKeywordGroups('Sein Leinentuch', groups)).toBe(true);
    expect(matchesKeywordGroups('Steh auf und geh', groups)).toBe(false);
  });
});

describe('isTooCloseToTruth', () => {
  const q = {
    answer: 'Einen Mantel, Bücher und Pergamente',
    accept: [['mantel'], ['pergament'], ['*buecher']],
  };
  it('erkennt richtige und fast richtige Eingaben', () => {
    expect(isTooCloseToTruth('mantel, bücher, pergamente', q)).toBe(true);
    expect(isTooCloseToTruth('Seinen warmen Mantel', q)).toBe(true);
    expect(isTooCloseToTruth('Die Pergamentrollen', q)).toBe(true);
  });
  it('lässt echte Bluffs durch', () => {
    expect(isTooCloseToTruth('Brot, Öl und neue Sandalen', q)).toBe(false);
  });
  it('verwechselt keine verschiedenen Zahlen', () => {
    const num = { answer: 'Mehr als 500', accept: [['=500']] };
    expect(isTooCloseToTruth('Mehr als 70', num)).toBe(false);
    expect(isTooCloseToTruth('mehr als 500', num)).toBe(true);
  });
});

describe('isDuplicate', () => {
  it('führt gleiche Antworten zusammen', () => {
    expect(isDuplicate('Brot und Öl', 'Öl und Brot')).toBe(true);
    expect(isDuplicate('Neue Sandalen', 'neue sandalen.')).toBe(true);
    expect(isDuplicate('Ein Krug mit Wasser', 'Ein Krug mit Wassser')).toBe(true);
  });
  it('trennt verschiedene Antworten', () => {
    expect(isDuplicate('Rom', 'Ram')).toBe(false);
    expect(isDuplicate('400 Jahre', '430 Jahre')).toBe(false);
    expect(isDuplicate('Ein Esel', 'Ein Kamel')).toBe(false);
  });
});
