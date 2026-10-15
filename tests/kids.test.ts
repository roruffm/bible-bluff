import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/server/questions';
import { kidsRoundReaction } from '../src/client/lib/kids-reactions';
import { KIDS_SHOW_QUESTIONS } from '../src/shared/kids-show-questions';
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
  it('gibt genau einen Familienjoker in Kapitel zwei und keine zusätzlichen Punkte', () => {
    let g=reading(); expect(updateKidsGame(g,'joker',0)).toBe(g);
    for(let i=0;i<3;i++) g=updateKidsGame(resolve(g,'correct'),'next',30000);
    g=updateKidsGame(g,'next',30000); const before=kidsScores(g);
    g=updateKidsGame(g,'joker',30000); expect(g.jokerFor).toBe(3); expect(kidsScores(g)).toEqual(before);
    expect(updateKidsGame(g,'joker',30000)).toBe(g);
    expect(updateKidsGame(g,'scene',30000).cueSeq).toBe(g.cueSeq+1);
    expect(kidsPrimaryAction('judging')).toBeNull();
    expect(kidsPrimaryAction('locked')).toBe('return');
  });
});
