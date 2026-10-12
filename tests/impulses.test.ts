// Tagesimpulse zu „Mein Vers für die Woche“: zu jedem Vers sieben eigene Ein-Satz-Impulse, auf Deutsch
// und auf Englisch, für jeden Tag der Kalender-Erinnerungen einer.

import { describe, expect, it } from 'vitest';
import { dailyImpulses } from '../src/shared/calendar';
import { DAILY_IMPULSES } from '../src/shared/daily-impulses';
import { EN_DAILY_IMPULSES } from '../src/shared/daily-impulses-en';
import { WEEK_VERSES } from '../src/shared/verses';
import { EN_WEEK_VERSES } from '../src/shared/verses-en';

const AMERICAN = /\b(colors?|colored|colorful|favors?|favored|favorite\w*|honors?|honored|honoring|saviors?|neighbors?|neighborhoods?|labors?|labored|behaviors?|(?:realiz|recogniz|organiz|apologiz|baptiz|criticiz|emphasiz|prioritiz)(?:e|es|ed|ing|ation)|centers?|centered|theaters?|traveled|traveling|travelers?|gray|moms?|programs?|defense|offense|fulfills?|fulfillment|practicing)\b/i;

function checkSentence(text: string, where: string) {
  expect(text, where).toBe(text.trim());
  expect(text.length, where).toBeGreaterThanOrEqual(25);
  expect(text.length, where).toBeLessThanOrEqual(140);
  expect(text, where).toMatch(/[?.!]$/);
  // Ein einziger Satz: kein Satzende mitten im Text
  expect(text.slice(0, -1), where).not.toMatch(/[.!?…][“”„’]?\s+\S/);
  expect(text, where).not.toMatch(/["']/);
  expect(text, where).not.toMatch(/\p{Extended_Pictographic}/u);
}

describe('Tagesimpulse zu den Wochenversen', () => {
  it('gibt es zu jedem Vers genau sieben – auf Deutsch und auf Englisch', () => {
    expect(Object.keys(DAILY_IMPULSES).sort()).toEqual(WEEK_VERSES.map((v) => v.id).sort());
    expect(Object.keys(EN_DAILY_IMPULSES).sort()).toEqual(EN_WEEK_VERSES.map((v) => v.id).sort());
    for (const v of WEEK_VERSES) {
      expect(dailyImpulses(v.id, 'de'), v.id).toHaveLength(7);
      expect(dailyImpulses(v.id, 'en'), v.id).toHaveLength(7);
    }
    expect(dailyImpulses('gibt-es-nicht', 'de')).toEqual([]);
  });

  it('sind je ein kurzer Satz, innerhalb eines Verses alle verschieden', () => {
    for (const [lang, all] of [
      ['de', DAILY_IMPULSES],
      ['en', EN_DAILY_IMPULSES],
    ] as const) {
      for (const [id, list] of Object.entries(all)) {
        expect(new Set(list).size, `${lang} ${id}`).toBe(list.length);
        list.forEach((text, i) => checkSentence(text, `${lang} ${id} Tag ${i + 1}`));
      }
    }
  });

  it('sprechen auf Deutsch mit „du“ und nutzen deutsche Anführungszeichen', () => {
    for (const [id, list] of Object.entries(DAILY_IMPULSES)) {
      list.forEach((text, i) => {
        const where = `${id} Tag ${i + 1}`;
        expect(text.slice(1), where).not.toMatch(/(^|[^„.?!]\s)(Sie|Ihnen)\b/);
        if (text.includes('“')) expect(text, where).toContain('„');
      });
    }
  });

  it('sind auf Englisch britisch und ohne deutsche Zeichen', () => {
    for (const [id, list] of Object.entries(EN_DAILY_IMPULSES)) {
      list.forEach((text, i) => {
        const where = `${id} day ${i + 1}`;
        expect(text, where).not.toMatch(/[äöüÄÖÜß„]/);
        expect(text, where).not.toMatch(AMERICAN);
      });
    }
  });

  it('wiederholen sich nicht von Vers zu Vers', () => {
    for (const all of [DAILY_IMPULSES, EN_DAILY_IMPULSES]) {
      const texts = Object.values(all).flat();
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});
