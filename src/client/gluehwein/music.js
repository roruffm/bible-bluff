// A self-contained, lightly swinging Christmas arrangement: glockenspiel,
// sleigh bells, warm chords and a plucked bass. All sounds are synthesized.
const BPM = 112;
const BEAT = 60 / BPM;
const STEP = BEAT / 4;
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const phraseA = [[76,.5],[76,.5],[76,1],[76,.5],[76,.5],[76,1]];
const phraseB = [[76,.5],[79,.5],[72,.75],[74,.25],[76,2]];
const phraseC = [[77,.5],[77,.5],[77,.75],[77,.25],[77,.5],[76,.5],[76,.5],[76,.25],[76,.25]];
const phraseD = [[76,.5],[74,.5],[74,.5],[76,.5],[74,1],[79,1]];
const phraseEnd = [[79,.5],[79,.5],[77,.5],[74,.5],[72,2]];
const MELODY = new Map();
let position = 0;
for (const [note, beats] of [...phraseA,...phraseB,...phraseC,...phraseD,...phraseA,...phraseB,...phraseC,...phraseEnd]) {
  MELODY.set(Math.round(position * 4), { note, beats });
  position += beats;
}
const CHORDS = [[48,52,55],[48,52,55],[48,53,57],[47,50,55],[48,52,55],[45,48,52],[48,53,57],[47,50,55]];
const BASS = [36,36,41,43,36,33,41,43];

export class WinterMusic {
  constructor({ createContext, every = (fn, ms) => setInterval(fn, ms), cancel = id => clearInterval(id) } = {}) {
    this.createContext = createContext || (() => new (window.AudioContext || window.webkitAudioContext)());
    this.every = every;
    this.cancel = cancel;
    this.enabled = true;
    this.playing = false;
    this.context = null;
    this.master = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.sources = new Set();
  }

  ready() {
    if (!this.enabled) return false;
    try {
      if (!this.context) {
        this.context = this.createContext();
        this.master = this.context.createGain();
        this.master.gain.value = .52;
        this.master.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * .12), this.context.sampleRate);
        const data = this.noise.getChannelData(0);
        let seed = 73;
        for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741823.5 - 1; }
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => this.stop());
      return true;
    } catch { return false; }
  }

  start({ restart = false } = {}) {
    if (!this.ready()) return false;
    if (restart) { this.stop(); this.step = 0; }
    if (this.playing) return true;
    this.playing = true;
    this.nextTime = this.context.currentTime + .045;
    this.schedule();
    this.timer = this.every(() => this.schedule(), 25);
    return true;
  }

  stop() {
    this.playing = false;
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    for (const source of this.sources) { try { source.stop(); } catch {} }
    this.sources.clear();
  }

  setEnabled(value) {
    this.enabled = !!value;
    if (!this.enabled) this.stop();
  }

  track(source, gain, filter = null) {
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect(); gain.disconnect(); filter?.disconnect();
    };
  }

  voice(midi, time, duration, volume, type = 'sine', overtone = 1) {
    const c = this.context, osc = c.createOscillator(), gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency(midi) * overtone, time);
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    osc.connect(gain); gain.connect(this.master);
    this.track(osc, gain);
    osc.start(time); osc.stop(time + duration + .025);
  }

  bell(midi, time, duration = .8, volume = .072) {
    this.voice(midi, time, duration, volume);
    this.voice(midi, time, duration * .48, volume * .21, 'sine', 2.76);
  }

  brush(time, volume = .014, duration = .07, cutoff = 4500) {
    const c = this.context, source = c.createBufferSource(), gain = c.createGain(), filter = c.createBiquadFilter();
    source.buffer = this.noise;
    filter.type = 'highpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.master);
    this.track(source, gain, filter); source.start(time); source.stop(time + duration + .01);
  }

  sleigh(time, accented) {
    this.brush(time, accented ? .023 : .012, .07);
    for (let i = 0; i < 3; i++) this.voice(106 + i * 3, time + i * .004, .085 + i * .018, (accented ? .009 : .005) / (i + 1));
  }

  schedule() {
    if (!this.playing || !this.enabled) return;
    if (this.nextTime < this.context.currentTime - .3) this.nextTime = this.context.currentTime + .03;
    let count = 0;
    while (this.nextTime < this.context.currentTime + .16 && count++ < 8) {
      const step = this.step % 128, bar = Math.floor(step / 16), beat = step % 16;
      const t = this.nextTime + (step % 4 >= 2 ? .018 : 0);
      const melody = MELODY.get(step);
      if (melody) this.bell(melody.note, t, Math.max(.38, melody.beats * BEAT * 1.22));
      if (beat % 2 === 0) this.sleigh(t, beat % 4 === 2);
      if (beat === 4 || beat === 12) this.brush(t, .027, .09, 1500);
      if (beat === 0 || beat === 8) {
        const bass = bar === 7 && beat === 8 ? 36 : BASS[bar] + (beat === 8 ? 7 : 0);
        this.voice(bass, t, BEAT * .72, .065, 'triangle');
      }
      if (beat === 0) for (const note of CHORDS[bar]) this.voice(note, t, BEAT * 3.5, .012, 'triangle');
      if (bar === 7 && beat === 8) for (const note of CHORDS[0]) this.voice(note, t, BEAT * 1.7, .015, 'triangle');
      this.step = (this.step + 1) % 128;
      this.nextTime += STEP;
    }
  }

  effect(hz, duration, type = 'sine', volume = .035, delay = 0) {
    if (!this.ready()) return;
    const midi = 69 + 12 * Math.log2(hz / 440);
    this.voice(midi, this.context.currentTime + delay, duration, volume, type);
  }
}
