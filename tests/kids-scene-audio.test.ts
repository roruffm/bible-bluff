import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KIDS_SCENE_VOICES } from '../src/shared/kids-scenes';
import { KIDS_SHOW_QUESTIONS } from '../src/shared/kids-show-questions';

describe('Szenensprache der Forscher', () => {
  const sources: { buffer: unknown; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = [];
  const decode = vi.fn(async () => ({ duration: 10 }));
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); sources.length = 0;
    vi.useFakeTimers(); vi.setSystemTime(0);
    decode.mockImplementation(async () => ({ duration: 10 }));
    vi.stubGlobal('AudioContext', class {
      state = 'running'; currentTime = 40; destination = {};
      decodeAudioData = decode;
      createBufferSource = () => {
        const source = { buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
        sources.push(source); return source;
      };
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  const prepare = async () => {
    const sound = await import('../src/client/lib/kids-sound');
    await sound.enableKidsSound(); return sound;
  };

  it('liefert für jede Forscher-Frage eine eigene MP3-Aufnahme', () => {
    const motifs = KIDS_SHOW_QUESTIONS.filter(q => q.group === 'minis').map(q => q.scene!);
    expect(motifs).toEqual(['ark', 'manger', 'lion']);
    const urls = motifs.map(motif => KIDS_SCENE_VOICES[motif]);
    expect(new Set(urls).size).toBe(3);
    for (const url of urls) {
      const bytes = readFileSync(new URL(`../src/client/public${url}`, import.meta.url));
      expect(bytes.length).toBeGreaterThan(1500);
      expect(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 255).toBe(true);
    }
  });
  it.each(['ark', 'manger', 'lion'] as const)('lädt %s vor und spielt nach Netzausfall aus dem Speicher', async motif => {
    const sound = await prepare(), progress = vi.fn();
    expect(await sound.preloadKidsSceneVoices(progress)).toBe(3);
    expect(progress).toHaveBeenLastCalledWith(3, 3);
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    await sound.playKidsScene(motif, 10_000, new AbortController().signal);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenCalledWith(KIDS_SCENE_VOICES[motif]);
    expect(sources[0].start).toHaveBeenCalledExactlyOnceWith(40, 0, 10);
  });
  it('holt bei langsamem Laden Bild und Sprache an der aktuellen Szenenzeit zusammen', async () => {
    let release!: (value: { duration: number }) => void;
    decode.mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    const sound = await prepare();
    const playing = sound.playKidsScene('ark', 10_000, new AbortController().signal);
    await vi.waitFor(() => expect(decode).toHaveBeenCalledOnce());
    vi.setSystemTime(3400); release({ duration: 10 }); await playing;
    expect(sources[0].start).toHaveBeenCalledExactlyOnceWith(40, 3.4, 6.6);
  });
  it('stoppt beim Stummschalten und setzt an der aktuellen Stelle fort', async () => {
    const sound = await prepare(), controller = new AbortController();
    const stop = await sound.playKidsScene('manger', 10_000, controller.signal);
    controller.abort(); stop();
    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
    vi.setSystemTime(6600);
    await sound.playKidsScene('manger', 10_000, new AbortController().signal);
    expect(sources[1].start).toHaveBeenCalledExactlyOnceWith(40, 6.6, 3.4);
    expect(decode).toHaveBeenCalledOnce();
  });
  it.each(['abort', 'expired'] as const)('startet nach %s während des Ladens keine verspätete Sprache', async reason => {
    let release!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(resolve => { release = resolve; }));
    const sound = await prepare(), controller = new AbortController();
    const playing = sound.playKidsScene('lion', 10_000, controller.signal);
    if (reason === 'abort') controller.abort(); else vi.setSystemTime(10_001);
    release(new Response(new ArrayBuffer(8))); await playing;
    expect(sources).toHaveLength(0);
  });
  it('kann eine fehlgeschlagene Aufnahme erneut laden', async () => {
    const sound = await prepare();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await expect(sound.playKidsScene('ark', 10_000, new AbortController().signal)).rejects.toThrow('offline');
    await sound.playKidsScene('ark', 10_000, new AbortController().signal);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sources[0].start).toHaveBeenCalledOnce();
  });
});
