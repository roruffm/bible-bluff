import { existsSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKidsGame, kidsResumeGame, kidsScores, updateKidsGame, type KidsAction, type KidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';
import { PROFESSOR_VOICE_KEYS, professorVoiceKey, professorVoiceUrl } from '../src/shared/professor-voice';
import { clearKidsShow, KIDS_SAVE_TTL, loadKidsShow, saveKidsShow } from '../src/client/lib/kids-saved';

function play(game: KidsGame, steps: [KidsAction, number][]): KidsGame {
  for (const [action, now] of steps) game = updateKidsGame(game, action, now);
  return game;
}
// Eine Show mitten im zweiten Kapitel: drei Aufgaben gewertet, die vierte läuft.
const midShow = () => play(createKidsGame(), [
  ['next', 0], ['next', 0], ['start', 0], ['tick', 30000], ['return', 30000], ['ready', 30000], ['correct', 30000], ['next', 30000],
  ['start', 30000], ['tick', 60000], ['return', 60000], ['ready', 60000], ['participated', 60000], ['next', 60000],
  ['start', 60000], ['tick', 90000], ['return', 90000], ['ready', 90000], ['none', 90000], ['next', 90000], ['next', 90000],
  ['start', 100000],
]);

describe('Kids: Spielstand nach dem Neuladen', () => {
  it('packt und entpackt eine laufende Show ohne Verlust an Punkten, Reihenfolge und Restzeit', () => {
    const game = midShow();
    expect(game).toMatchObject({ index: 3, phase: 'moving', deadline: 130000 });
    const restored = unpackKidsGame(JSON.parse(JSON.stringify(packKidsGame(game, 112000))), 500000)!;
    expect(restored.rounds.map((round) => round.answers)).toEqual(game.rounds.map((round) => round.answers));
    expect(restored.rounds.map((round) => round.correctIndex)).toEqual(game.rounds.map((round) => round.correctIndex));
    expect(restored.results).toEqual(['correct', 'participated', 'none', ...Array(7).fill(null)]);
    expect(kidsScores(restored)).toEqual(kidsScores(game));
    expect(restored).toMatchObject({ phase: 'moving', remainingMs: 18000, deadline: 518000 });
  });

  it('wartet nach dem Neuladen auf die Spielleitung: Countdown angehalten, Szene beendet, Professor still', () => {
    const moving = midShow();
    expect(kidsResumeGame(moving, 112000)).toMatchObject({ phase: 'paused', remainingMs: 18000, deadline: null, voicePlaying: false, voiceCue: null });
    expect(kidsResumeGame(moving, 130000)).toMatchObject({ phase: 'locked', remainingMs: 0, deadline: null });
    const scene = updateKidsGame({ ...createKidsGame(), phase: 'reading' }, 'scene', 0);
    expect(kidsResumeGame(scene, 2000)).toMatchObject({ phase: 'reading', deadline: null });
    const speaking = updateKidsGame(createKidsGame(), 'speak', 0);
    expect(kidsResumeGame(speaking, 0)).toMatchObject({ phase: 'welcome', voicePlaying: false, voiceCue: null, voiceSeq: speaking.voiceSeq });
    const finished = updateKidsGame(moving, 'finish', 0);
    expect(kidsResumeGame(finished, 0)).toMatchObject({ phase: 'finished', results: finished.results });
  });

  it('verwirft fremde, kaputte oder unpassende Spielstände', () => {
    const packed = packKidsGame(createKidsGame(), 0);
    expect(unpackKidsGame(packed, 0)).not.toBeNull();
    expect(unpackKidsGame(null, 0)).toBeNull();
    expect(unpackKidsGame({ ...packed, rounds: packed.rounds.slice(1) }, 0)).toBeNull();
    expect(unpackKidsGame({ ...packed, rounds: [{ ...packed.rounds[0], answers: ['A', 'B', 'C'] }, ...packed.rounds.slice(1)] }, 0)).toBeNull();
    expect(unpackKidsGame({ ...packed, index: 4 }, 0)).toBeNull();
    expect(unpackKidsGame({ ...packed, results: ['correct', ...packed.results.slice(1)] }, 0)).toBeNull();
  });
});

describe('Kids: Sicherung auf dem Gerät', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); }, removeItem: (key: string) => { store.delete(key); } });
    clearKidsShow();
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('stellt eine gesicherte Show angehalten wieder her und schreibt im Countdown höchstens einmal pro Sekunde', () => {
    const game = midShow();
    const writes = vi.spyOn(globalThis.localStorage, 'setItem');
    for (let now = 112000; now < 113000; now += 100) saveKidsShow(game, now);
    expect(writes).toHaveBeenCalledTimes(1);
    const saved = loadKidsShow(115000)!;
    expect(saved.savedAt).toBe(112000);
    expect(saved.game).toMatchObject({ index: 3, phase: 'paused', remainingMs: 18000, deadline: null });
    expect(kidsScores(saved.game)).toEqual(kidsScores(game));
  });

  it('bietet nur frische Shows an und räumt alte oder unlesbare Einträge auf', () => {
    saveKidsShow(createKidsGame(), 1000);
    expect(loadKidsShow(1000 + KIDS_SAVE_TTL)).not.toBeNull();
    expect(loadKidsShow(1001 + KIDS_SAVE_TTL)).toBeNull();
    expect(store.size).toBe(0);
    store.set('bb:kids:show', '{kaputt');
    expect(loadKidsShow(0)).toBeNull();
    expect(store.size).toBe(0);
    saveKidsShow(createKidsGame(), 0);
    clearKidsShow();
    expect(loadKidsShow(0)).toBeNull();
  });

  it('läuft weiter, wenn der Browser nichts speichern darf', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('gesperrt'); }, setItem: () => { throw new Error('gesperrt'); }, removeItem: () => { throw new Error('gesperrt'); } });
    expect(() => saveKidsShow(createKidsGame(), 0)).not.toThrow();
    expect(loadKidsShow(0)).toBeNull();
  });
});

describe('Kids: Aufnahmen zum Vorladen', () => {
  it('kennt jede Aufnahme, die am Beamer erklingen kann, und jede davon liegt als MP3 bereit', () => {
    const files = new Set(readdirSync(new URL('../src/client/public/professor-bluff/', import.meta.url)));
    for (const key of PROFESSOR_VOICE_KEYS) expect(files.has(professorVoiceUrl(key).split('/').pop()!), key).toBe(true);
    expect(new Set(PROFESSOR_VOICE_KEYS).size).toBe(PROFESSOR_VOICE_KEYS.length);
    const game = createKidsGame(), states: KidsGame[] = [game, { ...game, phase: 'finished' }, { ...game, index: 9, phase: 'superbluff' }];
    for (let index = 0; index < 10; index++) {
      states.push({ ...game, index, phase: 'reading' }, { ...game, index, phase: index === 9 ? 'superbluff' : index % 3 === 0 ? 'chapter' : 'paused' });
      for (const result of ['correct', 'none'] as const) states.push({ ...game, index, phase: 'revealed', results: game.results.map((_, i) => i <= index ? result : null) });
    }
    states.push({ ...game, phase: 'finished', results: Array(10).fill('correct') });
    for (const state of states) for (const key of [professorVoiceKey(state), professorVoiceKey(state, 'question')]) if (key) expect(PROFESSOR_VOICE_KEYS, key).toContain(key);
    // Alte Schatztexte werden nie geladen; die Finalaufnahme gehört jetzt zur Offline-Kopie.
    for (const key of ['comfort-4', 'comfort-9']) expect(PROFESSOR_VOICE_KEYS).not.toContain(key);
    expect(PROFESSOR_VOICE_KEYS).toContain('question-9');
    expect(existsSync(new URL('../src/client/public/kids-sw.js', import.meta.url))).toBe(true);
  });
});
