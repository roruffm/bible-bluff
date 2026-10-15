import { describe, expect, it } from 'vitest';
import { KIDS_SCENE_MS, kidsSceneBeat } from '../src/shared/kids-scenes';
import { QUESTIONS } from '../src/server/questions';
import { kidsRoundReaction } from '../src/client/lib/kids-reactions';
import { KIDS_SHOW_QUESTIONS, kidsAnswerPicture } from '../src/shared/kids-show-questions';
import { createKidsGame, kidsPrimaryAction, kidsScores, updateKidsGame, type KidsGame, type KidsResult } from '../src/shared/kids-game';

const reading = () => updateKidsGame(updateKidsGame(createKidsGame(), 'next', 0), 'next', 0);
function resolve(g: KidsGame, result: KidsResult) {
  for (const action of ['start','tick','return','ready',result] as const) g = updateKidsGame(g, action, action==='start' ? 0 : 30000);
  return g;
}
describe('Die große Bluff-Jagd', () => {
  it('wählt neun altersgerechte Aufgaben und ein gemeinsames Finale aus dem bestehenden Pool', () => {
    expect(KIDS_SHOW_QUESTIONS).toHaveLength(10);
    expect(KIDS_SHOW_QUESTIONS.map(q=>q.group)).toEqual(['minis','mittis','maxis','minis','mittis','maxis','minis','mittis','maxis','all']);
    for (const q of KIDS_SHOW_QUESTIONS) {
      const source = QUESTIONS.find(s=>s.id===q.sourceId);
      expect(source, q.sourceId).toBeDefined(); expect(q.ref).toBe(source!.ref);
      expect(new Set([q.answer,...q.distractors]).size).toBe(3);
      expect(q.pictures).toHaveLength(3); expect(q.direction.length).toBeGreaterThan(30);
      if (q.group==='minis') expect(q.scene).toBeDefined();
    }
    const game=createKidsGame(()=>0); const positions=[0,0,0];
    game.rounds.slice(0,9).forEach(r=>{positions[r.correctIndex]++; expect(r.answers[r.correctIndex]).toBe(r.question.answer);});
    expect(positions).toEqual([3,3,3]);
  });
  it('gibt nach dem Vorlesen 30 Sekunden, pausiert und verlangt den Rückweg vor der Wertung', () => {
    let g=reading();
    expect(updateKidsGame(g,'correct',0)).toBe(g);
    g=updateKidsGame(g,'start',1000); g=updateKidsGame(g,'pause',6500);
    expect(g.remainingMs).toBe(24500); expect(updateKidsGame(g,'tick',999999)).toBe(g);
    g=updateKidsGame(g,'resume',100000);
    expect(updateKidsGame(g,'tick',124499).phase).toBe('moving');
    g=updateKidsGame(g,'tick',124500); expect(g.phase).toBe('locked');
    expect(updateKidsGame(g,'correct',124500)).toBe(g);
    g=updateKidsGame(g,'return',124500); expect(g.phase).toBe('returning');
    expect(updateKidsGame(g,'correct',124500)).toBe(g);
    g=updateKidsGame(g,'ready',124500); g=updateKidsGame(g,'correct',124500);
    expect(g.phase).toBe('revealed'); expect(kidsScores(g).team).toBe(10); expect(kidsScores(g).professor).toBe(7);
    expect(updateKidsGame(g,'correct',124500)).toBe(g);
  });
  it('wertet alle Gruppen gemeinsam, öffnet Kapitel und zählt den Finalangriff genau einmal', () => {
    let g=reading();
    for(let i=0;i<9;i++) {
      g=resolve(g,i<4 ? 'correct':'participated');
      g=updateKidsGame(g,'next',30000);
      if(i===2 || i===5) { expect(g.phase).toBe('chapter'); g=updateKidsGame(g,'next',30000); }
    }
    expect(g.phase).toBe('superbluff'); expect(kidsScores(g).team).toBe(65); expect(kidsScores(g).professor).toBe(73);
    expect(kidsScores(g).pieces).toBe(9); expect(kidsScores(g).groups).toEqual({minis:25,mittis:20,maxis:20});
    g=updateKidsGame(g,'next',30000); expect(kidsScores(g).professor).toBe(73);
    g=resolve(g,'correct'); expect(kidsScores(g).team).toBe(75);
    g=updateKidsGame(g,'next',30000); expect(g.phase).toBe('finished'); expect(kidsScores(g).professor).toBe(73);
  });
  it('hat feste Punkte für alle Resultate und feiert den vollständigen Schatz auch bei einer Niederlage', () => {
    for (const result of ['correct','participated','none'] as const) {
      let g=reading();
      for(let i=0;i<10;i++) {
        g=resolve(g,result);
        g=updateKidsGame(g,'next',30000);
        if(['chapter','superbluff'].includes(g.phase)) g=updateKidsGame(g,'next',30000);
      }
      expect(g.phase).toBe('finished'); const s=kidsScores(g);
      expect(s.professor).toBe(73); expect(s.pieces).toBe(9);
      expect(s.team).toBe(result==='correct' ? 100 : result==='participated' ? 50 : 0);
      expect(Object.values(s.groups).every(n=>n<=30)).toBe(true);
    }
  });
  it('reagiert auf Punkte der aktuellen Runde, auch bei gegenteiligem Gesamtstand', () => {
    const ahead={...createKidsGame(),phase:'revealed' as const,index:1,results:['correct','none',...Array(8).fill(null)] as KidsGame['results']};
    expect(kidsRoundReaction(ahead)).toMatchObject({mood:'kind',points:0});
    const behind={...createKidsGame(),phase:'revealed' as const,index:8,results:[...Array(8).fill('none'),'participated',null] as KidsGame['results']};
    expect(kidsRoundReaction(behind)).toMatchObject({mood:'startled',points:5});
    behind.results[8]='correct';
    expect(kidsRoundReaction(behind)).toMatchObject({mood:'startled',points:10});
  });
  it('behält eindeutige Bilder bei jeder gemischten Antwortreihenfolge', () => {
    for (const value of [0, .25, .5, .75, .999]) for (const round of createKidsGame(()=>value).rounds) {
      const q=round.question;
      expect(new Set(q.pictures).size,q.sourceId).toBe(3);
      for (const answer of round.answers) {
        expect(kidsAnswerPicture(q,answer)).toBe(q.pictures[[q.answer,...q.distractors].indexOf(answer)]);
      }
    }
    expect(kidsAnswerPicture(KIDS_SHOW_QUESTIONS[5],'Ein Rabe')).toBe('raven');
    expect(kidsAnswerPicture(KIDS_SHOW_QUESTIONS[7],'5 Brote und 2 Fische')).toBe('five-breads-two-fish');
    expect(kidsAnswerPicture(KIDS_SHOW_QUESTIONS[2],'Unter einem Kopfkissen')).toBe('coin-pillow');
    expect(()=>kidsAnswerPicture(KIDS_SHOW_QUESTIONS[0],'unbekannt')).toThrow();
  });
  it('startet Szenen nur beim Vorlesen und wartet mit der Wertung auf den Rückweg', () => {
    const g=reading();
    expect(updateKidsGame(g,'scene',0)).toMatchObject({phase:'scene',cueSeq:1,deadline:10000});
    const moving=updateKidsGame(g,'start',0);
    expect(updateKidsGame(moving,'scene',0)).toBe(moving);
    expect(kidsPrimaryAction('judging')).toBeNull();
    expect(kidsPrimaryAction('finished')).toBeNull();
    expect(kidsPrimaryAction('locked')).toBe('return');
  });
  it('zeigt eine Szene zehn Sekunden ohne Antwort-Countdown und lässt sie abbrechen oder wiederholen', () => {
    const before=reading(), scene=updateKidsGame(before,'scene',1000);
    expect(scene.remainingMs).toBe(30000);expect(scene.deadline).toBe(1000+KIDS_SCENE_MS);
    expect(updateKidsGame(scene,'start',2000)).toBe(scene);
    expect(updateKidsGame(scene,'scene',2000)).toBe(scene);
    expect(updateKidsGame(scene,'tick',10999)).toBe(scene);
    const after=updateKidsGame(scene,'tick',11000);
    expect(after).toMatchObject({phase:'reading',deadline:null,remainingMs:30000});
    expect(after.rounds).toBe(before.rounds);expect(kidsScores(after)).toEqual(kidsScores(before));
    expect(updateKidsGame(after,'start',12000).deadline).toBe(42000);
    const replay=updateKidsGame(after,'scene',12000);
    expect(replay).toMatchObject({phase:'scene',cueSeq:2,deadline:22000});
    expect(updateKidsGame(replay,'end-scene',12500)).toMatchObject({phase:'reading',remainingMs:30000,deadline:null});
    const noScene={...after,index:1};expect(updateKidsGame(noScene,'scene',12000)).toBe(noScene);
    expect(kidsSceneBeat(2999)).toBe(0);expect(kidsSceneBeat(3000)).toBe(1);expect(kidsSceneBeat(6500)).toBe(2);
  });

});
