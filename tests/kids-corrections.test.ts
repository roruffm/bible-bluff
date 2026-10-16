import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsLastScoredIndex, kidsScores, updateKidsGame, type KidsGame, type KidsResult } from '../src/shared/kids-game';
import { PROFESSOR_INTERJECTIONS } from '../src/shared/professor-interjections';

function scored(result: KidsResult = 'none'): KidsGame {
  const game = createKidsGame();
  return { ...game, phase: 'revealed', results: game.results.map((_, index) => index === 0 ? result : null) };
}
describe('Kids-Wertung korrigieren', () => {
  it('ersetzt Punkte, ohne eine weitere Runde oder weitere Professor-Punkte zu zählen', () => {
    let game = scored();
    for (const [action, points] of [['correct-last',10],['participated-last',5],['none-last',0]] as const) {
      game = updateKidsGame(game, action, 0);
      expect(kidsScores(game)).toMatchObject({ team: points, professor: 7, playedRounds: 1 });
      expect(game.phase).toBe('revealed');
    }
    expect(updateKidsGame(game, 'none-last', 0)).toBe(game);
    const empty = createKidsGame();
    expect(kidsLastScoredIndex(empty)).toBe(-1);
    expect(updateKidsGame(empty, 'correct-last', 0)).toBe(empty);
  });
  it('korrigiert nach dem Weitergehen nur die vorherige Aufgabe, ohne den Timer zu verändern', () => {
    const reading = updateKidsGame(scored(), 'next', 0);
    const moving = updateKidsGame(reading, 'start', 100);
    const corrected = updateKidsGame(moving, 'correct-last', 1000);
    expect(corrected).toMatchObject({ index: 1, phase: 'moving', deadline: 30100, remainingMs: 30000 });
    expect(corrected.results[0]).toBe('correct'); expect(corrected.results[1]).toBeNull();
    expect(kidsScores(corrected)).toMatchObject({ team: 10, professor: 7, playedRounds: 1 });
  });
  it('korrigiert das Finale und einen vorzeitigen Abschluss, ohne die Show erneut zu starten', () => {
    const base = createKidsGame();
    const final: KidsGame = { ...base, index: 9, phase: 'finished', results: Array(10).fill('none') };
    const corrected = updateKidsGame(final, 'correct-last', 0);
    expect(corrected.phase).toBe('finished'); expect(corrected.index).toBe(9);
    expect(kidsScores(corrected)).toMatchObject({ team: 10, bonus: 10, professor: 73, playedRounds: 10 });
    const early = { ...scored(), index: 1, phase: 'finished' as const };
    expect(updateKidsGame(early, 'correct-last', 0).results[1]).toBeNull();
  });
});
describe('Freie Professor-Ansagen', () => {
  it('hebt einen vorgemerkten Countdown bei Pause auf und meldet ihn nach Fortsetzen nicht mehr als aktiv', () => {
    let game=createKidsGame();
    game={...game,phase:'reading'};
    game=updateKidsGame(game,'start',1000);
    game=updateKidsGame(game,'interjection:signal-countdown',2000);
    expect(game.voicePlaying).toBe(true);
    game=updateKidsGame(game,'pause',5000);
    expect(game).toMatchObject({phase:'paused',remainingMs:26000,deadline:null,voicePlaying:false,voiceCue:null});
    game=updateKidsGame(game,'resume',10000);
    expect(game).toMatchObject({phase:'moving',deadline:36000,voicePlaying:false,voiceCue:null});
  });
  it('startet jeden Spruch in jeder Phase nur manuell und erhält Spielstand und Zeit', () => {
    const base = createKidsGame();
    for (const phase of ['welcome','chapter','reading','scene','moving','paused','locked','returning','judging','revealed','superbluff','finished'] as const) {
      const game = { ...base, phase, deadline: 30000 };
      for (const clip of PROFESSOR_INTERJECTIONS) {
        const next = updateKidsGame(game, `interjection:${clip.id}`, 0);
        expect(next).toMatchObject({ phase, voiceKind: 'interjection', voiceClip: clip.id, voicePlaying: true, voiceSeq: 1, voiceCue: `${phase}:0`, deadline: 30000 });
        expect(next.results).toBe(game.results);
        expect(next.remainingMs).toBe(game.remainingMs);
        expect(kidsScores(next)).toEqual(kidsScores(game));
        expect(updateKidsGame(next, 'stop-speech', 0).voicePlaying).toBe(false);
      }
    }
  });
});
