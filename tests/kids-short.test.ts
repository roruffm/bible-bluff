import { afterEach, describe, expect, it, vi } from 'vitest';
import { createKidsGame, kidsActionLabel, kidsCanJumpToFinal, kidsCanScore, kidsGroupResults, kidsPrimaryAction, kidsScores, updateKidsGame, type KidsAction, type KidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';
import { KIDS_SHORT_PLAN, kidsClock, kidsShortTiming } from '../src/shared/kids-short';
import { clearKidsShow, loadKidsShow, saveKidsShow } from '../src/client/lib/kids-saved';

function play(game: KidsGame, steps: [KidsAction, number][]): KidsGame {
  for (const [action, now] of steps) {
    const next = updateKidsGame(game, action, now);
    expect(next, `${action} in ${game.phase}`).not.toBe(game);
    game = next;
  }
  return game;
}
/** Eine Aufgabe der Kurzshow: vorlesen, 20 Sekunden, Stopp, sofort werten. */
const task = (at: number, result: 'correct' | 'participated' | 'none' = 'correct'): [KidsAction, number][] => [['start', at], ['tick', at + 20000], [result, at + 30000]];

describe('Kids: Kurzshow', () => {
  it('spielt ein Kapitel und das Finale mit 20 Sekunden und Wertung direkt nach dem Stopp', () => {
    let game = createKidsGame(Math.random, { short: true });
    expect(game).toMatchObject({ short: true, phase: 'welcome', remainingMs: 20000 });
    expect(new Set(game.rounds.slice(0, 3).map((round) => round.correctIndex)).size).toBe(3);
    game = play(game, [['next', 1000], ['next', 1000]]);
    expect(game).toMatchObject({ phase: 'reading', index: 0, startedAt: 1000 });
    expect(kidsActionLabel(game)).toBe('20 Sekunden starten');
    game = play(game, [['start', 2000]]);
    expect(game.deadline).toBe(22000);
    game = play(game, [['tick', 22000]]);
    expect(game.phase).toBe('locked');
    expect(kidsCanScore(game)).toBe(true);
    expect(kidsPrimaryAction(game)).toBeNull();
    expect(updateKidsGame(game, 'return', 22000)).toBe(game);
    game = play(game, [['correct', 25000], ['next', 30000], ...task(30000, 'participated'), ['next', 60000], ...task(60000)]);
    expect(game).toMatchObject({ index: 2, phase: 'revealed' });
    expect(kidsActionLabel(game)).toBe('Zum Superbluff');
    game = play(game, [['next', 90000]]);
    expect(game).toMatchObject({ index: 9, phase: 'superbluff', remainingMs: 20000 });
    game = play(game, [['next', 90000], ...task(90000), ['next', 120000]]);
    expect(game.phase).toBe('finished');
    expect(game.results).toEqual(['correct', 'participated', 'correct', ...Array(6).fill(null), 'correct']);
    expect(kidsScores(game)).toMatchObject({ team: 35, professor: 28, playedRounds: 4, bonus: 10 });
    expect(kidsCanJumpToFinal(game)).toBe(false);
    // Jede Gruppe hat in der Kurzshow genau einen Leuchtpunkt.
    expect(kidsGroupResults(game, 'minis')).toEqual(['correct']);
    expect(kidsGroupResults(game, 'mittis')).toEqual(['participated']);
  });

  it('springt auch hier jederzeit ins Finale und lässt die volle Show unverändert', () => {
    const short = play(createKidsGame(Math.random, { short: true }), [['next', 0], ['next', 0]]);
    expect(updateKidsGame(short, 'jump-final', 0)).toMatchObject({ index: 9, phase: 'superbluff', remainingMs: 20000 });
    const full = play(createKidsGame(), [['next', 0], ['next', 0], ['start', 0], ['tick', 30000]]);
    expect(full).toMatchObject({ phase: 'locked', startedAt: 0 });
    expect(full.short).toBeUndefined();
    expect(kidsCanScore(full)).toBe(false);
    expect(updateKidsGame(full, 'correct', 30000)).toBe(full);
    expect(kidsPrimaryAction(full)).toBe('return');
    expect(kidsActionLabel({ ...full, phase: 'reading' })).toBe('30 Sekunden starten');
  });

  it('übersteht Fernbedienung und Sicherung samt Modus, Restzeit und Missionsstart', () => {
    const game = play(createKidsGame(Math.random, { short: true }), [['next', 10000], ['next', 10000], ['start', 20000]]);
    const packed = JSON.parse(JSON.stringify(packKidsGame(game, 25000)));
    expect(packed).toMatchObject({ short: true, remainingMs: 15000, startedAgoMs: 15000 });
    // Ein anderes Gerät mit verstellter Uhr rechnet mit seiner eigenen Zeit weiter.
    expect(unpackKidsGame(packed, 900000)).toMatchObject({ short: true, phase: 'moving', deadline: 915000, startedAt: 885000 });
    expect(unpackKidsGame({ ...packed, remainingMs: 25000 }, 0)).toBeNull();
    expect(unpackKidsGame({ ...packed, short: 'ja' }, 0)).toBeNull();
    expect(unpackKidsGame({ ...packed, startedAgoMs: -1 }, 0)).toBeNull();
    const fullPacked = packKidsGame({ ...createKidsGame(), index: 4, phase: 'reading', results: ['correct', 'correct', 'correct', 'correct', ...Array(6).fill(null)] }, 0);
    expect(unpackKidsGame(fullPacked, 0)).not.toBeNull();
    expect(unpackKidsGame({ ...fullPacked, short: true }, 0)).toBeNull();

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); }, removeItem: (key: string) => { store.delete(key); } });
    clearKidsShow();
    saveKidsShow(game, 25000);
    expect(loadKidsShow(40000)!.game).toMatchObject({ short: true, phase: 'paused', remainingMs: 15000, startedAt: 10000 });
  });

  it('zeigt im Zeitplan, ob die Spielleitung im Plan liegt', () => {
    const start = play(createKidsGame(Math.random, { short: true }), [['next', 0]]);
    expect(kidsShortTiming({ ...start, phase: 'welcome' }, 0)).toBeNull();
    expect(kidsShortTiming({ ...start, short: undefined }, 0)).toBeNull();
    expect(kidsShortTiming(start, 100000)).toEqual({ step: 0, elapsedSeconds: 100, untilSeconds: 150, behindSeconds: 0 });
    expect(kidsShortTiming({ ...start, index: 1, phase: 'reading' }, 360000)).toEqual({ step: 1, elapsedSeconds: 360, untilSeconds: 300, behindSeconds: 60 });
    expect(kidsShortTiming({ ...start, index: 9, phase: 'revealed' }, 600000)?.step).toBe(3);
    expect(kidsShortTiming({ ...start, phase: 'finished' }, 700000)?.step).toBe(4);
    // Begrüßung (1:30) und Plan ergeben zusammen 15 Minuten.
    expect(90 + KIDS_SHORT_PLAN[KIDS_SHORT_PLAN.length - 1].until).toBe(15 * 60);
    expect(kidsClock(65)).toBe('1:05');
  });
});

afterEach(() => { vi.unstubAllGlobals(); });
