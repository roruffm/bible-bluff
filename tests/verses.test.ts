import { describe, expect, it } from 'vitest';
import { tomorrow } from '../src/client/lib/verse-image';
import { parseRoute } from '../src/client/lib/router';
import { createApi } from '../src/server/api';
import { QUESTIONS } from '../src/server/questions';
import { MemoryStore } from '../src/server/store';
import { REMINDER_TIMES, dailyImpulses, isCalendarDay, isReminderTime, verseCalendar } from '../src/shared/calendar';
import { WEEK_VERSES, suggestVerses } from '../src/shared/verses';
import { Clock, seeded } from './helpers';

const byId = (id: string) => WEEK_VERSES.find((v) => v.id === id)!;

describe('Wochenverse', () => {
  it('sind vollständig, eindeutig und kurz genug für einen Sperrbildschirm', () => {
    expect(new Set(WEEK_VERSES.map((v) => v.id)).size).toBe(WEEK_VERSES.length);
    for (const v of WEEK_VERSES) {
      expect(v.ref, v.id).toMatch(new RegExp(`^${v.book} \\d+,\\d+(–\\d+)?$`));
      expect(v.text.length, v.id).toBeGreaterThan(10);
      expect(v.text.length, v.id).toBeLessThanOrEqual(230);
      // heutige Rechtschreibung, sonst Lutherbibel 1912
      expect(v.text, v.id).not.toMatch(/daß|Laß|laßt|gewiß|Unterlaß/);
      expect(v.text, v.id).toMatch(/^[A-ZÄÖÜ„]/);
    }
  });

  it('gibt es zu jeder Buchgruppe der Fragen', () => {
    const groups = new Set(QUESTIONS.map((q) => q.group).filter((g) => g !== 'nt'));
    for (const group of groups) expect(WEEK_VERSES.some((v) => v.group === group), group).toBe(true);
  });

  it('passen zuerst zu den Büchern der Partie, dann zur Buchgruppe, zuletzt kommen Jesu Einladungen', () => {
    const picks = suggestVerses([
      { book: 'Lukas', group: 'evangelien', key: 'lk-a' },
      { book: 'Richter', group: 'at', key: 'ri-a' },
      { book: 'Philemon', group: 'paulus', key: 'phlm-a' },
    ]);
    expect(picks).toHaveLength(4);
    expect(picks[0].book).toBe('Lukas');
    expect(picks[1].id).toBe('ri-6-12');
    // Philemon hat keinen eigenen Vers → einer aus den Paulusbriefen
    expect(picks[2].group).toBe('paulus');
    expect(new Set(picks.map((v) => v.id)).size).toBe(4);
    // immer gleich für dieselbe Partie
    expect(suggestVerses([{ book: 'Lukas', group: 'evangelien', key: 'lk-a' }]).map((v) => v.id)).toEqual(
      suggestVerses([{ book: 'Lukas', group: 'evangelien', key: 'lk-a' }]).map((v) => v.id),
    );
  });

  it('reichen auch für eine Partie mit nur einer Frage', () => {
    const picks = suggestVerses([{ book: 'Jona', group: 'at', key: 'jona' }]);
    expect(picks.map((v) => v.id)[0]).toBe('jona-2-3');
    expect(picks).toHaveLength(4);
    expect(picks.slice(1).every((v) => v.group === 'at' || ['joh-15-15', 'mt-11-28', 'offb-3-20', 'joh-14-27', 'mt-28-20'].includes(v.id))).toBe(true);
  });
});

describe('Kalender-Erinnerungen', () => {
  const verse = byId('joh-15-15');
  const ics = verseCalendar(verse, '20261029', '0730', new Date(Date.UTC(2026, 9, 28, 18, 5, 9)));
  const unfolded = ics.replace(/\r\n /g, '');

  it('legen sieben Termine zur gewählten Zeit an, über das Monatsende hinweg, ohne Zeitzone', () => {
    const starts = [...unfolded.matchAll(/^DTSTART:(\d{8}T\d{6})$/gm)].map((m) => m[1]);
    expect(starts).toEqual(['20261029T073000', '20261030T073000', '20261031T073000', '20261101T073000', '20261102T073000', '20261103T073000', '20261104T073000']);
    expect(unfolded).toContain('DTEND:20261029T074000');
    expect(unfolded).toContain('DTSTAMP:20261028T180509Z');
    expect(unfolded.match(/BEGIN:VALARM/g)).toHaveLength(7);
    expect(unfolded).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(unfolded).toMatch(/END:VCALENDAR\r\n$/);
  });

  it('enthalten Vers und jeden Tag einen eigenen Impuls zum Vers – schon im Titel, mit maskierten Kommas und Semikolons', () => {
    const escaped = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const impulses = dailyImpulses('joh-15-15', 'de');
    expect(impulses).toHaveLength(7);
    const titles = [...unfolded.matchAll(/^SUMMARY:(.*)$/gm)].map((m) => m[1]);
    expect(titles).toEqual(impulses.map((impulse) => escaped(`Johannes 15,15: ${impulse}`)));
    impulses.forEach((impulse, i) => expect(unfolded).toContain(escaped(`Tag ${i + 1}: ${impulse}`)));
    expect(unfolded).toContain('Ich sage hinfort nicht\\, dass ihr Knechte seid\\; denn');
  });

  it('halten jede Zeile unter 75 Byte und tragen feste Kennungen (kein Doppeleintrag beim zweiten Mal)', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(unfolded).toContain('UID:vers-joh-15-15-20261029-0730-1@biblebluff.de');
    const again = verseCalendar(verse, '20261029', '0730', new Date()).replace(/\r\n /g, '');
    expect([...again.matchAll(/^UID:.*$/gm)].map((m) => m[0])).toEqual([...unfolded.matchAll(/^UID:.*$/gm)].map((m) => m[0]));
  });

  it('prüfen Tag und Uhrzeit', () => {
    expect(isCalendarDay('20261012')).toBe(true);
    expect(isCalendarDay('20260230')).toBe(false);
    expect(isCalendarDay('2026-10-12')).toBe(false);
    expect(isCalendarDay('19991231')).toBe(false);
    expect(REMINDER_TIMES.map((t) => t.value).every(isReminderTime)).toBe(true);
    expect(isReminderTime('0300')).toBe(false);
  });

  it('beginnen morgen nach der Uhr des Handys', () => {
    expect(tomorrow(new Date(2026, 9, 31, 23, 50))).toBe('20261101');
    expect(tomorrow(new Date(2026, 11, 31, 8, 0))).toBe('20270101');
  });

  it('kommen als Kalenderdatei von /api/kalender', async () => {
    const clock = new Clock();
    const api = createApi({ store: new MemoryStore(), now: () => clock.now, rng: seeded(3) });
    const get = (query: string) => api(new Request(`http://test/api/kalender${query}`));
    const ok = await get('?vers=joh-15-15&ab=20261012&zeit=2000');
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
    expect(ok.headers.get('content-disposition')).toContain('mein-vers-fuer-die-woche.ics');
    const text = await ok.text();
    expect(text).toContain('DTSTART:20261012T200000');
    expect((await get('?vers=gibt-es-nicht&ab=20261012&zeit=2000')).status).toBe(404);
    expect((await get('?vers=joh-15-15&ab=morgen&zeit=2000')).status).toBe(400);
    expect((await get('?vers=joh-15-15&ab=20261012&zeit=0300')).status).toBe(400);
  });
});

describe('Neugierig auf Jesus?', () => {
  it('hat eine eigene Seite unter /jesus', () => {
    expect(parseRoute('/jesus')).toEqual({ name: 'jesus' });
    expect(parseRoute('/jesus/')).toEqual({ name: 'jesus' });
  });
});
