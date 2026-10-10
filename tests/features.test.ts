import { describe, expect, it } from 'vitest';
import { ALL_CATEGORIES, POINTS_GIFT, POINTS_TRUTH, TALK_STEPS } from '../src/shared/rules';
import { candidatesFromGame } from '../src/server/bluff-pool';
import { applyAction, createRoom, joinRoom, mostMissedQuestion, pickQuestions, step, tick } from '../src/server/engine';
import { QUESTIONS, getQuestion } from '../src/server/questions';
import { talkNotes } from '../src/server/talk';
import type { Ctx, RoomState } from '../src/server/state';
import { buildView } from '../src/server/view';
import { Clock, ctxFor, seeded } from './helpers';

const IDS = ['host', 'anna', 'ben', 'cleo'];
const CLASSIC = { difficulty: 'gemischt' as const, roundType: 'fragen' as const, categories: ALL_CATEGORIES };
/** Deutlich verschiedene Fantasie-Bluffs ohne Zahlen – keine Gefahr, zufällig die Wahrheit zu treffen */
const WHO: Record<string, string> = { host: 'Ein Tukan', anna: 'Viele Kakteen', ben: 'Ein Pinguin', cleo: 'Mehrere Koalas' };
const WHERE = ['im Iglu', 'am Nordpol', 'im Kino', 'auf dem Mond', 'im Zoo'];
const fake = (id: string, r: number) => `${WHO[id]} ${WHERE[r % WHERE.length]}`;

function setup(names = ['Host', 'Anna', 'Ben', 'Cleo'], extra: Partial<Ctx> = {}) {
  const clock = new Clock();
  const rng = seeded(11);
  const ctx = (): Ctx => ({ ...ctxFor(clock, IDS.slice(0, names.length), rng), ...extra });
  let state = createRoom({ code: 'TAUBE3', hostId: 'host', hostName: names[0], tokenHash: 'h-host', plays: true }, ctx());
  for (let i = 1; i < names.length; i++) {
    state = joinRoom(state, { playerId: IDS[i], name: names[i], tokenHash: `h-${IDS[i]}` }, ctx()).state;
  }
  const g = {
    clock,
    ctx,
    get state() {
      return state;
    },
    set state(s: RoomState) {
      state = s;
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
    score(id: string) {
      return state.players.find((p) => p.id === id)!.score;
    },
    /** Alle (außer `skip`) schreiben einen Bluff, alle stimmen für die Wahrheit, dann bis zur Punkte-Phase */
    playRound(r: number, opts: { skip?: string[]; votes?: Record<string, string> } = {}) {
      const active = IDS.slice(0, names.length).filter((id) => !opts.skip?.includes(id));
      for (const id of active) g.act(id, { type: 'bluff', text: fake(id, r) });
      const options = state.game!.round.options!;
      const truth = options.find((o) => o.kind === 'truth')!;
      for (const id of active) g.act(id, { type: 'vote', optionId: opts.votes?.[id] ?? truth.id });
      g.clock.advance(state.game!.deadline! - g.clock.now + 1);
      g.run();
      expect(state.game!.phase).toBe('scores');
    },
  };
  return g;
}

describe('Liebe deinen Nächsten', () => {
  it('verschenkt einmal pro Runde einen eigenen Punkt an eine Mitspielerin', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    expect(() => g.act('anna', { type: 'gift', playerId: 'ben' })).toThrowError(expect.objectContaining({ code: 'phase_over' }));
    g.playRound(1);
    const before = { anna: g.score('anna'), ben: g.score('ben') };
    expect(before.anna).toBe(POINTS_TRUTH);

    expect(() => g.act('anna', { type: 'gift', playerId: 'anna' })).toThrowError(expect.objectContaining({ code: 'bad_target' }));
    expect(() => g.act('anna', { type: 'gift', playerId: 'niemand' })).toThrowError(expect.objectContaining({ code: 'bad_target' }));
    g.act('anna', { type: 'gift', playerId: 'ben' });
    expect(g.score('anna')).toBe(before.anna - POINTS_GIFT);
    expect(g.score('ben')).toBe(before.ben + POINTS_GIFT);
    expect(() => g.act('anna', { type: 'gift', playerId: 'cleo' })).toThrowError(expect.objectContaining({ code: 'already_gifted' }));

    const view = g.view('anna');
    expect(view.round!.myGift).toBe('ben');
    const results = new Map(view.round!.results!.map((r) => [r.playerId, r]));
    expect(results.get('ben')!.giftsIn.map((p) => p.id)).toEqual(['anna']);
    expect(results.get('anna')!.giftOut!.id).toBe('ben');
    expect(g.view('ben').round!.myGift).toBeNull();
  });

  it('braucht mindestens einen eigenen Punkt und gilt nur für Mitspielende', () => {
    const g = setup();
    g.act('host', { type: 'settings', hostPlays: false });
    g.act('host', { type: 'start' });
    const truth = () => g.state.game!.round.options!.find((o) => o.kind === 'truth')!.id;
    for (const id of ['anna', 'ben', 'cleo']) g.act(id, { type: 'bluff', text: fake(id, 0) });
    // Anna fällt auf Bens Bluff herein und bleibt ohne Punkte
    const bens = g.state.game!.round.options!.find((o) => o.authorIds.includes('ben'))!.id;
    g.act('anna', { type: 'vote', optionId: bens });
    g.act('ben', { type: 'vote', optionId: truth() });
    g.act('cleo', { type: 'vote', optionId: truth() });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.game!.phase).toBe('scores');
    expect(g.score('anna')).toBe(0);
    expect(() => g.act('anna', { type: 'gift', playerId: 'ben' })).toThrowError(expect.objectContaining({ code: 'no_points' }));
    expect(() => g.act('host', { type: 'gift', playerId: 'ben' })).toThrowError(expect.objectContaining({ code: 'not_playing' }));
    expect(() => g.act('ben', { type: 'gift', playerId: 'host' })).toThrowError(expect.objectContaining({ code: 'bad_target' }));
  });

  it('kürt am Ende die meiste Nächstenliebe', () => {
    const g = setup(['Host', 'Anna', 'Ben']);
    g.act('host', { type: 'settings', settings: { rounds: 4 } });
    g.act('host', { type: 'start' });
    for (let r = 1; r <= 4; r++) {
      g.playRound(r);
      if (r <= 2) g.act('ben', { type: 'gift', playerId: 'anna' });
      if (r === 3) g.act('anna', { type: 'gift', playerId: 'ben' });
      g.act('host', { type: 'next' });
    }
    expect(g.state.status).toBe('finished');
    const award = g.view('host').final!.awards.find((a) => a.key === 'neighbor')!;
    expect(award).toMatchObject({ title: 'Nächstenliebe', value: 2 });
    expect(award.players.map((p) => p.id)).toEqual(['ben']);
  });
});

describe('Ruhige Minute', () => {
  it('setzt beim Schreiben die laufende Runde aus, ohne dass jemand wartet', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    g.act('anna', { type: 'bluff', text: 'Ein Sack voller Linsen' });
    g.act('anna', { type: 'quiet', on: true });
    expect(g.state.game!.round.bluffs.anna).toBeUndefined();
    expect(g.view('anna').me!.quiet).toBe('now');
    expect(g.view(null).players.find((p) => p.id === 'anna')!.quiet).toBe(true);
    expect(() => g.act('anna', { type: 'bluff', text: 'Doch noch etwas' })).toThrowError(expect.objectContaining({ code: 'quiet' }));
    expect(() => g.act('anna', { type: 'suggest' })).toThrowError(expect.objectContaining({ code: 'quiet' }));

    for (const id of ['host', 'ben', 'cleo']) g.act(id, { type: 'bluff', text: fake(id, 1) });
    // Alle anderen haben abgegeben – die Abstimmung beginnt, ohne auf Anna zu warten
    expect(g.state.game!.phase).toBe('vote');
    const truth = g.state.game!.round.options!.find((o) => o.kind === 'truth')!.id;
    expect(() => g.act('anna', { type: 'vote', optionId: truth })).toThrowError(expect.objectContaining({ code: 'quiet' }));
    for (const id of ['host', 'ben', 'cleo']) g.act(id, { type: 'vote', optionId: truth });
    expect(g.state.game!.phase).toBe('reveal');
    g.act('host', { type: 'skipPhase' });
    const anna = g.view('anna').round!.results!.find((r) => r.playerId === 'anna')!;
    expect(anna).toMatchObject({ quiet: true, truth: 0, bluff: 0 });

    // In der nächsten Runde ist sie automatisch wieder dabei
    g.act('host', { type: 'next' });
    expect(g.view('anna').me!.quiet).toBeNull();
    g.act('anna', { type: 'bluff', text: fake('anna', 2) });
  });

  it('gilt nach der Auflösung für die nächste Runde und lässt sich zurücknehmen', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    g.playRound(1);
    g.act('ben', { type: 'quiet', on: true });
    expect(g.view('ben').me!.quiet).toBe('next');
    expect(g.view(null).players.find((p) => p.id === 'ben')!.quiet).toBe(false);
    g.act('host', { type: 'next' });
    expect(g.view('ben').me!.quiet).toBe('now');
    for (const id of ['host', 'anna', 'cleo']) g.act(id, { type: 'bluff', text: fake(id, 3) });
    expect(g.state.game!.phase).toBe('vote');
    g.act('ben', { type: 'quiet', on: false });
    expect(g.view('ben').me!.quiet).toBeNull();
    const truth = g.state.game!.round.options!.find((o) => o.kind === 'truth')!.id;
    g.act('ben', { type: 'vote', optionId: truth });
    expect(g.state.game!.round.votes.ben).toBe(truth);
  });

  it('gibt es nicht über die letzte Runde hinaus und endet mit der Partie', () => {
    const g = setup(['Host', 'Anna']);
    g.act('host', { type: 'settings', settings: { rounds: 4 } });
    g.act('host', { type: 'start' });
    for (let r = 1; r <= 3; r++) {
      g.playRound(r);
      g.act('host', { type: 'next' });
    }
    g.act('anna', { type: 'quiet', on: true });
    expect(g.state.players.find((p) => p.id === 'anna')!.quietRound).toBe(3);
    g.act('host', { type: 'bluff', text: fake('host', 4) });
    expect(g.state.game!.phase).toBe('vote');
    g.act('host', { type: 'skipPhase' });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.status).toBe('playing');
    expect(g.state.game!.phase).toBe('scores');
    expect(() => g.act('host', { type: 'quiet', on: true })).toThrowError(expect.objectContaining({ code: 'last_round' }));
    g.act('host', { type: 'next' });
    g.act('host', { type: 'playAgain' });
    expect(g.state.players.every((p) => p.quietRound === undefined)).toBe(true);
  });
});

describe('Neues für alle', () => {
  it('zählt gemeldete Fragen je Person einmal und ignoriert Unbekanntes', () => {
    const clock = new Clock();
    const ctx = ctxFor(clock, ['host', 'anna']);
    const ids = QUESTIONS.slice(0, 3).map((q) => q.id);
    let state = createRoom({ code: 'BROT4', hostId: 'host', hostName: 'Host', tokenHash: 'h', plays: true, seen: [...ids, 'gibt-es-nicht', 42] }, ctx);
    state = joinRoom(state, { playerId: 'anna', name: 'Anna', tokenHash: 'a', seen: [ids[0], ids[0]] }, ctx).state;
    expect(state.seenCounts).toEqual({ [ids[0]]: 2, [ids[1]]: 1, [ids[2]]: 1 });
    // Wiedereinstieg zählt nicht doppelt
    const later = { ...ctx, presence: { host: clock.now } };
    state = joinRoom(state, { playerId: 'neu', name: 'Anna', tokenHash: 'a2', reclaim: true, seen: ids }, later).state;
    expect(state.seenCounts![ids[0]]).toBe(2);
    expect(buildView(state, 'host', ctx, 1).freshCount).toBe(QUESTIONS.length - 3);
  });

  it('wählt unbekannte Fragen zuerst, solange genug da sind', () => {
    const fresh = new Set(QUESTIONS.filter((_, i) => i % 7 === 0).map((q) => q.id));
    expect(fresh.size).toBeGreaterThanOrEqual(12);
    const seen = Object.fromEntries(QUESTIONS.filter((q) => !fresh.has(q.id)).map((q) => [q.id, 1]));
    for (let seed = 1; seed <= 20; seed++) {
      const { main, spare } = pickQuestions(CLASSIC, new Set(), 8, seeded(seed), seen);
      for (const id of [...main, ...spare]) expect(fresh.has(id), id).toBe(true);
    }
  });

  it('nimmt bei wenigen unbekannten Fragen zuerst die, die am wenigsten Leute kennen', () => {
    const fresh = QUESTIONS.slice(0, 5).map((q) => q.id);
    const once = new Set(QUESTIONS.slice(5, 40).map((q) => q.id));
    const seen: Record<string, number> = {};
    for (const q of QUESTIONS) if (!fresh.includes(q.id)) seen[q.id] = once.has(q.id) ? 1 : 3;
    const { main, spare } = pickQuestions(CLASSIC, new Set(), 8, seeded(3), seen);
    const all = [...main, ...spare];
    for (const id of fresh) expect(all).toContain(id);
    for (const id of all.filter((id) => !fresh.includes(id))) expect(once.has(id), id).toBe(true);
  });
});

describe('Vom Spiel ins Gespräch', () => {
  function finishedGame() {
    const g = setup(['Host', 'Anna', 'Ben']);
    g.act('host', { type: 'settings', settings: { rounds: 4 } });
    g.act('host', { type: 'start' });
    for (let r = 1; r <= 4; r++) {
      if (r === 3) {
        // Runde 3: alle fallen auf Hausbluffs oder fremde Bluffs herein
        for (const id of ['host', 'anna', 'ben']) g.act(id, { type: 'bluff', text: fake(id, r) });
        const opts = g.state.game!.round.options!;
        for (const id of ['host', 'anna', 'ben']) {
          const wrong = opts.find((o) => o.kind !== 'truth' && !o.authorIds.includes(id))!;
          g.act(id, { type: 'vote', optionId: wrong.id });
        }
        g.clock.advance(g.state.game!.deadline! - g.clock.now + 1);
        g.run();
      } else {
        g.playRound(r);
      }
      if (r === 1) {
        // Spickzettel nur für die Leitung und erst nach der Auflösung
        const qid = g.state.game!.round.questionId;
        expect(g.view('host').round!.talk).toEqual(talkNotes(qid));
        expect(g.view('host').round!.talk).not.toBeNull();
        expect(g.view('anna').round!.talk).toBeNull();
        expect(g.view(null).round!.talk).toBeNull();
      }
      g.act('host', { type: 'next' });
    }
    expect(g.state.status).toBe('finished');
    return g;
  }

  it('startet mit der Frage, bei der die meisten danebenlagen, und führt durch vier Schritte', () => {
    const g = finishedGame();
    const third = g.state.game!.history[2].questionId;
    expect(mostMissedQuestion(g.state.game!)).toBe(third);
    const disc = g.view('anna').final!.discoveries;
    expect(disc[2]).toMatchObject({ questionId: third, voted: 3, missed: 3 });
    expect(disc[0]).toMatchObject({ voted: 3, missed: 0 });

    expect(() => g.act('anna', { type: 'talk' })).toThrowError(expect.objectContaining({ code: 'not_host' }));
    g.act('host', { type: 'talk' });
    let talk = g.view('ben').final!.talk!;
    expect(talk).toMatchObject({ questionId: third, step: 0, ref: getQuestion(third).ref, missed: 3, voted: 3 });
    expect(talk.notes).toEqual(talkNotes(third));
    expect(g.view(null).final!.talk!.questionId).toBe(third);

    g.act('host', { type: 'talkStep', step: TALK_STEPS.length - 1 });
    expect(g.view('ben').final!.talk!.step).toBe(TALK_STEPS.length - 1);
    expect(() => g.act('host', { type: 'talkStep', step: TALK_STEPS.length })).toThrowError(expect.objectContaining({ code: 'bad_step' }));

    // Andere Frage der Partie wählen – fremde Fragen gehen nicht
    const first = g.state.game!.history[0].questionId;
    g.act('host', { type: 'talk', questionId: first });
    talk = g.view('ben').final!.talk!;
    expect(talk).toMatchObject({ questionId: first, step: 0 });
    const foreign = QUESTIONS.find((q) => !g.state.game!.history.some((h) => h.questionId === q.id))!.id;
    expect(() => g.act('host', { type: 'talk', questionId: foreign })).toThrowError(expect.objectContaining({ code: 'bad_question' }));

    g.act('host', { type: 'talkEnd' });
    expect(g.view('ben').final!.talk).toBeNull();
    g.act('host', { type: 'playAgain' });
    expect(() => g.act('host', { type: 'talk' })).toThrowError(expect.objectContaining({ code: 'bad_state' }));
  });
});

describe('Frische Hausbluffs', () => {
  it('merkt sich starke Bluffs ohne Namen und ohne vorhandene Hausbluffs', () => {
    const g = setup();
    g.act('host', { type: 'settings', settings: { rounds: 4 } });
    g.act('host', { type: 'start' });
    const q = getQuestion(g.state.game!.round.questionId);
    g.act('host', { type: 'bluff', text: 'Ein Zelt aus Ziegenhaar und Zebra' });
    g.act('anna', { type: 'bluff', text: 'Bens alter Esel mit Zebra' });
    g.act('ben', { type: 'bluff', text: q.bluffs[0] });
    g.act('cleo', { type: 'bluff', text: 'Drei Kamele und ein Zebra' });
    const opts = g.state.game!.round.options!;
    const by = (id: string) => opts.find((o) => o.authorIds.includes(id))!.id;
    // Host-Bluff: 2 reingelegt · Annas Bluff (mit Namen): 2 reingelegt · Bens Hausbluff: 2 Herzen
    g.act('anna', { type: 'vote', optionId: by('host') });
    g.act('ben', { type: 'vote', optionId: by('host') });
    g.act('cleo', { type: 'vote', optionId: by('anna') });
    g.act('host', { type: 'vote', optionId: by('anna') });
    g.act('host', { type: 'skipPhase' });
    g.act('anna', { type: 'like', optionId: by('ben') });
    g.act('cleo', { type: 'like', optionId: by('ben') });
    g.act('host', { type: 'next' });

    const strong = g.state.game!.history[0].strong!;
    expect(strong.map((s) => s.text).sort()).toEqual(['Ein Zelt aus Ziegenhaar und Zebra', q.bluffs[0]].sort());
    expect(strong.find((s) => s.text.startsWith('Ein Zelt'))).toMatchObject({ fooled: 2, likes: 0 });

    // In die Kandidaten kommt nur, was es noch nicht als Hausbluff gibt
    const candidates = candidatesFromGame(g.state);
    expect(candidates.map((c) => c.text)).toEqual(['Ein Zelt aus Ziegenhaar und Zebra']);
    expect(candidates[0]).toMatchObject({ questionId: q.id, fooled: 2, likes: 0 });
  });

  it('nutzt freigegebene Bluffs als Vorschläge und zum Auffüllen', () => {
    const fresh = 'Ein Korb voller Granatäpfel';
    const g = setup(['Host', 'Anna'], {});
    g.act('host', { type: 'start' });
    const qid = g.state.game!.round.questionId;
    const extraCtx = () => ({ ...g.ctx(), extraBluffs: { [qid]: [fresh] } });
    // Vorschläge gehen möglichst an niemanden doppelt: Sind alle Hausbluffs schon vergeben,
    // ist der freigegebene Bluff an der Reihe.
    const taken = structuredClone(g.state);
    taken.game!.round.suggestions = Object.fromEntries(getQuestion(qid).bluffs.map((b, i) => [`x${i}`, b]));
    expect(step(taken, 'anna', { type: 'suggest' }, extraCtx()).suggestion).toBe(fresh);

    // Mit nur einem Bluff wird aufgefüllt – irgendwann auch mit dem freigegebenen
    let seenFresh = false;
    for (let seed = 1; seed <= 30 && !seenFresh; seed++) {
      let s = step(g.state, 'anna', { type: 'bluff', text: 'Ein ganz eigener Zebra-Bluff' }, extraCtx()).state;
      s = step(s, 'host', { type: 'skipPhase' }, { ...extraCtx(), rng: seeded(seed) }).state;
      seenFresh = s.game!.round.options!.some((o) => o.kind === 'house' && o.text === fresh);
    }
    expect(seenFresh).toBe(true);
  });
});
