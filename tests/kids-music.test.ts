import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KidsBackgroundMusic } from '../src/client/lib/kids-music';
import { createKidsGame, kidsResumeGame, kidsScores, updateKidsGame } from '../src/shared/kids-game';
import { KIDS_DEFAULT_MUSIC, KIDS_MUSIC_TRACKS, KIDS_MUSIC_URLS, kidsMusicCue, kidsMusicStage, kidsMusicUrl } from '../src/shared/kids-music';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';
import { existsSync, readFileSync } from 'node:fs';

describe('Fünf Musikstücke für die Show-Sequenzen', () => {
  it('begleitet Runden und Vorlesen bis zum Countdown, hält Stopp und Wertung still und spielt Outro zur Verabschiedung', () => {
    const game = createKidsGame();
    for (const index of [0, 4, 9]) {
      for (const [phase, expected] of Object.entries({ welcome: null, chapter: 'round', reading: 'round', scene: 'round', moving: 'countdown', locked: null, returning: null, judging: null, revealed: 'reveal', superbluff: 'round', finished: 'outro', paused: null })) {
        expect(kidsMusicStage({ ...game, index, phase: phase as typeof game.phase })).toBe(expected);
      }
    }
    const reading = { ...game, phase: 'reading' as const };
    expect(kidsMusicCue(reading, 'round')).toBe(kidsMusicCue(updateKidsGame(reading, 'read-question', 0), 'round'));
    expect(kidsMusicCue(reading, 'round')).toBe(kidsMusicCue(updateKidsGame(reading, 'read-answers', 0), 'round'));
  });
  it('spielt Erklärungsmusik zu Introvideo und Eltern-Erklärung einschließlich Pause, Neustart und natürlichem Sprachende', () => {
    const game = createKidsGame();
    const video = updateKidsGame(game, 'play-intro', 0);
    expect(kidsMusicStage(video)).toBe('intro');
    expect(kidsMusicStage(updateKidsGame(video, 'pause-intro', 100))).toBeNull();
    expect(kidsMusicCue(updateKidsGame(video, 'restart-intro', 100), 'intro')).not.toBe(kidsMusicCue(video, 'intro'));
    expect(kidsMusicStage(updateKidsGame(video, 'stop-intro', 100))).toBeNull();
    const finale = updateKidsGame(game, 'jump-final', 0);
    const parents = updateKidsGame(finale, 'interjection:finale-parents', 1);
    expect(kidsMusicStage(parents)).toBe('intro');
    expect(kidsMusicStage(updateKidsGame(parents, 'stop-speech', 2))).toBe('round');
    expect(kidsMusicCue(updateKidsGame(parents, 'interjection:finale-parents', 2), 'intro')).not.toBe(kidsMusicCue(parents, 'intro'));
    expect(kidsMusicStage(updateKidsGame(parents, 'next', 2))).toBe('round');
  });
  it('liefert genau die fünf Original-MP3s und wiederholt den Ausklang nicht', () => {
    expect(new Set(KIDS_MUSIC_URLS).size).toBe(5);
    for (const url of KIDS_MUSIC_URLS) {
      const bytes = readFileSync(new URL(`../src/client/public${url}`, import.meta.url));
      expect(bytes.length).toBeGreaterThan(100_000);
      expect(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 255).toBe(true);
    }
    expect(existsSync(new URL('../src/client/public/audio/kids-music/ready-set-solve-01-willkommen.mp3', import.meta.url))).toBe(false);
    expect(KIDS_MUSIC_TRACKS.outro.loop).toBe(false);
  });
});

describe('Musiksteuerung im Spielstand', () => {
  it('ändert nur Musik, bewahrt Timer und Sprache und übersteht Speichern und Fortsetzen', () => {
    let game = updateKidsGame(updateKidsGame(createKidsGame(), 'next', 0), 'next', 0);
    game = updateKidsGame(game, 'start', 100);
    const before = game;
    for (const action of ['music-off', 'music-louder', 'music-louder'] as const) game = updateKidsGame(game, action, 200);
    expect(game.music).toEqual({ enabled: false, volume: 35 });
    expect({ ...game, music: undefined }).toEqual(before);
    const restored = unpackKidsGame(packKidsGame(game, 200), 200)!;
    expect(kidsResumeGame(restored, 200).music).toEqual(game.music);
    expect(kidsScores(restored)).toEqual(kidsScores(before));
  });
  it('akzeptiert alte Spielstände mit ruhigem Startpegel, begrenzt Lautstärke und verwirft ungültige Werte', () => {
    const game = createKidsGame(), packed = packKidsGame(game, 0);
    const legacy = { ...packed, music: undefined };
    expect(unpackKidsGame(legacy, 0)).not.toBeNull();
    expect(packKidsGame(unpackKidsGame(legacy, 0)!, 0).music).toEqual(KIDS_DEFAULT_MUSIC);
    for (const music of [null, { enabled: 'yes', volume: 25 }, { enabled: true, volume: -1 }, { enabled: true, volume: 101 }, { enabled: true, volume: 2.5 }]) {
      expect(unpackKidsGame({ ...packed, music }, 0)).toBeNull();
    }
    let adjusted = game;
    for (let i = 0; i < 30; i++) adjusted = updateKidsGame(adjusted, 'music-louder', 0);
    expect(adjusted.music?.volume).toBe(100);
    for (let i = 0; i < 30; i++) adjusted = updateKidsGame(adjusted, 'music-quieter', 0);
    expect(adjusted.music?.volume).toBe(0);
  });
  it('lässt den Musikschalter auch während des Erklärvideos bedienen', () => {
    const video = updateKidsGame(createKidsGame(), 'play-intro', 0);
    const game = updateKidsGame(video, 'music-off', 1);
    expect(game.music?.enabled).toBe(false);
    expect(game.introVideo).toEqual(video.introVideo);
  });
});

describe('Hintergrundmusik am Beamer', () => {
  const sources: { buffer: AudioBuffer | null; loop: boolean; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = [];
  const gains: { gain: { value: number; cancelScheduledValues: ReturnType<typeof vi.fn>; setTargetAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  let context: AudioContext;
  beforeEach(() => {
    vi.useFakeTimers(); sources.length = 0; gains.length = 0;
    context = { state: 'running', currentTime: 0, destination: {},
      decodeAudioData: vi.fn(async () => ({ duration: 120 })),
      createBufferSource: () => {
        const source = { buffer: null, loop: false, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
        sources.push(source); return source;
      },
      createGain: () => {
        const gain = { gain: { value: 0, cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
        gains.push(gain); return gain;
      },
    } as unknown as AudioContext;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  const level = () => gains.at(-1)!.gain.setTargetAtTime.mock.calls.at(-1)![0];

  it('loopt, ändert Lautstärke ohne Neustart und setzt nach Pause ohne erneuten Download fort', async () => {
    const music = new KidsBackgroundMusic();
    await music.play(context, 25);
    expect(fetch).toHaveBeenCalledWith(kidsMusicUrl('round'));
    expect(sources[0].loop).toBe(true);
    expect(level()).toBe(.25);
    await music.play(context, 35);
    expect(sources).toHaveLength(1);
    expect(level()).toBe(.35);
    Object.assign(context, { currentTime: 132 }); music.pause();
    sources[0].onended!();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
    expect(gains[0].disconnect).toHaveBeenCalledOnce();
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    await music.play(context, 35);
    expect(sources[1].start).toHaveBeenCalledWith(132, 12);
    expect(fetch).toHaveBeenCalledOnce();
    music.pause(true); await music.play(context, 25);
    expect(sources[2].start).toHaveBeenCalledWith(132, 0);
  });
  it('startet nach Ausschalten während eines Downloads nicht verspätet und erzeugt bei gleichzeitigen Aufträgen nur eine Schleife', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(done => { resolve = done; }));
    const music = new KidsBackgroundMusic();
    const pending = music.play(context, 25);
    music.pause();
    resolve(new Response(new ArrayBuffer(8))); await pending;
    expect(sources).toHaveLength(0);
    await Promise.all([music.play(context, 25), music.play(context, 30)]);
    expect(sources).toHaveLength(1);
    expect(level()).toBe(.3);
  });
  it('hält bei überlappenden Ansagen leise und wartet beim Countdown auf den tatsächlichen Sprachbeginn', async () => {
    const music = new KidsBackgroundMusic(); await music.play(context, 25);
    const first = music.duck(), second = music.duck();
    expect(level()).toBeCloseTo(.035);
    first(); first(); expect(level()).toBeCloseTo(.035);
    second(); expect(level()).toBe(.25);
    const countdown = music.duck(25);
    vi.advanceTimersByTime(24_999); expect(level()).toBe(.25);
    vi.advanceTimersByTime(1); expect(level()).toBeCloseTo(.035);
    countdown(); expect(level()).toBe(.25);
    const cancelled = music.duck(25); cancelled();
    vi.advanceTimersByTime(30_000); expect(level()).toBe(.25);
  });
  it('kann nach einem fehlgeschlagenen Download erneut eingeschaltet werden', async () => {
    const music = new KidsBackgroundMusic();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await expect(music.play(context, 25)).rejects.toThrow('offline');
    await music.play(context, 25);
    expect(sources).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('wechselt Etappen mit Überblendung, ignoriert verspätete Downloads und wiederholt den Ausklang nicht', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(done => { resolve = done; }));
    const music = new KidsBackgroundMusic(), welcome = music.play(context, 25, 'intro', 'video:1');
    await music.play(context, 25, 'round', '0:round');
    resolve(new Response(new ArrayBuffer(8))); await welcome;
    expect(sources).toHaveLength(1);
    await music.play(context, 25, 'countdown', '0:countdown', 12);
    expect(sources[0].stop).toHaveBeenCalledWith(.35);
    expect(sources[1].start).toHaveBeenCalledWith(0, 12);
    await music.play(context, 25, 'outro', '9:outro');
    expect(sources[2].loop).toBe(false);
    sources[2].onended!();
    await music.play(context, 30, 'outro', '9:outro');
    expect(sources).toHaveLength(3);
  });
  it('lädt alle Etappen vor und kann nach Netzausfall in einen noch nicht gespielten Abschnitt wechseln', async () => {
    const music = new KidsBackgroundMusic();
    expect(await music.preload()).toBe(5);
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    await music.play(context, 25, 'intro', 'video:1');
    await music.play(context, 25, 'round', '9:round');
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(sources).toHaveLength(2);
  });
});
