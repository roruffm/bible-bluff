import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Gesprochener Countdown am Beamer', () => {
  const source = { buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
  const createSource = vi.fn(() => source);
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.stubGlobal('AudioContext', class {
      state = 'running'; currentTime = 40; destination = {};
      createBufferSource = createSource;
      decodeAudioData = vi.fn(async () => ({ duration: 5 }));
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  const prepare = async () => {
    const sound = await import('../src/client/lib/kids-sound');
    await sound.enableKidsSound();
    return sound;
  };
  it('merkt fünf bis eins für die letzten fünf Sekunden vor und lässt sich vorher abbrechen', async () => {
    const sound = await prepare(), controller = new AbortController();
    await sound.playProfessorVoice('interjection-signal-countdown', controller.signal, vi.fn(), 30_000);
    expect(source.start).toHaveBeenCalledExactlyOnceWith(65, 0);
    controller.abort();
    expect(source.stop).toHaveBeenCalledOnce();
  });
  it('überspringt bei verspätet geladener Aufnahme die bereits vergangenen Zahlen', async () => {
    let release!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(resolve => { release = resolve; }));
    const sound = await prepare();
    const playing = sound.playProfessorVoice('interjection-signal-countdown', new AbortController().signal, vi.fn(), 30_000);
    vi.setSystemTime(27_000);
    release(new Response(new ArrayBuffer(8)));
    await playing;
    expect(source.start).toHaveBeenCalledExactlyOnceWith(40, 2);
  });
  it('spielt nach Ablauf der Zeit keinen verspäteten Countdown mehr', async () => {
    const sound = await prepare(), ended = vi.fn();
    vi.setSystemTime(30_001);
    await sound.playProfessorVoice('interjection-signal-countdown', new AbortController().signal, ended, 30_000);
    expect(createSource).not.toHaveBeenCalled();
    expect(ended).toHaveBeenCalledOnce();
  });
  it('verhindert auch beim Abbruch während des Downloads einen späteren Start', async () => {
    let release!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(resolve => { release = resolve; }));
    const sound = await prepare(), controller = new AbortController();
    const playing = sound.playProfessorVoice('interjection-signal-countdown', controller.signal, vi.fn(), 30_000);
    controller.abort();
    release(new Response(new ArrayBuffer(8)));
    await playing;
    expect(createSource).not.toHaveBeenCalled();
  });
});
