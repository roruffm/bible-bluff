import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KidsBackgroundMusic } from '../src/client/lib/kids-music';
import { createKidsGame, kidsResumeGame, kidsScores, updateKidsGame } from '../src/shared/kids-game';
import { KIDS_DEFAULT_MUSIC, KIDS_MUSIC_URL } from '../src/shared/kids-music';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';

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
    expect(fetch).toHaveBeenCalledWith(KIDS_MUSIC_URL);
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
});
