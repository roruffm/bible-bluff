// Wörterbuch Deutsch → Englisch: Jeder Text, den App oder Server übersetzen, braucht eine englische
// Fassung – und jeder Eintrag im Wörterbuch muss noch irgendwo im Code stehen.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/client/lib/theme';
import { REMINDER_TIMES } from '../src/shared/calendar';
import { EN } from '../src/shared/i18n-en';
import { hasTranslation, isLang, translate } from '../src/shared/i18n';
import { CATEGORIES, DIFFICULTY_OPTIONS, GROUP_LABELS, HEART_QUESTIONS, ROUND_TYPE_OPTIONS, TALK_STEPS } from '../src/shared/rules';

const SRC = new URL('../src/', import.meta.url).pathname;

function sources(dir = SRC): { path: string; text: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) && !name.startsWith('i18n-en') ? [{ path, text: readFileSync(path, 'utf8') }] : [];
  });
}

const STRING = String.raw`'((?:[^'\\]|\\.)*)'`;
/** t('…'), tj('…'), translate(lang, '…') und Meldungen new GameError('code', '…') */
const CALLS = [
  new RegExp(String.raw`\b(?:t|tj)\(\s*` + STRING, 'g'),
  new RegExp(String.raw`\btranslate\(\s*[\w.]+\s*,\s*` + STRING, 'g'),
  new RegExp(String.raw`new GameError\(\s*'[^']*'\s*,\s*` + STRING, 'g'),
];

function usedKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  for (const { path, text } of sources()) {
    for (const re of CALLS) for (const m of text.matchAll(re)) keys.set(m[1].replace(/\\'/g, "'"), path.slice(SRC.length));
  }
  return keys;
}

/** Texte, die erst zur Laufzeit übersetzt werden (Listen aus den Regeln, Farbkonzepte …) */
const DYNAMIC = [
  ...DIFFICULTY_OPTIONS.map((o) => o.label),
  ...ROUND_TYPE_OPTIONS.map((o) => o.label),
  ...CATEGORIES.map((c) => c.label),
  ...Object.values(GROUP_LABELS),
  ...TALK_STEPS.flatMap((s) => [s.title, s.prompt]),
  ...HEART_QUESTIONS,
  ...REMINDER_TIMES.map((r) => r.label),
  ...THEMES.map((th) => th.name),
];

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Englisches Wörterbuch', () => {
  it('kennt jeden Text, den Code übersetzen lässt', () => {
    const missing = [...usedKeys()].filter(([key]) => !hasTranslation(key)).map(([key, file]) => `${file}: ${key}`);
    expect(missing).toEqual([]);
    expect(DYNAMIC.filter((key) => !hasTranslation(key))).toEqual([]);
  });

  it('enthält nur Einträge, die noch im Code vorkommen', () => {
    const code = sources()
      .map((s) => s.text)
      .join('\n');
    const unused = Object.keys(EN).filter((key) => !code.includes(`'${key.replace(/'/g, "\\'")}'`));
    expect(unused).toEqual([]);
  });

  it('übernimmt alle Platzhalter', () => {
    for (const [de, en] of Object.entries(EN)) expect(placeholders(en), de).toEqual(placeholders(de));
  });

  it('ist britisches Englisch ohne deutsche Reste', () => {
    for (const [de, en] of Object.entries(EN)) {
      expect(en, de).not.toMatch(/[äöüÄÖÜß„]/);
      expect(en, de).not.toMatch(/\b(color|favor|favorite|honor|neighbor|center|realize|recognize|organize|program|gray|mom)\b/i);
      // Typografische Apostrophe und Anführungszeichen wie in der World English Bible
      expect(en, de).not.toMatch(/["']/);
      expect(en.trim(), de).toBe(en);
    }
  });

  it('übersetzt mit Platzhaltern und bleibt sonst bei Deutsch', () => {
    expect(translate('en', 'Runde {n} von {total}', { n: 2, total: 8 })).toBe('Round 2 of 8');
    expect(translate('de', 'Runde {n} von {total}', { n: 2, total: 8 })).toBe('Runde 2 von 8');
    expect(translate('en', 'Gibt es nicht im Wörterbuch')).toBe('Gibt es nicht im Wörterbuch');
    expect(translate('en', '„{text}“', { text: 'Ein Boot' })).toBe('“Ein Boot”');
    // Unbekannte Platzhalter bleiben sichtbar stehen, statt still zu verschwinden
    expect(translate('en', 'Raum {code}', {})).toBe('Room {code}');
    expect(isLang('en') && isLang('de') && !isLang('fr') && !isLang(undefined)).toBe(true);
  });
});
