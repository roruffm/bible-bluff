import { describe, expect, it } from 'vitest';
import { createKidsGame, updateKidsGame, type KidsGame, type KidsResult } from '../src/shared/kids-game';
import { kidsPresentationMoment } from '../src/client/lib/kids-presentation';

const step = (game: KidsGame, action: Parameters<typeof updateKidsGame>[1]) => updateKidsGame(game, action, 100);
const judge = (game: KidsGame) => (['skip-countdown', 'return', 'ready'] as const).reduce((g, a) => step(g, a), game);

describe('Neue Auftritte auf der Kinderbühne', () => {
  it('ruft jede der drei Gruppen in allen Kapiteln einmal auf, ohne Szenenrückkehr oder Audio-Neustart mitzuzählen', () => {
    let game = step(createKidsGame(), 'next');
    const groups: string[] = [];
    for (let index = 0; index < 9; index++) {
      const reading = game.phase === 'chapter' ? step(game, 'next') : game;
      if (game.phase === 'chapter') expect(kidsPresentationMoment(game, reading)).toEqual({kind:'group',index});
      groups.push(reading.rounds[index].question.group);
      expect(kidsPresentationMoment(reading, step(reading, 'read-answers'))).toBeNull();
      if (reading.rounds[index].question.scene) {
        const scene = step(reading, 'scene');
        expect(kidsPresentationMoment(scene, step(scene, 'end-scene'))).toBeNull();
      }
      const revealed = step(judge(reading), 'correct');
      game = step(revealed, 'next');
      if (game.phase === 'reading') expect(kidsPresentationMoment(revealed, game)).toEqual({kind:'group',index:index+1});
    }
    expect(groups).toEqual(['minis','mittis','maxis','minis','mittis','maxis','minis','mittis','maxis']);
    expect(kidsPresentationMoment(game, step(game, 'next'))).toBeNull();
  });

  it('feiert ausschließlich frisch vergebene Kinderpunkte einschließlich der doppelten Finalpunkte', () => {
    for (const index of [0, 9]) for (const result of ['correct','participated','none'] as KidsResult[]) {
      const judging = {...createKidsGame(),index,phase:'judging' as const};
      const revealed = step(judging, result);
      const points = (result === 'correct' ? 10 : result === 'participated' ? 5 : 0) * (index === 9 ? 2 : 1);
      expect(kidsPresentationMoment(judging, revealed)).toEqual(points ? {kind:'points',index,result,points} : null);
      expect(kidsPresentationMoment(revealed, step(revealed, 'participated-last'))).toBeNull();
    }
  });

  it('lässt die Leuchtlupe beim Kapitelstart und vor dem Superbluff einmal über die Bühne fliegen', () => {
    const chapter = step(createKidsGame(), 'next');
    expect(kidsPresentationMoment(createKidsGame(), chapter)).toEqual({kind:'sweep',index:0});
    const third = {...step(chapter, 'next'), index: 2};
    const nextChapter = step(step(judge(third), 'correct'), 'next');
    expect(nextChapter.phase).toBe('chapter');
    expect(kidsPresentationMoment(step(judge(third), 'correct'), nextChapter)).toEqual({kind:'sweep',index:3});
    const last = {...step(chapter, 'next'), index: 8};
    const revealedLast = step(judge(last), 'correct'), superbluff = step(revealedLast, 'next');
    expect(superbluff.phase).toBe('superbluff');
    expect(kidsPresentationMoment(revealedLast, superbluff)).toEqual({kind:'sweep',index:superbluff.index});
    const reading = step(chapter, 'next');
    expect(kidsPresentationMoment(reading, step(reading, 'back'))).toBeNull();
    expect(kidsPresentationMoment(null, chapter)).toBeNull();
  });

  it('startet nach Neuladen, Rückwärtsgehen und Fortsetzen keine nachträgliche Feier', () => {
    const reading = step(step(createKidsGame(), 'next'), 'next');
    const moving = step(reading, 'start'), paused = step(moving, 'pause');
    const revealed = step(judge(reading), 'correct');
    for (const game of [reading, moving, paused, revealed]) expect(kidsPresentationMoment(null, game)).toBeNull();
    expect(kidsPresentationMoment(moving, step(moving, 'back'))).toBeNull();
    expect(kidsPresentationMoment(paused, step(paused, 'resume'))).toBeNull();
    expect(kidsPresentationMoment(revealed, step(revealed, 'read-question'))).toBeNull();
  });
});
