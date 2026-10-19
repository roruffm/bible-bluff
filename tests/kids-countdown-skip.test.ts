import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsCanScore, kidsCanSkipCountdown, kidsScores, updateKidsGame, type KidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';

describe('Kids: Countdown überspringen', () => {
  it('beendet vor, während und nach einer Pause die Antwortzeit ohne Punkte oder Lösung vorwegzunehmen', () => {
    for (const index of [1, 9]) for (const phase of ['reading', 'moving', 'paused'] as const) {
      const base = createKidsGame();
      let game: KidsGame = { ...base, phase: 'reading', index, results: base.results.map((_, i) => i === 0 ? 'correct' : null) };
      if (phase !== 'reading') game = updateKidsGame(game, 'start', 2000);
      if (phase === 'paused') game = updateKidsGame(game, 'pause', 3000);
      game = updateKidsGame(game, phase === 'reading' ? 'read-question' : 'interjection:signal-countdown', 3000);
      expect(kidsCanSkipCountdown(game)).toBe(true);
      const before = kidsScores(game), stopped = updateKidsGame(game, 'skip-countdown', 4000);
      expect(stopped).toMatchObject({ phase: 'locked', index, remainingMs: 0, deadline: null,
        voicePlaying: false, voiceCue: null, voiceSeq: (game.voiceSeq ?? 0) + 1 });
      expect(stopped.rounds).toBe(game.rounds);
      expect(stopped.results).toBe(game.results);
      expect(kidsScores(stopped)).toEqual(before);
      expect(kidsCanScore(stopped)).toBe(false);
      expect(updateKidsGame(stopped, 'skip-countdown', 5000)).toBe(stopped);
      expect(updateKidsGame(stopped, 'tick', 100000)).toBe(stopped);
      const restored = unpackKidsGame(packKidsGame(stopped, 4000), 900000)!;
      expect(restored).toMatchObject({ phase: 'locked', remainingMs: 0, deadline: null, voicePlaying: false });
      expect(restored.results).toEqual(game.results);
      expect(updateKidsGame(stopped, 'correct', 5000)).toBe(stopped);
      const ready = updateKidsGame(updateKidsGame(stopped, 'return', 5000), 'ready', 6000);
      const scored = updateKidsGame(ready, 'correct', 7000);
      expect(scored.phase).toBe('revealed');
      expect(kidsScores(scored).team).toBe(before.team + (index === 9 ? 20 : 10));
      expect(scored.results[index]).toBe('correct');
    }
  });

  it('überspringt weder Szenen noch Wertung, Begrüßung oder abgeschlossene Aufgaben', () => {
    const base = createKidsGame();
    for (const phase of ['welcome', 'chapter', 'superbluff', 'scene', 'locked', 'returning', 'judging', 'revealed', 'finished'] as const) {
      const game = { ...base, phase };
      expect(kidsCanSkipCountdown(game)).toBe(false);
      expect(updateKidsGame(game, 'skip-countdown', 1000)).toBe(game);
    }
  });
});
