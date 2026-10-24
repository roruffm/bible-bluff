import { KIDS_MUSIC_URL } from '../../shared/kids-music';

/** Ein Player am Beamer. Dieselbe Aufnahme läuft durch die Runden und bleibt bei Netzausfall im Speicher. */
export class KidsBackgroundMusic {
  private context: AudioContext | null = null;
  private buffer: Promise<AudioBuffer> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private revision = 0;
  private offset = 0;
  private startedAt = 0;
  private volume = 25;
  private speakers = new Set<symbol>();

  private level() { return this.volume / 100 * (this.speakers.size ? .14 : 1); }
  private adjust() {
    if (!this.context || !this.gain) return;
    const param = this.gain.gain, at = this.context.currentTime;
    param.cancelScheduledValues(at);
    param.setTargetAtTime(this.level(), at, this.speakers.size ? .025 : .25);
  }

  async play(context: AudioContext, volume: number): Promise<void> {
    const revision = ++this.revision;
    this.context = context;
    this.volume = volume;
    this.adjust();
    if (this.source) return;
    if (!this.buffer) {
      const loading = fetch(KIDS_MUSIC_URL).then(response => {
        if (!response.ok) throw new Error('Hintergrundmusik konnte nicht geladen werden. Bitte erneut einschalten.');
        return response.arrayBuffer();
      }).then(bytes => context.decodeAudioData(bytes));
      this.buffer = loading;
      void loading.catch(() => { if (this.buffer === loading) this.buffer = null; });
    }
    const buffer = await this.buffer;
    // Ausschalten, Verlassen oder ein neuer Auftrag während des Ladens darf keinen späten Start auslösen.
    if (revision !== this.revision) return;
    if (context.state !== 'running') throw new Error('Für die Hintergrundmusik bitte den Klang am Beamer einschalten.');
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(context.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    this.offset %= buffer.duration;
    try { source.start(context.currentTime, this.offset); }
    catch (error) { source.disconnect(); gain.disconnect(); throw error; }
    this.source = source;
    this.gain = gain;
    this.startedAt = context.currentTime;
    this.adjust();
  }

  pause(reset = false): void {
    this.revision++;
    const source = this.source, gain = this.gain, context = this.context;
    this.source = null;
    this.gain = null;
    if (source && context) {
      this.offset = (this.offset + context.currentTime - this.startedAt) % source.buffer!.duration;
      gain!.gain.cancelScheduledValues(context.currentTime);
      gain!.gain.setTargetAtTime(0, context.currentTime, .015);
      try { source.stop(context.currentTime + .08); } catch { source.disconnect(); gain!.disconnect(); }
    }
    if (reset) this.offset = 0;
  }

  /** Jede wirkliche Sprachausgabe hält die Musik leise; überlappende Ansagen geben sie erst gemeinsam frei. */
  duck(delaySeconds = 0): () => void {
    const key = Symbol();
    let released = false;
    const activate = () => { if (!released) { this.speakers.add(key); this.adjust(); } };
    const timer = delaySeconds > 0 ? setTimeout(activate, delaySeconds * 1000) : null;
    if (timer === null) activate();
    return () => {
      if (released) return;
      released = true;
      if (timer !== null) clearTimeout(timer);
      this.speakers.delete(key);
      this.adjust();
    };
  }
}

export const kidsBackgroundMusic = new KidsBackgroundMusic();
