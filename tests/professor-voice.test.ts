import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsScores, updateKidsGame, type KidsGame } from '../src/shared/kids-game';
import { professorVoiceKey } from '../src/shared/professor-voice';

describe('Professor-Aufnahmen', () => {
  it('startet nur durch einen manuellen Sprachbefehl und ändert keine Spielwertung', () => {
    const game=createKidsGame(), spoken=updateKidsGame(game,'speak',0);
    expect(game.voiceSeq ?? 0).toBe(0);
    expect(spoken.voicePlaying).toBe(true);expect(spoken.voiceSeq).toBe(1);
    expect(spoken.voiceCue).toBe('welcome:0');
    expect(kidsScores(spoken)).toEqual(kidsScores(game));expect(spoken.phase).toBe(game.phase);
    const stopped=updateKidsGame(spoken,'stop-speech',0);
    expect(stopped.voicePlaying).toBe(false);expect(stopped.voiceSeq).toBe(2);
    expect(stopped.voiceCue).toBeNull();
    expect(stopped.results).toBe(game.results);expect(stopped.deadline).toBe(game.deadline);
  });
  it('verweist für alle sichtbaren Sprüche auf vorhandene MP3s und überspringt alte Schatztexte', () => {
    const game=createKidsGame();
    const games:KidsGame[]=[game,...[0,3,6].map(index=>({...game,index,phase:'chapter' as const})),{...game,index:9,phase:'superbluff'}, {...game,phase:'finished'}];
    for(let index=0;index<10;index++)for(const result of ['correct','participated','none'] as const) games.push({...game,index,phase:'revealed',results:game.results.map((_,i)=>i<=index ? result : null)});
    games.push({...games[games.length-1],phase:'finished',results:Array(10).fill('correct')});
    for(const state of games){
      const key=professorVoiceKey(state);expect(key).not.toBeNull();
      const bytes=readFileSync(new URL(`../src/client/public/professor-bluff/${key}.mp3`,import.meta.url));
      expect(bytes.length).toBeGreaterThan(1500);expect(bytes.subarray(0,3).toString()==='ID3' || bytes[0]===255).toBe(true);
      expect(['comfort-4','comfort-9']).not.toContain(key);
    }
    for(const phase of ['returning','judging','scene'] as const){const state={...game,phase};expect(professorVoiceKey(state)).toBeNull();expect(updateKidsGame(state,'speak',0)).toBe(state);}
  });
});
