import { describe, expect, it } from 'vitest';
import {
  HOST_TAKEOVER_MS,
  POINTS_PER_FOOLED,
  POINTS_TRUTH,
  SCORES_SECONDS,
} from '../src/shared/rules';
import { applyAction, createRoom, joinRoom, pickQuestions, step, tick } from '../src/server/engine';
import { getQuestion, QUESTIONS } from '../src/server/questions';
import { GameError, type RoomState } from '../src/server/state';
import { buildView } from '../src/server/view';
import { Clock, ctxFor, seeded } from './helpers';

const IDS = ['host', 'anna', 'ben', 'cleo'];

function setup(names = ['Host', 'Anna', 'Ben', 'Cleo']) {
  const clock = new Clock();
  const rng = seeded(7);
  const ctx = () => ctxFor(clock, IDS.slice(0, names.length), rng);
  let state = createRoom({ code: 'LAMPE7', hostId: 'host', hostName: names[0], tokenHash: 'h-host', plays: true }, ctx());
  for (let i = 1; i < names.length; i++) {
    state = joinRoom(state, { playerId: IDS[i], name: names[i], tokenHash: `h-${IDS[i]}` }, ctx()).state;
  }
  const act = (actor: string, action: Parameters<typeof applyAction>[2]) => {
    state = step(state, actor, action, ctx()).state;
    return state;
  };
  const run = () => {
    state = tick(state, ctx()) ?? state;
    return state;
  };
  return {
    clock,
    ctx,
    act,
    run,
    get state() {
      return state;
    },
    set state(s: RoomState) {
      state = s;
    },
  };
}

function question(state: RoomState) {
  return getQuestion(state.game!.round.questionId);
}

describe('Raum und Beitritt', () => {
  it('verhindert doppelte Namen und erlaubt den Wiedereinstieg', () => {
    const g = setup(['Host', 'Anna']);
    const ctx = g.ctx();
    expect(() => joinRoom(g.state, { playerId: 'x', name: 'anna', tokenHash: 'h-x' }, ctx)).toThrow(/schon dabei/);

    // Anna ist offline → Wiedereinstieg nur auf ausdrücklichen Wunsch
    const offline = { ...ctx, presence: { host: ctx.now } };
    expect(() => joinRoom(g.state, { playerId: 'x', name: 'Anna', tokenHash: 'h-new' }, offline)).toThrowError(
      expect.objectContaining({ code: 'name_offline' }),
    );
    const re = joinRoom(g.state, { playerId: 'x', name: 'Anna', tokenHash: 'h-new', reclaim: true }, offline);
    expect(re.playerId).toBe('anna');
    expect(re.state.players.find((p) => p.id === 'anna')!.tokenHash).toBe('h-new');
  });

  it('respektiert die Raumsperre', () => {
    const g = setup(['Host', 'Anna']);
    g.act('host', { type: 'lock', locked: true });
    expect(() => joinRoom(g.state, { playerId: 'x', name: 'Neu', tokenHash: 'h-x' }, g.ctx())).toThrow(/gesperrt/);
  });

  it('verlangt mindestens zwei Mitspielende', () => {
    const g = setup(['Host']);
    expect(() => g.act('host', { type: 'start' })).toThrow(/mindestens/);
  });

  it('lässt nur die Spielleitung starten', () => {
    const g = setup(['Host', 'Anna']);
    expect(() => g.act('anna', { type: 'start' })).toThrow(/Spielleitung/);
  });
});

describe('Fragenauswahl', () => {
  it('liefert verschiedene Fragen aus verschiedenen Büchern, höchstens zwei Zahlenfragen', () => {
    for (let seed = 1; seed < 30; seed++) {
      const { main, spare } = pickQuestions('gemischt', new Set(), 8, seeded(seed));
      expect(main).toHaveLength(8);
      expect(spare.length).toBeGreaterThan(0);
      const qs = main.map(getQuestion);
      expect(new Set(qs.map((q) => q.book)).size).toBe(8);
      expect(qs.filter((q) => q.number).length).toBeLessThanOrEqual(2);
      // gemischt: Schwierigkeit steigt an
      const diffs = qs.map((q) => q.difficulty);
      expect([...diffs].sort()).toEqual(diffs);
    }
  });

  it('bevorzugt die gewählte Schwierigkeit', () => {
    const { main } = pickQuestions('leicht', new Set(), 8, seeded(3));
    const easy = main.map(getQuestion).filter((q) => q.difficulty === 1).length;
    expect(easy).toBeGreaterThanOrEqual(4);
  });

  it('vermeidet bereits gespielte Fragen', () => {
    const used = new Set(QUESTIONS.slice(0, 100).map((q) => q.id));
    const { main } = pickQuestions('gemischt', used, 8, seeded(5));
    for (const id of main) expect(used.has(id)).toBe(false);
  });
});

describe('Eine komplette Runde', () => {
  it('läuft von Bluff über Abstimmung und Aufdeckung bis zur Punktevergabe', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    expect(g.state.status).toBe('playing');
    expect(g.state.game!.phase).toBe('write');
    const q = question(g.state);

    // Versehentlich richtige Antwort wird abgelehnt
    expect(() => g.act('anna', { type: 'bluff', text: q.answer })).toThrowError(
      expect.objectContaining({ code: 'too_close' }),
    );

    // Anna und Ben schreiben (fast) dasselbe → wird zusammengeführt
    g.act('anna', { type: 'bluff', text: 'Ein goldener Leuchter' });
    g.act('ben', { type: 'bluff', text: 'ein goldener leuchter.' });
    g.act('cleo', { type: 'bluff', text: 'Drei Kamele und ein Zelt' });
    expect(g.state.game!.phase).toBe('write');

    // Die Antwort darf während der Schreibphase nicht in der Ansicht stehen
    const writeView = JSON.stringify(buildView(g.state, 'anna', g.ctx(), 1));
    expect(writeView).not.toContain(q.answer);
    expect(writeView).not.toContain('Drei Kamele');

    g.act('host', { type: 'bluff', text: 'Eine Harfe aus Zedernholz' });
    // Alle online haben abgegeben → Abstimmung beginnt sofort
    expect(g.state.game!.phase).toBe('vote');

    const options = g.state.game!.round.options!;
    expect(options.filter((o) => o.kind === 'truth')).toHaveLength(1);
    const merged = options.find((o) => o.authorIds.includes('anna'))!;
    expect(merged.authorIds.sort()).toEqual(['anna', 'ben']);
    expect(options).toHaveLength(4); // Wahrheit + 3 Bluff-Gruppen

    // Ansicht verrät weder Urheber noch Wahrheit
    const voteView = buildView(g.state, 'anna', g.ctx(), 2);
    const json = JSON.stringify(voteView);
    expect(json).not.toContain('authorIds');
    expect(json).not.toContain('"truth"');
    expect(voteView.round!.options!.find((o) => o.id === merged.id)!.mine).toBe(true);

    // Eigener Bluff ist tabu
    expect(() => g.act('ben', { type: 'vote', optionId: merged.id })).toThrow(/eigenen/);

    const truth = options.find((o) => o.kind === 'truth')!;
    const cleoOpt = options.find((o) => o.authorIds.includes('cleo'))!;
    g.act('anna', { type: 'vote', optionId: truth.id });
    g.act('ben', { type: 'vote', optionId: cleoOpt.id });
    g.act('cleo', { type: 'vote', optionId: merged.id });
    g.act('host', { type: 'vote', optionId: merged.id });
    expect(g.state.game!.phase).toBe('reveal');

    const results = g.state.game!.round.results!;
    expect(results.anna).toMatchObject({ truth: POINTS_TRUTH, bluff: 2 * POINTS_PER_FOOLED, foundTruth: true });
    expect(results.ben).toMatchObject({ truth: 0, bluff: 2 * POINTS_PER_FOOLED });
    expect(results.cleo).toMatchObject({ bluff: 1 * POINTS_PER_FOOLED, fellFor: merged.id });
    expect(results.host).toMatchObject({ bluff: 0, fellFor: merged.id });

    // Aufdeckung: erst der schwächere, dann der erfolgreichste Bluff, dann die Wahrheit
    const plan = g.state.game!.round.plan!;
    expect(plan.map((s) => s.kind)).toEqual(['intro', 'bluff', 'bluff', 'truth', 'rest']);
    expect(plan[1]).toMatchObject({ optionId: cleoOpt.id });
    expect(plan[2]).toMatchObject({ optionId: merged.id });

    // Punkte erscheinen erst nach der Aufdeckung
    expect(g.state.players.find((p) => p.id === 'anna')!.score).toBe(0);
    g.clock.advance(g.state.game!.deadline! - g.clock.now + 1);
    g.run();
    expect(g.state.game!.phase).toBe('scores');
    const score = (id: string) => g.state.players.find((p) => p.id === id)!.score;
    expect(score('anna')).toBe(4);
    expect(score('ben')).toBe(2);
    expect(score('cleo')).toBe(1);
    expect(score('host')).toBe(0);

    const scoresView = buildView(g.state, 'cleo', g.ctx(), 3);
    expect(scoresView.round!.answer!.ref).toBe(q.ref);
    expect(scoresView.round!.results).toHaveLength(4);

    // Ohne Eingriff geht es automatisch weiter
    g.clock.advance(SCORES_SECONDS * 1000 + 1);
    g.run();
    expect(g.state.game!.roundIndex).toBe(1);
    expect(g.state.game!.phase).toBe('write');
  });

  it('füllt bei wenigen Bluffs mit Hausbluffs auf und schaltet nach Ablauf der Zeit weiter', () => {
    const g = setup(['Host', 'Anna']);
    g.act('host', { type: 'start' });
    g.act('anna', { type: 'bluff', text: 'Ein Sack voller Linsen' });
    g.clock.advance(g.state.settings.writeSeconds * 1000 + 1);
    g.run();
    expect(g.state.game!.phase).toBe('vote');
    const options = g.state.game!.round.options!;
    expect(options.length).toBe(4);
    expect(options.filter((o) => o.kind === 'house').length).toBe(2);

    g.clock.advance(g.state.settings.voteSeconds * 1000 + 1);
    g.run();
    expect(g.state.game!.phase).toBe('reveal');
  });

  it('bietet Vorschläge an, wenn jemandem nichts einfällt', () => {
    const g = setup(['Host', 'Anna']);
    g.act('host', { type: 'start' });
    const q = question(g.state);
    const res = applyAction(g.state, 'anna', { type: 'suggest', n: 0 }, g.ctx());
    expect(q.bluffs).toContain(res.suggestion);
    expect(res.state).toBe(g.state); // Vorschlag ändert nichts am Zustand
  });
});

describe('Spielleitung', () => {
  it('pausiert und verschiebt beim Fortsetzen alle Fristen', () => {
    const g = setup(['Host', 'Anna']);
    g.act('host', { type: 'start' });
    const deadline = g.state.game!.deadline!;
    g.act('host', { type: 'pause' });
    g.clock.advance(10 * 60 * 1000);
    g.run();
    expect(g.state.game!.phase).toBe('write'); // pausiert: keine Weiterschaltung
    g.act('host', { type: 'resume' });
    expect(g.state.game!.deadline).toBe(deadline + 10 * 60 * 1000);
    expect(g.state.paused).toBeNull();
  });

  it('kann Phasen überspringen, Fragen tauschen und die Aufdeckung beschleunigen', () => {
    const g = setup(['Host', 'Anna', 'Ben']);
    g.act('host', { type: 'start' });
    const first = g.state.game!.round.questionId;
    g.act('host', { type: 'swapQuestion' });
    expect(g.state.game!.round.questionId).not.toBe(first);

    g.act('anna', { type: 'bluff', text: 'Ein Sack voller Linsen' });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.game!.phase).toBe('vote');
    const opt = g.state.game!.round.options!.find((o) => o.kind === 'house')!;
    g.act('anna', { type: 'vote', optionId: opt.id });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.game!.phase).toBe('reveal');

    const steps = g.state.game!.round.plan!.length;
    for (let i = 0; i < steps; i++) g.act('host', { type: 'revealNext' });
    expect(g.state.game!.phase).toBe('scores');
    g.act('host', { type: 'next' });
    expect(g.state.game!.roundIndex).toBe(1);
  });

  it('entfernt Störende samt Bluff und sperrt ihr Token', () => {
    const g = setup(['Host', 'Anna', 'Ben']);
    g.act('host', { type: 'start' });
    g.act('ben', { type: 'bluff', text: 'Ein Unsinn' });
    g.act('host', { type: 'kick', playerId: 'ben' });
    expect(g.state.players.map((p) => p.id)).not.toContain('ben');
    expect(g.state.kicked.map((k) => k.tokenHash)).toContain('h-ben');
    expect(g.state.game!.round.bluffs.ben).toBeUndefined();
    expect(() => g.act('anna', { type: 'kick', playerId: 'host' })).toThrow(GameError);
  });

  it('übergibt die Spielleitung, wenn sie lange nicht erreichbar ist', () => {
    const g = setup(['Host', 'Anna']);
    g.clock.advance(HOST_TAKEOVER_MS + 1000);
    const next = tick(g.state, { ...g.ctx(), presence: { anna: g.clock.now } });
    expect(next!.hostId).toBe('anna');
  });

  it('schließt den Raum', () => {
    const g = setup(['Host', 'Anna']);
    g.act('host', { type: 'close' });
    expect(g.state.status).toBe('closed');
    expect(() => g.act('anna', { type: 'leave' })).toThrow(/geschlossen/);
  });
});

describe('Ganze Partie', () => {
  it('endet nach der letzten Runde mit Rangliste, Auszeichnungen und Entdeckungen', () => {
    const g = setup(['Host', 'Anna', 'Ben']);
    g.act('host', { type: 'settings', settings: { rounds: 4 } });
    g.act('host', { type: 'start' });
    for (let r = 0; r < 4; r++) {
      expect(g.state.game!.roundIndex).toBe(r);
      g.act('host', { type: 'bluff', text: `Bluff vom Host Nummer ${r}` });
      g.act('anna', { type: 'bluff', text: `Annas wilde Idee Nummer ${r}` });
      g.act('ben', { type: 'bluff', text: `Bens Erfindung Nummer ${r}` });
      const opts = g.state.game!.round.options!;
      const truth = opts.find((o) => o.kind === 'truth')!;
      const anna = opts.find((o) => o.authorIds.includes('anna'))!;
      g.act('host', { type: 'vote', optionId: anna.id });
      g.act('ben', { type: 'vote', optionId: anna.id });
      g.act('anna', { type: 'vote', optionId: truth.id });
      g.clock.advance(g.state.game!.deadline! - g.clock.now + 1);
      g.run();
      g.act('host', { type: 'next' });
    }
    expect(g.state.status).toBe('finished');
    const view = buildView(g.state, 'ben', g.ctx(), 9);
    expect(view.final!.ranking[0]).toMatchObject({ id: 'anna', score: 4 * (POINTS_TRUTH + 2 * POINTS_PER_FOOLED), rank: 1 });
    expect(view.final!.awards.find((a) => a.key === 'bluffer')!.players.map((p) => p.id)).toEqual(['anna']);
    expect(view.final!.discoveries).toHaveLength(4);

    g.act('host', { type: 'playAgain' });
    expect(g.state.status).toBe('lobby');
    expect(g.state.players.every((p) => p.score === 0)).toBe(true);
    expect(g.state.usedQuestionIds.length).toBe(4);
  });
});
