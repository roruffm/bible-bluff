// Die englische Fassung: Fragenpool, Spickzettel, Wochenverse, Kalender, Räume und Link-Vorschau.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { randomCode } from '../src/server/codes';
import { applyAction, createRoom, formatGap, joinRoom, matchingQuestions, step, tick } from '../src/server/engine';
import { EN_QUESTIONS } from '../src/server/en/questions';
import { EN_TALK } from '../src/server/en/talk';
import { homePreview, invitePreview } from '../src/server/preview';
import { QUESTIONS, getQuestion, hasQuestion, questionsFor } from '../src/server/questions';
import { buildRecap } from '../src/server/recap';
import type { RoomState } from '../src/server/state';
import { MemoryStore } from '../src/server/store';
import { talkNotes } from '../src/server/talk';
import { isDuplicate, isTooCloseToTruth } from '../src/server/text';
import { buildView } from '../src/server/view';
import { dailyImpulses, verseCalendar } from '../src/shared/calendar';
import { translate } from '../src/shared/i18n';
import { ALL_CATEGORIES, BLUFF_MAX, GAP, HEART_QUESTIONS } from '../src/shared/rules';
import type { Settings } from '../src/shared/types';
import { EN_VERSE_SOURCE, EN_WEEK_VERSES } from '../src/shared/verses-en';
import { WEEK_VERSES, suggestVerses, verseSource } from '../src/shared/verses';
import worker from '../src/worker';
import { SAFE_BLUFFS_EN } from '../e2e/bluffs';
import { Clock, ctxFor, seeded } from './helpers';

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings',
  '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes',
  'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John',
  '2 John', '3 John', 'Jude', 'Revelation',
];
/** Ein Psalm heißt in der Stellenangabe „Psalm 46:10“ */
const refBook = (book: string) => (book === 'Psalms' ? 'Psalm' : book);
const AMERICAN = /\b(color|favor|favorite|honor|savior|neighbor|labor|behavior|realize|recognize|organize|apologize|baptize|criticize|center|theater|traveled|traveling|gray|mom|program|defense|offense|jewelry)\w*\b/i;

const texts = (q: (typeof EN_QUESTIONS)[number]) => [q.prompt, q.answer, ...(q.variants ?? []), ...q.bluffs, q.discovery];

describe('Englischer Fragenpool', () => {
  it('übernimmt ausgewählte Fragen mit denselben IDs, Kategorien und Schwierigkeiten', () => {
    expect(EN_QUESTIONS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(EN_QUESTIONS.map((q) => q.id)).size).toBe(EN_QUESTIONS.length);
    for (const q of EN_QUESTIONS) {
      const de = getQuestion(q.id, 'de');
      expect({ group: q.group, difficulty: q.difficulty, kind: q.kind, number: q.number }, q.id).toEqual({
        group: de.group,
        difficulty: de.difficulty,
        kind: de.kind,
        number: de.number,
      });
    }
    expect(questionsFor('en')).toBe(EN_QUESTIONS);
    expect(questionsFor('de')).toBe(QUESTIONS);
    const germanOnly = QUESTIONS.find((q) => !hasQuestion(q.id, 'en'))!;
    expect(hasQuestion(germanOnly.id, 'de')).toBe(true);
    expect(() => getQuestion(germanOnly.id, 'en')).toThrow();
  });

  it('bietet in jeder Kategorie Fragen und genug Lückentexte', () => {
    for (const c of ALL_CATEGORIES) {
      expect(matchingQuestions({ roundType: 'gemischt', categories: [c], lang: 'en' }).length, c).toBeGreaterThanOrEqual(5);
    }
    expect(matchingQuestions({ roundType: 'luecken', categories: ALL_CATEGORIES, lang: 'en' }).length).toBeGreaterThanOrEqual(10);
    expect(matchingQuestions({ roundType: 'fragen', categories: ALL_CATEGORIES, lang: 'en' }).length).toBeGreaterThanOrEqual(40);
  });

  it.each(EN_QUESTIONS.map((q) => [q.id, q] as const))('%s ist in sich stimmig', (_id, q) => {
    expect(BOOKS).toContain(q.book);
    expect(q.ref).toMatch(/^[1-3]?[ A-Za-z]+ \d+:\d+(–\d+)?((; |, )([1-3]?[ A-Za-z]+ )?\d+(:\d+)?(–\d+)?)*$/);
    expect(q.ref.startsWith(refBook(q.book))).toBe(true);
    expect(q.prompt.length).toBeGreaterThan(10);
    expect(q.answer.length).toBeLessThanOrEqual(BLUFF_MAX);
    expect(q.discovery.length).toBeGreaterThan(20);
    expect(q.bluffs.length).toBeGreaterThanOrEqual(3);
    // Die Antwort (auch in anderen Worten) gilt als „zu nah“, die vorbereiteten Bluffs nicht
    expect(isTooCloseToTruth(q.answer, q)).toBe(true);
    for (const v of q.variants ?? []) expect(isTooCloseToTruth(v, q), v).toBe(true);
    for (const b of q.bluffs) {
      expect(isTooCloseToTruth(b, q), b).toBe(false);
      expect(b.length).toBeLessThanOrEqual(BLUFF_MAX);
    }
    for (let i = 0; i < q.bluffs.length; i++) {
      for (let j = i + 1; j < q.bluffs.length; j++) expect(isDuplicate(q.bluffs[i], q.bluffs[j])).toBe(false);
    }
    if (q.kind === 'gap') {
      expect(q.prompt.split(GAP)).toHaveLength(2);
      // Antwort und Bluffs stehen schon so da, wie das Spiel getippte Antworten in die Lücke setzt
      for (const part of [q.answer, ...(q.variants ?? []), ...q.bluffs]) expect(formatGap(part, q.prompt, 'en'), part).toBe(part);
    } else {
      expect(q.prompt).not.toContain(GAP);
    }
    for (const text of texts(q)) {
      expect(text).not.toMatch(/[äöüÄÖÜß„]/);
      expect(text).not.toMatch(AMERICAN);
      expect(text).not.toMatch(/["']/);
    }
  });

  it('kollidiert nicht mit den Bluff-Texten des englischen End-to-End-Tests', () => {
    for (const text of Object.values(SAFE_BLUFFS_EN)) {
      for (const q of EN_QUESTIONS) {
        expect(isTooCloseToTruth(text, q), `${text} ↔ ${q.id}`).toBe(false);
        for (const b of q.bluffs) expect(isDuplicate(text, b), `${text} ↔ ${b}`).toBe(false);
      }
    }
  });

  it('hat zu jeder Frage einen Spickzettel in britischem Englisch', () => {
    expect(Object.keys(EN_TALK).sort()).toEqual(EN_QUESTIONS.map((q) => q.id).sort());
    for (const q of EN_QUESTIONS) {
      const t = talkNotes(q.id, 'en')!;
      expect(t, q.id).toBe(EN_TALK[q.id]);
      expect(t.background.length, q.id).toBeLessThanOrEqual(230);
      expect(t.question.length, q.id).toBeLessThanOrEqual(140);
      expect(t.crossRef.note.length, q.id).toBeLessThanOrEqual(140);
      expect(t.question.trim().endsWith('?'), q.id).toBe(true);
      const m = /^(.+) (\d+):(\d+)(?:–(\d+))?$/.exec(t.crossRef.ref);
      expect(m, `${q.id}: ${t.crossRef.ref}`).not.toBeNull();
      expect(BOOKS.map(refBook), `${q.id}: ${t.crossRef.ref}`).toContain(m![1]);
      if (m![4]) expect(Number(m![4])).toBeGreaterThan(Number(m![3]));
      expect(t.crossRef.ref).not.toBe(q.ref);
      for (const text of [t.background, t.question, t.crossRef.note]) {
        expect(text, q.id).not.toMatch(/[äöüÄÖÜß„]/);
        expect(text, q.id).not.toMatch(AMERICAN);
      }
    }
    // Deutsche Partien behalten ihre deutschen Spickzettel
    expect(talkNotes('mt-muenze', 'de')!.question).toMatch(/Recht/);
    expect(talkNotes('gibt-es-nicht', 'en')).toBeNull();
  });
});

describe('Englische Lückentexte', () => {
  it('beginnen mitten im Satz klein – außer Namen und „I“', () => {
    expect(formatGap('Five smooth stones', 'David went to the stream and chose ___.', 'en')).toBe('five smooth stones');
    expect(formatGap('Moses', 'It was ___ who held up his arms.', 'en')).toBe('Moses');
    expect(formatGap('Peter’s mother-in-law', 'Jesus healed ___ first.', 'en')).toBe('Peter’s mother-in-law');
    expect(formatGap('I am the bread', 'Jesus said: “___ of life.”', 'en')).toBe('I am the bread');
    expect(formatGap('a camel', '___ goes through the eye of a needle.', 'en')).toBe('A camel');
    // Wer den ganzen Satz tippt, bekommt nur den Teil für die Lücke
    expect(formatGap('David went to the stream and chose Five Pebbles.', 'David went to the stream and chose ___.', 'en')).toBe('five Pebbles');
  });
});

describe('Englische Wochenverse', () => {
  it('sind dieselben Verse wie auf Deutsch – im Wortlaut der World English Bible', () => {
    expect(EN_WEEK_VERSES.map((v) => [v.id, v.group])).toEqual(WEEK_VERSES.map((v) => [v.id, v.group]));
    expect(verseSource('en')).toBe(EN_VERSE_SOURCE);
    expect(EN_VERSE_SOURCE).toContain('World English Bible');
    for (const v of EN_WEEK_VERSES) {
      expect(BOOKS, v.id).toContain(v.book);
      expect(v.ref, v.id).toMatch(new RegExp(`^${refBook(v.book)} \\d+:\\d+(–\\d+)?$`));
      expect(v.text.length, v.id).toBeGreaterThan(10);
      expect(v.text.length, v.id).toBeLessThanOrEqual(230);
      expect(v.text, v.id).not.toMatch(/[äöüÄÖÜß„"']/);
      expect(v.text, v.id).not.toMatch(AMERICAN);
    }
    // Englische Zählung: Jona 2,3 heißt Jonah 2:2
    expect(EN_WEEK_VERSES.find((v) => v.id === 'jona-2-3')!.ref).toBe('Jonah 2:2');
  });

  it('passen zu den Büchern der englischen Fragen', () => {
    for (const q of EN_QUESTIONS) {
      const de = getQuestion(q.id, 'de');
      if (WEEK_VERSES.some((v) => v.book === de.book)) {
        expect(EN_WEEK_VERSES.some((v) => v.book === q.book), `${q.id}: ${q.book}`).toBe(true);
      }
    }
    const picks = suggestVerses(
      [
        { book: 'Luke', group: 'evangelien', key: 'a' },
        { book: 'Jonah', group: 'at', key: 'b' },
      ],
      4,
      'en',
    );
    expect(picks).toHaveLength(4);
    expect(picks[0].book).toBe('Luke');
    expect(picks[1].book).toBe('Jonah');
    expect(picks.every((p) => EN_WEEK_VERSES.includes(p))).toBe(true);
  });

  it('kommen auf Englisch in den Kalender', () => {
    const verse = EN_WEEK_VERSES.find((v) => v.id === 'lk-1-37')!;
    const ics = verseCalendar(verse, '20261013', '0730', new Date(Date.UTC(2026, 9, 12)), 'en').replace(/\r\n /g, '');
    expect(ics).toContain('PRODID:-//Bible Bluff//My verse for the week//EN');
    const escaped = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const impulses = dailyImpulses('lk-1-37', 'en');
    expect(impulses).toHaveLength(7);
    expect(ics).toContain(`SUMMARY:${escaped(`Luke 1:37: ${impulses[0]}`)}`);
    expect(ics).toContain('“For nothing spoken by God is impossible.”');
    expect(ics).toContain('(World English Bible)');
    expect(ics).toContain(escaped(`Day 1: ${impulses[0]}`));
    expect(ics).toContain(escaped(`Day 7: ${impulses[6]}`));
    expect(ics).not.toMatch(/[äöüß„]/);
  });
});

const IDS = ['host', 'anna', 'ben'];

function englishGame(settings: Partial<Settings> = {}) {
  const clock = new Clock();
  const rng = seeded(7);
  const ctx = () => ctxFor(clock, IDS, rng);
  let state: RoomState = createRoom(
    { code: 'LAMP7', hostId: 'host', hostName: 'Hannah', tokenHash: 'h-host', plays: true, settings: { rounds: 4, lang: 'en', ...settings } },
    ctx(),
  );
  for (const [i, name] of ['Amara', 'Ben'].entries()) {
    state = joinRoom(state, { playerId: IDS[i + 1], name, tokenHash: `h-${IDS[i + 1]}` }, ctx()).state;
  }
  const g = {
    clock,
    get state() {
      return state;
    },
    act(actor: string, action: Parameters<typeof applyAction>[2]) {
      state = step(state, actor, action, ctx()).state;
      return state;
    },
    run() {
      state = tick(state, ctx()) ?? state;
      return state;
    },
    view(id: string | null) {
      return buildView(state, id, ctx(), 1);
    },
  };
  return g;
}

describe('Englische Räume', () => {
  it('ziehen nur englische Fragen und zeigen sie mit englischem Spickzettel', () => {
    const g = englishGame();
    expect(g.state.settings.lang).toBe('en');
    expect(g.view('host').poolSize).toBe(EN_QUESTIONS.length);
    g.act('host', { type: 'start' });
    for (const id of g.state.game!.questionIds) expect(hasQuestion(id, 'en'), id).toBe(true);
    const q = getQuestion(g.state.game!.round.questionId, 'en');
    expect(g.view('anna').round!.question.prompt).toBe(q.prompt);

    // Ein englischer Bluff, der die Wahrheit trifft, wird abgelehnt – mit englischer Vorlage
    expect(() => g.act('anna', { type: 'bluff', text: q.answer })).toThrowError(expect.objectContaining({ code: 'too_close' }));
    g.act('host', { type: 'skipPhase' });
    g.act('host', { type: 'skipPhase' });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.game!.phase).toBe('scores');
    expect(g.view('host').round!.talk).toBe(EN_TALK[q.id]);
  });

  it('stellen die Herzensrunde, die Auszeichnungen und die Entdeckungen auf Englisch', () => {
    const g = englishGame();
    g.act('host', { type: 'start' });
    for (let guard = 0; guard < 40 && !g.state.game!.phase.startsWith('heart'); guard++) g.act('host', { type: 'skipPhase' });
    const heart = g.view('anna').heart!;
    expect(HEART_QUESTIONS.map((h) => translate('en', h))).toContain(heart.question);
    g.act('anna', { type: 'heart', text: 'That he noticed the widow.' });
    g.act('host', { type: 'skipPhase' });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.status).toBe('finished');
    const final = g.view('host').final!;
    for (const d of final.discoveries) expect(d.prompt).toBe(getQuestion(d.questionId, 'en').prompt);
    for (const a of final.awards) expect(a.title).not.toMatch(/[äöüß]|Meister|finder|Seele/);
    const recap = buildRecap(g.state, 'abcdefghjk');
    expect(recap.lang).toBe('en');
    expect(recap.items.map((i) => i.prompt)).toEqual(final.discoveries.map((d) => d.prompt));
  });

  it('nehmen deutsche Räume von früher weiter als deutsch', () => {
    const clock = new Clock();
    const state = createRoom({ code: 'BROT3', hostId: 'host', hostName: 'Rahel', tokenHash: 'h', plays: true }, ctxFor(clock, ['host']));
    expect(state.settings.lang).toBe('de');
    expect(() => createRoom({ code: 'X', hostId: 'h', hostName: 'R', tokenHash: 'h', plays: true, settings: { lang: 'fr' as never } }, ctxFor(clock, ['h']))).toThrowError(
      expect.objectContaining({ code: 'bad_settings' }),
    );
  });

  it('bekommen englische Raumcodes', () => {
    const rng = seeded(3);
    for (let i = 0; i < 30; i++) {
      expect(randomCode(rng, 1, 'en')).toMatch(/^(LAMP|BREAD|FISH|JAR|SALT|STAR|DOVE|TENT|CLOAK|ANCHOR|BOAT|NET|FIG|OLIVE|SHEEP|LAMB|PALM|WELL|HARP|CROWN|TORCH|SCROLL|SEAL|HONEY|CEDAR|PEARL|HILL|BASKET|RING|DONKEY|CAMEL|EAGLE|GARDEN|FIELD|SEED|FLOUR|INK|QUILL|LETTER|SAIL|HARBOUR|ISLAND|CLOUD|RAIN|LIGHT|FIRE|WINE|STONE|RIVER|TOWER)[2-9]$/);
      expect(randomCode(rng).length).toBeLessThanOrEqual(10);
    }
  });
});

function api() {
  const clock = new Clock();
  const handle = createApi({ store: new MemoryStore(), now: () => clock.now, rng: seeded(11) });
  const call = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await handle(
      new Request(`http://test${path}`, {
        method,
        headers: { 'content-type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    const text = await res.text();
    return { status: res.status, headers: res.headers, text, body: res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : null };
  };
  return { clock, call };
}

describe('Englische API', () => {
  it('meldet Fehler in der Sprache der App', async () => {
    const t = api();
    const de = await t.call('POST', '/api/rooms/NIRGENDS7/join', { name: 'Hannah' });
    expect(de.body.error.message).toBe('Diesen Raum gibt es nicht (mehr). Prüfe den Code.');
    const en = await t.call('POST', '/api/rooms/NIRGENDS7/join', { name: 'Hannah' }, { 'x-lang': 'en' });
    expect(en.body.error).toEqual({ code: 'not_found', message: 'This room doesn’t exist (any more). Check the code.' });

    // Meldungen mit Platzhaltern
    const room = (await t.call('POST', '/api/rooms', { name: 'Hannah', settings: { lang: 'en' } })).body;
    const taken = await t.call('POST', `/api/rooms/${room.code}/join`, { name: 'Hannah' }, { 'x-lang': 'en' });
    expect(taken.body.error.message).toMatch(/^“Hannah” (is already here|isn’t connected right now)/);
    const unknownLang = await t.call('GET', '/api/rooms/X', undefined, { 'x-lang': 'fr' });
    expect(unknownLang.body.error.message).toBe('Diesen Raum gibt es nicht (mehr). Prüfe den Code.');
  });

  it('eröffnet englische Räume und zählt den englischen Pool', async () => {
    const t = api();
    const room = (await t.call('POST', '/api/rooms', { name: 'Hannah', settings: { lang: 'en' } })).body;
    expect(room.view.settings.lang).toBe('en');
    expect(room.code).toMatch(/^(LAMP|BREAD|FISH|JAR|SALT|STAR|DOVE|TENT|CLOAK|ANCHOR|BOAT|NET|FIG|OLIVE|SHEEP|LAMB|PALM|WELL|HARP|CROWN|TORCH|SCROLL|SEAL|HONEY|CEDAR|PEARL|HILL|BASKET|RING|DONKEY|CAMEL|EAGLE|GARDEN|FIELD|SEED|FLOUR|INK|QUILL|LETTER|SAIL|HARBOUR|ISLAND|CLOUD|RAIN|LIGHT|FIRE|WINE|STONE|RIVER|TOWER)\d+$/);
    const german = (await t.call('POST', '/api/rooms', { name: 'Rahel' })).body;
    expect(german.view.settings.lang).toBe('de');

    const pool = (await t.call('GET', '/api/pool?lang=en')).body;
    const total = pool.categories.reduce((n: number, c: { questions: number; gaps: number }) => n + c.questions + c.gaps, 0);
    expect(total).toBe(EN_QUESTIONS.length);
    const dePool = (await t.call('GET', '/api/pool')).body;
    expect(dePool.categories.reduce((n: number, c: { questions: number; gaps: number }) => n + c.questions + c.gaps, 0)).toBe(QUESTIONS.length);
  });

  it('liefert den Kalender auf Englisch', async () => {
    const t = api();
    const res = await t.call('GET', '/api/kalender?vers=jona-2-3&ab=20261013&zeit=2000&lang=en');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe('inline; filename="my-verse-for-the-week.ics"');
    expect(res.text.replace(/\r\n /g, '')).toContain('SUMMARY:Jonah 2:2: ');
    const de = await t.call('GET', '/api/kalender?vers=jona-2-3&ab=20261013&zeit=2000');
    expect(de.text.replace(/\r\n /g, '')).toContain('SUMMARY:Jona 2\\,3: ');
  });
});

const index = readFileSync(new URL('../src/client/index.html', import.meta.url), 'utf8');
const meta = (html: string, key: string) => new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];

describe('Englische Link-Vorschau', () => {
  it('lädt mit englischen Texten und eigenem Bild ein', () => {
    const html = invitePreview(index, 'LAMP7', 'https://biblebluff.de', 'en');
    expect(html).toContain('<html lang="en">');
    expect(meta(html, 'og:locale')).toBe('en_GB');
    expect(meta(html, 'og:title')).toBe('You’re invited – room LAMP7');
    expect(meta(html, 'og:description')).toContain('Tap to join');
    expect(meta(html, 'og:image')).toBe('https://biblebluff.de/og-invite-en.jpg');
    const home = homePreview(index, 'https://biblebluff.de', 'en');
    expect(meta(home, 'og:title')).toBe('Bible Bluff – the Bible party game for your phone');
    expect(meta(home, 'og:image')).toBe('https://biblebluff.de/og-en.jpg');
    for (const page of [html, home]) expect(meta(page, 'og:description')).not.toMatch(/[äöüß]/);
  });

  it('gibt englischen Startseiten- und Entdeckungen-Links die englische Vorschau', async () => {
    const calls: string[] = [];
    const env = {
      DB: {} as never,
      ASSETS: {
        async fetch(request: Request) {
          calls.push(new URL(request.url).pathname);
          return new Response(index, { headers: { 'content-type': 'text/html; charset=utf-8' } });
        },
      },
    };
    const get = async (path: string) => (await worker.fetch(new Request(`https://biblebluff.de${path}`), env)).text();
    expect(meta(await get('/?lang=en'), 'og:title')).toBe('Bible Bluff – the Bible party game for your phone');
    expect(meta(await get('/e/abcdefghjk?lang=en'), 'og:image')).toBe('https://biblebluff.de/og-en.jpg');
    expect(meta(await get('/r/lamp7?lang=en'), 'og:title')).toBe('You’re invited – room LAMP7');
    // Deutsche Entdeckungen-Seiten bleiben unverändert
    expect(await get('/e/abcdefghjk')).toBe(index);
    expect(calls.at(-1)).toBe('/e/abcdefghjk');
    const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
    expect(toml).toMatch(/run_worker_first = \[[^\]]*"\/e\/\*"/);
  });
});
