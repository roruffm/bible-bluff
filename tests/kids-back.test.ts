import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsAnswerMs, kidsPreviousStep, kidsScores, updateKidsGame, type KidsAction, type KidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';

const step = (game: KidsGame) => ({ phase: game.phase, index: game.index, results: game.results });
/** Alle Seiten einer Show in Spielreihenfolge; der laufende Countdown zählt nicht als eigene Seite. */
function pages(short: boolean): KidsGame[] {
  let game = createKidsGame(Math.random, { short }), now = 1000;
  const seen = [game];
  const go = (...actions: KidsAction[]) => { for (const action of actions) game = updateKidsGame(game, action, now += 100); seen.push(game); };
  go('next');
  while (game.phase !== 'finished') {
    if (game.phase === 'chapter' || game.phase === 'superbluff') go('next');
    go('start', 'skip-countdown');
    if (!short) { go('return'); go('ready'); }
    go(game.index % 2 ? 'participated' : 'correct');
    go('next');
  }
  return seen;
}

describe('Kids: Zurück zum vorherigen Schritt', () => {
  it('führt in voller Show und Kurzshow von jeder Seite genau auf die vorherige und ergibt gültige Spielstände', () => {
    for (const short of [false, true]) {
      const show = pages(short);
      expect(show.at(-1)!.phase).toBe('finished');
      for (let i = 1; i < show.length; i++) {
        const back = kidsPreviousStep(show[i])!;
        expect(step(back), `${short ? 'Kurzshow' : 'Show'} ${show[i].phase} ${show[i].index}`).toEqual(step(show[i - 1]));
        expect(kidsScores(back)).toEqual(kidsScores(show[i - 1]));
        expect(back).toMatchObject({ deadline: null, voicePlaying: false, voiceCue: null, voiceSeq: (show[i].voiceSeq ?? 0) + 1 });
        expect(back.rounds).toBe(show[i].rounds);
        const restored = unpackKidsGame(packKidsGame(back, 5000), 6000);
        expect(restored && step(restored)).toEqual(step(back));
      }
      expect(kidsPreviousStep(show[0])).toBeNull();
      expect(updateKidsGame(show[0], 'back', 9000)).toBe(show[0]);
    }
  });

  it('setzt einen laufenden, pausierten oder abgelaufenen Countdown samt Szene vor das Vorlesen zurück', () => {
    for (const short of [false, true]) {
      const reading = updateKidsGame(updateKidsGame(createKidsGame(Math.random, { short }), 'next', 0), 'next', 0);
      const moving = updateKidsGame(updateKidsGame(reading, 'start', 1000), 'interjection:signal-countdown', 2000);
      const paused = updateKidsGame(moving, 'pause', 5000);
      const locked = updateKidsGame(moving, 'tick', 1000 + kidsAnswerMs({ short }));
      const scene = updateKidsGame(reading, 'scene', 1000);
      for (const game of [moving, paused, locked, scene]) {
        const back = updateKidsGame(game, 'back', 6000);
        expect(back).toMatchObject({ phase: 'reading', index: 0, remainingMs: kidsAnswerMs({ short }), deadline: null, voicePlaying: false });
        expect(updateKidsGame(back, 'tick', 999999)).toBe(back);
      }
    }
  });

  it('nimmt nur die Wertung der zurückgenommenen Auflösung zurück', () => {
    const show = pages(false), revealed = show.find(game => game.phase === 'revealed' && game.index === 1)!;
    expect(revealed.results.slice(0, 2)).toEqual(['correct', 'participated']);
    const back = updateKidsGame(revealed, 'back', 9000);
    expect(back).toMatchObject({ phase: 'judging', index: 1 });
    expect(back.results.slice(0, 2)).toEqual(['correct', null]);
    expect(kidsScores(back).team).toBe(kidsScores(revealed).team - 5);
  });

  it('kehrt nach einem Sprung ins Finale oder einem vorzeitigen Abschluss zu einer gültigen Seite zurück', () => {
    const show = pages(false), revealed = show.find(game => game.phase === 'revealed' && game.index === 3)!;
    const reading = updateKidsGame(revealed, 'next', 9000);
    expect(step(updateKidsGame(updateKidsGame(reading, 'jump-final', 9100), 'back', 9200))).toEqual(step(revealed));
    const fresh = createKidsGame();
    expect(updateKidsGame(updateKidsGame(fresh, 'jump-final', 100), 'back', 200)).toMatchObject({ phase: 'welcome', index: 0 });
    const finishedEarly = updateKidsGame(updateKidsGame(reading, 'start', 9100), 'finish', 9200);
    const back = updateKidsGame(finishedEarly, 'back', 9300);
    expect(back).toMatchObject({ phase: 'reading', index: 4, remainingMs: kidsAnswerMs({}) });
    expect(unpackKidsGame(packKidsGame(back, 9300), 9400)).not.toBeNull();
  });
});
