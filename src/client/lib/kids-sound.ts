import type { StoryMotif } from '../../shared/kids-show-questions';
let context: AudioContext | null = null;
export async function enableKidsSound() {
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();
}
/** Kurze, selbst erzeugte Klangbilder; keine Downloads und keine Kinderstimmen. */
export function playKidsScene(motif: StoryMotif) {
  if (!context || context.state !== 'running') return;
  const ctx = context;
  const tone = (frequency: number, at: number, duration: number, type: OscillatorType = 'sine') => {
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at); gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.065, at + .02); gain.gain.exponentialRampToValueAtTime(.001, at + duration); oscillator.connect(gain).connect(ctx.destination); oscillator.start(at); oscillator.stop(at + duration);
  };
  const start = ctx.currentTime;
  if (motif === 'ark' || motif === 'boat') {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .12 * Math.sin(Math.PI * i / data.length);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(); source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 900; source.connect(filter).connect(ctx.destination); source.start();
    if (motif === 'ark') for (let i = 0; i < 4; i++) tone(180, start + i * .4, .12, 'triangle');
  } else if (motif === 'lion') { for (let i = 0; i < 3; i++) tone(105 + i * 12, start + i * .55, .5, 'triangle'); }
  else [523,659,784,659,523].forEach((f, i) => tone(f, start + i * .32, .45));
}
