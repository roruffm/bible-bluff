import { describe, expect, it } from 'vitest';
import { SAFE_BLUFFS } from '../e2e/bluffs';
import { createApi } from '../src/server/api';
import {
  applyAction,
  createRoom,
  formatGap,
  joinRoom,
  matchingQuestions,
  pickQuestions,
  sanitizeSettings,
  step,
  withSettingDefaults,
} from '../src/server/engine';
import { GAP_QUESTIONS } from '../src/server/lueckentext';
import { QUESTIONS, getQuestion } from '../src/server/questions';
import { buildRecap } from '../src/server/recap';
import { MemoryStore } from '../src/server/store';
import type { RoomState } from '../src/server/state';
import { buildView } from '../src/server/view';
import { ALL_CATEGORIES, CATEGORIES, DEFAULT_SETTINGS, GAP, categoryOf, fillGap } from '../src/shared/rules';
import type { CategoryId, PoolResponse, Settings } from '../src/shared/types';
import { Clock, ctxFor, seeded } from './helpers';

const isGap = (id: string) => getQuestion(id).kind === 'gap';
const filter = (roundType: Settings['roundType'], categories: CategoryId[] = ALL_CATEGORIES) => ({
  difficulty: 'gemischt' as const,
  roundType,
  categories,
});

describe('Lückentexte im Fragenpool', () => {
  it.each(GAP_QUESTIONS.map((q) => [q.id, q] as const))('%s hat genau eine Lücke und passende Satzteile', (_id, q) => {
    expect(q.kind).toBe('gap');
    expect(q.id.startsWith('lt-')).toBe(true);
    expect(q.prompt.split(GAP)).toHaveLength(2);
    // Antwort und Hausbluffs sind schon so geschrieben, wie sie im Satz stehen
    for (const text of [q.answer, ...(q.variants ?? []), ...q.bluffs]) {
      expect(text, text).not.toMatch(/[.!?]$/);
      expect(formatGap(text, q.prompt), text).toBe(text);
      expect(fillGap(q.prompt, text)).not.toContain(GAP);
    }
    expect(categoryOf(q.group), q.id).not.toBeNull();
  });

  it('deckt jede Kategorie mit mindestens fünf Lückentexten ab', () => {
    for (const c of CATEGORIES) {
      const gaps = matchingQuestions({ roundType: 'luecken', categories: [c.id] });
      expect(gaps.length, c.label).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('Antworten für die Lücke', () => {
  const prompt = 'Simson erschlug tausend Philister mit ___.';

  it('schreibt Artikel, Zahlen und Präpositionen mitten im Satz klein, Nomen bleiben groß', () => {
    expect(formatGap('Einem goldenen Hammer', prompt)).toBe('einem goldenen Hammer');
    expect(formatGap('Drei Mühlsteinen.', prompt)).toBe('drei Mühlsteinen');
    expect(formatGap('Menschenfischern', 'Ich will euch zu ___ machen.')).toBe('Menschenfischern');
    expect(formatGap('  einem   Ochsenstachel!! ', prompt)).toBe('einem Ochsenstachel');
  });

  it('nimmt nur den Teil für die Lücke, wenn jemand den ganzen Satz abtippt', () => {
    expect(formatGap('Simson erschlug tausend Philister mit einem Mühlstein.', prompt)).toBe('einem Mühlstein');
    expect(formatGap('mit einem Mühlstein', 'Er schlug zu mit ___ und gewann.')).toBe('mit einem Mühlstein');
    expect(formatGap('einem Stock und gewann', 'Er schlug zu mit ___ und gewann.')).toBe('einem Stock');
  });

  it('beginnt groß, wenn die Lücke am Satzanfang steht', () => {
    expect(formatGap('einem Esel', '___ war schneller.')).toBe('Einem Esel');
  });
});

describe('Kategorien und Rundenart', () => {
  it('filtert nach Kategorie und Rundenart', () => {
    const evangelien = matchingQuestions(filter('gemischt', ['evangelien']));
    expect(evangelien.length).toBeGreaterThan(0);
    for (const q of evangelien) expect(q.group).toBe('evangelien');
    const paulus = matchingQuestions(filter('fragen', ['paulus']));
    expect(new Set(paulus.map((q) => q.group))).toEqual(new Set(['paulus', 'pastoral']));
    for (const q of paulus) expect(q.kind).toBeUndefined();
    for (const q of matchingQuestions(filter('luecken'))) expect(q.kind).toBe('gap');
    expect(matchingQuestions(filter('gemischt'))).toHaveLength(QUESTIONS.length);
  });

  it('mischt etwa jede dritte Runde einen Lückentext ein – nie gleich in der ersten', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { main } = pickQuestions(filter('gemischt'), new Set(), 8, seeded(seed));
      expect(main).toHaveLength(8);
      expect(new Set(main).size).toBe(8);
      const gaps = main.map((id, i) => (isGap(id) ? i : -1)).filter((i) => i >= 0);
      expect(gaps).toHaveLength(3);
      expect(gaps).not.toContain(0);
      expect(main.map(getQuestion).filter((q) => q.number).length).toBeLessThanOrEqual(2);
    }
    expect(pickQuestions(filter('fragen'), new Set(), 8, seeded(2)).main.some(isGap)).toBe(false);
    expect(pickQuestions(filter('luecken'), new Set(), 8, seeded(2)).main.every(isGap)).toBe(true);
  });

  it('nimmt nur Fragen aus den gewählten Kategorien', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { main, spare } = pickQuestions(filter('gemischt', ['apg', 'at']), new Set(), 8, seeded(seed));
      for (const id of [...main, ...spare]) expect(['geschichte', 'at']).toContain(getQuestion(id).group);
    }
  });

  it('spielt weniger Runden, wenn die Auswahl nicht reicht', () => {
    const { main } = pickQuestions(filter('luecken', ['offenbarung']), new Set(), 12, seeded(4));
    const available = matchingQuestions(filter('luecken', ['offenbarung'])).length;
    expect(available).toBeLessThan(12);
    expect(main).toHaveLength(available);
  });

  it('prüft die Einstellungen', () => {
    const base = DEFAULT_SETTINGS;
    expect(sanitizeSettings({ roundType: 'luecken', categories: ['at', 'evangelien'] }, base)).toMatchObject({
      roundType: 'luecken',
      categories: ['evangelien', 'at'],
    });
    expect(() => sanitizeSettings({ categories: [] }, base)).toThrowError(expect.objectContaining({ code: 'bad_settings' }));
    expect(() => sanitizeSettings({ categories: ['psalmen' as CategoryId] }, base)).toThrowError(
      expect.objectContaining({ code: 'bad_settings' }),
    );
    expect(() => sanitizeSettings({ roundType: 'quiz' as Settings['roundType'] }, base)).toThrowError(
      expect.objectContaining({ code: 'bad_settings' }),
    );
  });

  it('ergänzt Räume aus der Zeit davor um die Standardwerte', () => {
    const old = { rounds: 6, difficulty: 'leicht', writeSeconds: 45, voteSeconds: 20 } as Partial<Settings>;
    expect(withSettingDefaults(old)).toEqual({ ...DEFAULT_SETTINGS, rounds: 6, difficulty: 'leicht', writeSeconds: 45, voteSeconds: 20 });
  });
});

describe('Eine Partie mit Lückentexten', () => {
  function setup(settings: Partial<Settings>) {
    const clock = new Clock();
    const rng = seeded(5);
    const ids = ['host', 'anna', 'ben'];
    const ctx = () => ctxFor(clock, ids, rng);
    let state: RoomState = createRoom({ code: 'LAMPE7', hostId: 'host', hostName: 'Hanna', tokenHash: 'h', plays: true, settings }, ctx());
    for (const [i, name] of ['Anna', 'Ben'].entries()) {
      state = joinRoom(state, { playerId: ids[i + 1], name, tokenHash: `h${i}` }, ctx()).state;
    }
    return {
      get state() {
        return state;
      },
      ctx,
      act(actor: string, action: Parameters<typeof applyAction>[2]) {
        state = step(state, actor, action, ctx()).state;
        return state;
      },
    };
  }

  it('setzt eingereichte Antworten in den Satz und zeigt die Lücke in der Sicht', () => {
    const g = setup({ rounds: 4, roundType: 'luecken', categories: ['evangelien'] });
    expect(buildView(g.state, 'host', g.ctx(), 1).poolSize).toBe(matchingQuestions(filter('luecken', ['evangelien'])).length);
    g.act('host', { type: 'start' });
    const q = getQuestion(g.state.game!.round.questionId);
    expect(q.kind).toBe('gap');
    const view = buildView(g.state, 'host', g.ctx(), 2);
    expect(view.round!.question.kind).toBe('gap');
    expect(view.round!.question.prompt).toContain(GAP);

    g.act('host', { type: 'bluff', text: SAFE_BLUFFS.host });
    expect(g.state.game!.round.bluffs.host.text).toBe(SAFE_BLUFFS.host.replace(/^Ein/, 'ein'));
    g.act('anna', { type: 'bluff', text: SAFE_BLUFFS.mirjam });
    g.act('ben', { type: 'bluff', text: SAFE_BLUFFS.anna });
    const truth = g.state.game!.round.options!.find((o) => o.kind === 'truth')!;
    expect(truth.text).toBe(q.answer);
  });

  it('tauscht einen Lückentext gegen einen anderen Lückentext', () => {
    const g = setup({ rounds: 4, roundType: 'gemischt' });
    g.act('host', { type: 'start' });
    // Bis zur ersten Lückentext-Runde vorspulen geht nicht ohne Spiel – stattdessen direkt die Runde setzen
    const game = g.state.game!;
    const gapAt = game.questionIds.findIndex(isGap);
    expect(gapAt).toBeGreaterThan(0);
    game.roundIndex = gapAt;
    game.round = { ...game.round, index: gapAt, questionId: game.questionIds[gapAt] };
    for (let i = 0; i < 3; i++) {
      const before = g.state.game!.round.questionId;
      g.act('host', { type: 'swapQuestion' });
      const after = g.state.game!.round.questionId;
      expect(after).not.toBe(before);
      expect(isGap(after)).toBe(true);
    }
  });

  it('nimmt die Art in die Entdeckungen mit', () => {
    const g = setup({ rounds: 4, roundType: 'luecken' });
    g.act('host', { type: 'start' });
    const state = g.state;
    state.status = 'finished';
    state.game!.history = [{ questionId: state.game!.round.questionId, results: {}, votes: {} } as never];
    const recap = buildRecap(state, 'abcdefghjk');
    expect(recap.items[0].kind).toBe('gap');
  });
});

describe('Schnittstelle', () => {
  it('nennt je Kategorie, wie viele Fragen und Lückentexte es gibt', async () => {
    const api = createApi({ store: new MemoryStore(), now: () => 1, rng: seeded(1) });
    const res = await api(new Request('http://test/api/pool'));
    expect(res.headers.get('cache-control')).toContain('max-age');
    const body = (await res.json()) as PoolResponse;
    expect(body.categories.map((c) => c.id)).toEqual(ALL_CATEGORIES);
    const total = body.categories.reduce((n, c) => n + c.questions + c.gaps, 0);
    expect(total).toBe(QUESTIONS.filter((q) => categoryOf(q.group) !== null).length);
    expect(body.categories.reduce((n, c) => n + c.gaps, 0)).toBe(GAP_QUESTIONS.length);
  });

  it('liefert Räume ohne die neuen Einstellungen mit Standardwerten aus', async () => {
    const clock = new Clock();
    const store = new MemoryStore();
    const api = createApi({ store, now: () => clock.now, rng: seeded(3) });
    const res = await api(
      new Request('http://test/api/rooms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Rahel' }),
      }),
    );
    const { code, token } = (await res.json()) as { code: string; token: string };
    const rec = (await store.load(code))!;
    const old = { ...rec.state, settings: { rounds: 8, difficulty: 'gemischt', writeSeconds: 60, voteSeconds: 30 } as Settings };
    expect(await store.update(code, old, rec.version, clock.now)).toBe(true);
    const view = await api(new Request(`http://test/api/rooms/${code}`, { headers: { authorization: `Bearer ${token}` } }));
    const body = (await view.json()) as { view: { settings: Settings; poolSize: number } };
    expect(body.view.settings).toMatchObject({ roundType: DEFAULT_SETTINGS.roundType, categories: ALL_CATEGORIES });
    expect(body.view.poolSize).toBe(QUESTIONS.length);
  });
});
