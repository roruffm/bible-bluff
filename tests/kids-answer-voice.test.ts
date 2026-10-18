import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKidsGame, kidsResumeGame, kidsScores, updateKidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';
import { professorAnswerVoiceKeys, PROFESSOR_VOICE_KEYS } from '../src/shared/professor-voice';

const orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
describe('Antwortmöglichkeiten vorlesen', () => {
  it('liest alle zehn Fragen in jeder möglichen Feldreihenfolge einschließlich ihrer Nummern', () => {
    const base = createKidsGame();
    for (let index=0; index<10; index++) for (const order of orders) {
      const question=base.rounds[index].question, original=[question.answer,...question.distractors];
      const game={...base,index,phase:'reading' as const,rounds:base.rounds.map((round,i)=>i===index ? {...round,answers:order.map(n=>original[n]),correctIndex:order.indexOf(0)} : round)};
      const spoken=updateKidsGame(game,'read-answers',100);
      expect(spoken).toMatchObject({voiceKind:'answers',voicePlaying:true,voiceCue:`reading:${index}`,remainingMs:30000,deadline:null,phase:'reading'});
      expect(kidsScores(spoken)).toEqual(kidsScores(game));
      expect(professorAnswerVoiceKeys(spoken)).toEqual(order.flatMap((answer,field)=>[`answer-number-${field}`,`answer-${index}-${answer}`]));
      for(const key of professorAnswerVoiceKeys(spoken)) {
        expect(PROFESSOR_VOICE_KEYS).toContain(key);
        const bytes=readFileSync(new URL(`../src/client/public/professor-bluff/${key}.mp3`,import.meta.url));
        expect(bytes.length).toBeGreaterThan(1500);
        expect(bytes.subarray(0,3).toString()==='ID3' || bytes[0]===255).toBe(true);
      }
    }
  });
  it('übersteht Speichern und Wiederverbinden, startet nach Neuladen aber nicht von selbst', () => {
    for(const short of [false,true]) {
      const game={...createKidsGame(()=>.5,{short}),phase:'reading' as const};
      const spoken=updateKidsGame(game,'read-answers',0);
      const restored=unpackKidsGame(packKidsGame(spoken,100),200)!;
      expect(restored.voiceKind).toBe('answers');
      expect(professorAnswerVoiceKeys(restored)).toEqual(professorAnswerVoiceKeys(game));
      expect(kidsResumeGame(restored,200).voicePlaying).toBe(false);
      expect(updateKidsGame(spoken,'read-answers',1).voiceSeq).toBe(2);
      expect(updateKidsGame(spoken,'stop-speech',1).voicePlaying).toBe(false);
    }
    const base=createKidsGame();
    for(const phase of ['welcome','chapter','scene','moving','paused','locked','returning','judging','revealed','finished'] as const) {
      const game={...base,phase};
      expect(updateKidsGame(game,'read-answers',0)).toBe(game);
      expect(professorAnswerVoiceKeys(game)).toEqual([]);
    }
  });
});

describe('Abbrechbare Folge am Beamer', () => {
  const sources: {start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended?: ()=>void}[]=[];
  beforeEach(()=>{
    vi.resetModules(); sources.length=0;
    vi.stubGlobal('AudioContext',class {
      state='running'; destination={};
      decodeAudioData=vi.fn(async()=>({duration:1}));
      createBufferSource=()=>{const source={buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:undefined};sources.push(source);return source;};
    });
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})));
  });
  afterEach(()=>vi.unstubAllGlobals());
  const prepare=async()=>{const sound=await import('../src/client/lib/kids-sound');await sound.enableKidsSound();return sound;};
  it('spielt jede Nummer und Antwort nacheinander und meldet nur das Ende der ganzen Folge', async()=>{
    const sound=await prepare(), ended=vi.fn(), keys=['answer-number-0','answer-0-2','answer-number-1','answer-0-0','answer-number-2','answer-0-1'];
    const playing=sound.playProfessorVoiceSequence(keys,new AbortController().signal,ended);
    for(let i=0;i<keys.length;i++) {
      await vi.waitFor(()=>expect(sources).toHaveLength(i+1));
      expect(sources[i].start).toHaveBeenCalledOnce();expect(ended).not.toHaveBeenCalled();sources[i].onended!();
    }
    await playing;expect(ended).toHaveBeenCalledOnce();
    expect(vi.mocked(fetch).mock.calls.map(args=>args[0])).toEqual(keys.map(k=>`/professor-bluff/${k}.mp3`));
  });
  it('stoppt die aktuelle Aufnahme und lässt keine weitere Antwort starten',async()=>{
    const sound=await prepare(), controller=new AbortController(), ended=vi.fn();
    const playing=sound.playProfessorVoiceSequence(['answer-number-0','answer-0-0'],controller.signal,ended);
    await vi.waitFor(()=>expect(sources).toHaveLength(1));
    controller.abort();await playing;
    expect(sources[0].stop).toHaveBeenCalledOnce();expect(sources).toHaveLength(1);expect(ended).not.toHaveBeenCalled();
  });
  it('bleibt nach Abbruch während des Ladens auch bei verspäteter Antwort stumm',async()=>{
    let release!:(response:Response)=>void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(resolve=>{release=resolve;}));
    const sound=await prepare(), controller=new AbortController(), ended=vi.fn();
    const playing=sound.playProfessorVoiceSequence(['answer-number-0','answer-0-0'],controller.signal,ended);
    controller.abort();await playing;release(new Response(new ArrayBuffer(8)));
    await new Promise(resolve=>setTimeout(resolve,0));
    expect(sources).toHaveLength(0);expect(ended).not.toHaveBeenCalled();
  });
});
