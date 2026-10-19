import { KIDS_SCENE_MS, type KidsSceneMotif } from '../../shared/kids-scenes';
import { PROFESSOR_VOICE_KEYS } from '../../shared/professor-voice';
let context: AudioContext | null = null;
export async function enableKidsSound() {
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();
  if (context.state !== 'running') throw new Error('Klang nicht verfügbar');
}

const professorRecordings = new Map<string, Promise<ArrayBuffer>>();
const professorBuffers = new Map<string, Promise<AudioBuffer>>();
/** Lädt eine Aufnahme einmal und hält sie bis zum ersten Abspielen bereit. Fehlschläge dürfen erneut laden. */
function professorRecording(key: string): Promise<ArrayBuffer> {
  let bytes = professorRecordings.get(key);
  if (!bytes) {
    bytes = fetch(`/professor-bluff/${key}.mp3`).then(response => {
      if (!response.ok) throw new Error('Diese Professor-Aufnahme konnte nicht geladen werden.');
      return response.arrayBuffer();
    });
    professorRecordings.set(key, bytes);
    const loading = bytes;
    void loading.catch(() => { if (professorRecordings.get(key) === loading) professorRecordings.delete(key); });
  }
  return bytes;
}
/** Holt alle Aufnahmen vorab in den Speicher, damit ein Netzausfall während der Show den Professor nicht verstummen lässt. */
export async function preloadProfessorVoices(onLoaded: (loaded: number, total: number) => void): Promise<number> {
  let loaded = 0;
  await Promise.all(PROFESSOR_VOICE_KEYS.map(key => (professorBuffers.has(key) ? Promise.resolve() : professorRecording(key))
    .then(() => onLoaded(++loaded, PROFESSOR_VOICE_KEYS.length), () => {})));
  return loaded;
}
/** Ein Abbruch verhindert auch, dass eine noch ladende Aufnahme später losspielt. */
export async function playProfessorVoice(key: string, signal: AbortSignal, onEnded: () => void, countdownDeadline?: number, onStarted?: () => void) {
  if (!PROFESSOR_VOICE_KEYS.includes(key) || !context || context.state !== 'running') throw new Error('Professor-Ton bitte am Beamer aktivieren.');
  const ctx = context;
  let buffer = professorBuffers.get(key);
  if (!buffer) {
    // Das Dekodieren übernimmt die geladenen Bytes; danach bleibt nur der abspielbare Klang im Speicher.
    buffer = professorRecording(key).then(bytes => { professorRecordings.delete(key); return ctx.decodeAudioData(bytes); });
    professorBuffers.set(key, buffer);
    const decoding = buffer;
    void decoding.catch(() => { if (professorBuffers.get(key) === decoding) professorBuffers.delete(key); });
  }
  const decoded = await buffer;
  if (signal.aborted) return;
  if (ctx.state !== 'running') throw new Error('Professor-Ton bitte am Beamer aktivieren.');
  // Erst nach dem Laden berechnen: ein langsamer Download darf den Countdown nicht versetzen.
  const untilEnd = countdownDeadline === undefined ? null : (countdownDeadline - Date.now()) / 1000;
  if (untilEnd !== null && untilEnd <= 0) { onEnded(); return; }
  const source = ctx.createBufferSource();
  source.buffer = decoded;
  source.connect(ctx.destination);
  const stop = () => { try { source.stop(); } catch { /* Bereits beendet. */ } };
  signal.addEventListener('abort', stop, { once: true });
  source.onended = () => { signal.removeEventListener('abort', stop); source.disconnect(); onEnded(); };
  if (untilEnd === null) source.start();
  else source.start(ctx.currentTime + Math.max(0, untilEnd - 5), Math.max(0, 5 - untilEnd));
  onStarted?.();
}
/** Gemeinsamer Abbruch für die ganze Folge, auch während noch eine Antwort lädt. */
export async function playProfessorVoiceSequence(keys: readonly string[], signal: AbortSignal, onEnded: () => void, onClipStarted?: (index: number) => void, onClipEnded?: () => void) {
  for (const [index, key] of keys.entries()) {
    if (signal.aborted) return;
    await new Promise<void>((resolve, reject) => {
      const finished = () => { signal.removeEventListener('abort', finished); resolve(); };
      signal.addEventListener('abort', finished, { once: true });
      const clipEnded = () => { if (!signal.aborted) onClipEnded?.(); finished(); };
      void playProfessorVoice(key, signal, clipEnded, undefined, () => onClipStarted?.(index)).catch(error => { signal.removeEventListener('abort', finished); reject(error); });
    });
  }
  if (!signal.aborted) onEnded();
}

type Tone=(frequency:number,at:number,duration:number,type?:OscillatorType,volume?:number,to?:number)=>void;
type Noise=(at:number,duration:number,frequency:number,volume:number,filter?:BiquadFilterType)=>void;
/** Plant erzeugte Klänge ab einem Versatz ein. Die zurückgegebene Funktion blendet sie sofort aus. */
function synth(elapsedMs:number, build:(tone:Tone,noise:Noise)=>void, volume=.55):()=>void {
  if (!context || context.state !== 'running') return ()=>{};
  const ctx=context, offset=Math.max(0,elapsedMs/1000), start=ctx.currentTime;
  const master=ctx.createGain(); master.gain.value=volume; master.connect(ctx.destination);
  const sources:AudioScheduledSourceNode[]=[], nodes:AudioNode[]=[master];
  const timing=(at:number,duration:number)=>({ when:start+Math.max(0,at-offset), duration:Math.max(0,at+duration-Math.max(at,offset)) });
  const tone:Tone=(frequency,at,duration,type='sine',volume=.1,to=frequency)=>{
    const t=timing(at,duration); if(t.duration<=0)return;
    const source=ctx.createOscillator(), gain=ctx.createGain(); source.type=type;
    source.frequency.setValueAtTime(frequency,t.when);source.frequency.exponentialRampToValueAtTime(to,t.when+t.duration);
    gain.gain.setValueAtTime(0,t.when);gain.gain.linearRampToValueAtTime(volume,t.when+Math.min(.04,t.duration/3));gain.gain.exponentialRampToValueAtTime(.001,t.when+t.duration);
    source.connect(gain).connect(master);sources.push(source);nodes.push(gain);source.start(t.when);source.stop(t.when+t.duration);
  };
  const noise:Noise=(at,duration,frequency,volume,type='lowpass')=>{
    const t=timing(at,duration);if(t.duration<=0)return;
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*t.duration),ctx.sampleRate), data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*( .6+.4*Math.sin(i/ctx.sampleRate*2));
    const source=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), gain=ctx.createGain();source.buffer=buffer;filter.type=type;filter.frequency.value=frequency;
    gain.gain.setValueAtTime(0,t.when);gain.gain.linearRampToValueAtTime(volume,t.when+Math.min(.4,t.duration/3));gain.gain.linearRampToValueAtTime(.001,t.when+t.duration);
    source.connect(filter).connect(gain).connect(master);sources.push(source);nodes.push(filter,gain);source.start(t.when);source.stop(t.when+t.duration);
  };
  build(tone,noise);
  let stopped=false;
  return ()=>{
    if(stopped)return;stopped=true;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(.0001,ctx.currentTime,.015);
    for(const source of sources){try{source.stop(ctx.currentTime+.06);}catch{/* Bereits beendet. */}}
    window.setTimeout(()=>{for(const source of sources)source.disconnect();for(const node of nodes)node.disconnect();},100);
  };
}
/** Eigene zehnsekündige Geräuschkulissen, passend zu den drei sichtbaren Handlungsschritten. */
export function playKidsScene(motif: KidsSceneMotif, elapsedMs=0):()=>void {
  if (elapsedMs>=KIDS_SCENE_MS) return ()=>{};
  return synth(elapsedMs,(tone,noise)=>{
    if(motif==='ark') {
      for(let i=0;i<5;i++){tone(165,.2+i*.52,.12,'triangle',.18,85);noise(.2+i*.52,.07,1400,.15);}
      for(const at of [3.1,4.3,5.4]){tone(410,at,.32,'triangle',.08,270);tone(450,at+.22,.3,'triangle',.07,300);}
      noise(6.5,3.5,1750,.17);
    } else if(motif==='manger') {
      [784,988,1175].forEach((f,i)=>tone(f,i*.45,1.2,'sine',.08));
      [523,659,784,659,587,523].forEach((f,i)=>tone(f,3.2+i*.9,1.1,'sine',.075));
    } else if(motif==='lion') {
      for(const at of [.2,1.8,3.6]){tone(100,at,.85,'triangle',.13,66);noise(at,.7,210,.07);}
      [659,784,988].forEach((f,i)=>tone(f,6.6+i*.6,1.3,'sine',.08));
    } else {
      noise(0,6.5,650,.22);
      for(const at of [.3,1.6,3,4.5])noise(at,.8,1100,.15);
      tone(523,6.5,1.7,'sine',.09);tone(659,7,1.7,'sine',.08);tone(784,7.5,2,'sine',.07);
    }
  });
}

/** Dauer des Trommelwirbels vor der Auflösung. Bild und Klang laufen im selben Takt. */
export const KIDS_SUSPENSE_MS = 3600;
export type KidsCue = 'tick' | 'last-tick' | 'gong' | 'drumroll' | 'overtake';
/** Kurze Showklänge: Countdown zum Mitzählen, Schlussgong, Trommelwirbel mit Bluff-Stempeln und Überholen. */
export function playKidsCue(cue: KidsCue):()=>void {
  return synth(0,(tone,noise)=>{
    if(cue==='tick') { tone(1320,0,.09,'square',.05,990); tone(660,0,.12,'triangle',.08,520); }
    else if(cue==='last-tick') { tone(1760,0,.12,'square',.05,1320); tone(880,0,.16,'triangle',.09,700); }
    else if(cue==='gong') { tone(196,0,2.6,'sine',.2,190); tone(392,0,2,'sine',.09,385); tone(587,.01,1.4,'triangle',.05,580); noise(0,.25,2400,.08); }
    else if(cue==='drumroll') {
      // Wirbel wird schneller, dann zwei Stempel (falsche Felder) und ein Tusch für die Wahrheit.
      let at=0, gap=.11;
      while(at<2.55){ noise(at,.07,2600,.11+at*.035,'highpass'); tone(190,at,.06,'triangle',.05,140); at+=gap; gap=Math.max(.045,gap*.95); }
      for(const stamp of [1.15,1.95]){ tone(320,stamp,.22,'square',.07,110); noise(stamp,.12,900,.12); }
      [523,659,784,1047].forEach((f,i)=>tone(f,2.65+i*.09,.9-i*.1,'triangle',.09));
      noise(2.65,.6,5200,.06,'highpass');
    } else {
      noise(0,.7,900,.14,'bandpass'); tone(330,0,.65,'triangle',.08,990);
      [784,988,1319].forEach((f,i)=>tone(f,.55+i*.1,.5,'sine',.07));
    }
  },.6);
}
