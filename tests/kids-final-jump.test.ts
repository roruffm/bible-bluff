import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsCanJumpToFinal, kidsScores, updateKidsGame, type KidsGame, type KidsPhase } from '../src/shared/kids-game';

describe('Direkt ins Kids-Finale', () => {
  it('springt aus jeder regulären Phase und einem vorzeitigen Abschluss, stoppt Zeit und Sprache und erhält die Punkte', () => {
    const phases: KidsPhase[]=['welcome','chapter','reading','scene','moving','paused','locked','returning','judging','revealed','finished'];
    for (const phase of phases) {
      const base=createKidsGame(), index=['welcome','chapter','scene'].includes(phase) ? 0 : 1;
      const game: KidsGame={...base,index,phase,remainingMs:8000,deadline:phase==='moving' || phase==='scene' ? 9000 : null,
        results:base.results.map((_,i)=>i<index ? 'correct' : i===index && phase==='revealed' ? 'participated' : null),
        voiceSeq:5,voicePlaying:true,voiceCue:`${phase}:${index}`};
      expect(kidsCanJumpToFinal(game)).toBe(true);
      const next=updateKidsGame(game,'jump-final',1000);
      expect(next).toMatchObject({index:9,phase:'superbluff',remainingMs:30000,deadline:null,voiceSeq:6,voicePlaying:false,voiceCue:null});
      expect(next.results).toEqual(game.results); expect(next.rounds).toBe(game.rounds);
      expect(kidsScores(next)).toEqual(kidsScores(game));
      expect(updateKidsGame(next,'tick',999999)).toBe(next);
      expect(updateKidsGame(next,'jump-final',1000)).toBe(next);
    }
  });
  it('zählt nach übersprungenen Aufgaben nur gespielte Runden und das Finale', () => {
    const base=createKidsGame();
    let game: KidsGame={...base,index:2,phase:'reading',results:['correct','participated',...Array(8).fill(null)]};
    game=updateKidsGame(game,'jump-final',0);
    expect(kidsScores(game)).toMatchObject({team:15,professor:14,playedRounds:2});
    for (const [action,now] of [['next',0],['start',0],['tick',30000],['return',30000],['ready',30000],['correct',30000],['next',30000]] as const) game=updateKidsGame(game,action,now);
    expect(game.phase).toBe('finished');
    expect(game.results.slice(2,9)).toEqual(Array(7).fill(null));
    expect(kidsScores(game)).toMatchObject({team:25,professor:24,playedRounds:3,bonus:10});
    expect(kidsCanJumpToFinal(game)).toBe(false);
    expect(updateKidsGame(game,'jump-final',30001)).toBe(game);
  });
  it('kann eine vor der Wertung abgeschlossene Finalrunde wieder öffnen, ohne gespielte Finals zu wiederholen', () => {
    const base=createKidsGame();
    const closed: KidsGame={...base,index:9,phase:'finished',results:[...Array(9).fill('correct'),null]};
    expect(updateKidsGame(closed,'jump-final',0)).toMatchObject({index:9,phase:'superbluff'});
    expect(updateKidsGame({...closed,results:Array(10).fill('correct')},'jump-final',0).phase).toBe('finished');
  });
});
