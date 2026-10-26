import { KIDS_MUSIC_STAGES, KIDS_MUSIC_TRACKS, kidsMusicUrl, type KidsMusicStage } from '../../shared/kids-music';

/** Ein Player am Beamer, mit einer Aufnahme je Spielphase und weichen Übergängen. */
export class KidsBackgroundMusic {
  private context: AudioContext | null = null;
  private recordings = new Map<KidsMusicStage, Promise<ArrayBuffer>>();
  private buffers = new Map<KidsMusicStage, Promise<AudioBuffer>>();
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private cue: string | null = null;
  private completedCue: string | null = null;
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
  private recording(stage: KidsMusicStage): Promise<ArrayBuffer> {
    let recording = this.recordings.get(stage);
    if (!recording) {
      const loading = fetch(kidsMusicUrl(stage)).then(response => {
        if (!response.ok) throw new Error('Hintergrundmusik konnte nicht geladen werden. Bitte erneut einschalten.');
        return response.arrayBuffer();
      });
      this.recordings.set(stage, loading);
      void loading.catch(() => { if (this.recordings.get(stage) === loading) this.recordings.delete(stage); });
      recording = loading;
    }
    return recording;
  }
  /** Auch ein späterer Phasenwechsel braucht nach der Vorbereitung kein Internet. */
  async preload(): Promise<number> {
    const loaded = await Promise.all(KIDS_MUSIC_STAGES.map(stage => (this.buffers.has(stage) ? Promise.resolve() : this.recording(stage)).then(() => 1, () => 0)));
    return loaded.reduce((sum, count) => sum + count, 0);
  }
  private stopSource(fadeSeconds: number) {
    const source = this.source, gain = this.gain, context = this.context;
    this.source = null; this.gain = null;
    if (!source || !context) return;
    const position = this.offset + context.currentTime - this.startedAt;
    this.offset = source.loop ? position % source.buffer!.duration : Math.min(position, source.buffer!.duration);
    gain!.gain.cancelScheduledValues(context.currentTime);
    gain!.gain.setTargetAtTime(0, context.currentTime, fadeSeconds / 4);
    try { source.stop(context.currentTime + fadeSeconds); } catch { source.disconnect(); gain!.disconnect(); }
  }
  async play(context: AudioContext, volume: number, stage: KidsMusicStage = 'round', cue = stage as string, elapsedSeconds?: number): Promise<void> {
    const revision = ++this.revision;
    if (cue !== this.cue) {
      this.stopSource(.35);
      this.offset = 0; this.cue = cue; this.completedCue = null;
    }
    this.context = context;
    this.volume = volume;
    this.adjust();
    // Lautstärkeänderungen und laufende Timer starten keine zweite Aufnahme.
    if (this.source || this.completedCue === cue) return;
    let loading = this.buffers.get(stage);
    if (!loading) {
      loading = this.recording(stage).then(bytes => { this.recordings.delete(stage); return context.decodeAudioData(bytes); });
      this.buffers.set(stage, loading);
      const decoding = loading;
      void decoding.catch(() => { if (this.buffers.get(stage) === decoding) this.buffers.delete(stage); });
    }
    const buffer = await loading;
    // Weitergehen, Ausschalten oder Verlassen während des Ladens darf keine alte Etappe nachträglich starten.
    if (revision !== this.revision) return;
    if (context.state !== 'running') throw new Error('Für die Hintergrundmusik bitte den Klang am Beamer einschalten.');
    if (elapsedSeconds !== undefined) this.offset = Math.max(0, elapsedSeconds);
    const loop = KIDS_MUSIC_TRACKS[stage].loop;
    if (loop) this.offset %= buffer.duration;
    else if (this.offset >= buffer.duration) { this.completedCue = cue; return; }
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.loop = loop;
    gain.gain.value = 0;
    source.connect(gain); gain.connect(context.destination);
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      if (this.source === source) {
        this.source = null; this.gain = null;
        if (!loop) this.completedCue = cue;
      }
    };
    try { source.start(context.currentTime, this.offset); }
    catch (error) { source.disconnect(); gain.disconnect(); throw error; }
    this.source = source; this.gain = gain; this.startedAt = context.currentTime;
    this.adjust();
  }
  pause(reset = false): void {
    this.revision++;
    this.stopSource(.08);
    if (reset) { this.offset = 0; this.cue = null; this.completedCue = null; }
  }
  /** Überlappende Ansagen geben die Musik erst gemeinsam wieder frei. */
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
      this.speakers.delete(key); this.adjust();
    };
  }
}

export const kidsBackgroundMusic = new KidsBackgroundMusic();
