import { KIDS_SCENE_MS, type KidsSceneMotif } from '../../shared/kids-scenes';
let context: AudioContext | null = null;
export async function enableKidsSound() {
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();
  if (context.state !== 'running') throw new Error('Klang nicht verfügbar');
}
/** Eigene zehnsekündige Geräuschkulissen, passend zu den drei sichtbaren Handlungsschritten. */
export function playKidsScene(motif: KidsSceneMotif, elapsedMs=0):()=>void {
  if (!context || context.state !== 'running' || elapsedMs>=KIDS_SCENE_MS) return ()=>{};
  const ctx=context, offset=Math.max(0,elapsedMs/1000), start=ctx.currentTime;
  const master=ctx.createGain(); master.gain.value=.55; master.connect(ctx.destination);
  const sources:AudioScheduledSourceNode[]=[], nodes:AudioNode[]=[master];
  const timing=(at:number,duration:number)=>({ when:start+Math.max(0,at-offset), duration:Math.max(0,at+duration-Math.max(at,offset)) });
  const tone=(frequency:number,at:number,duration:number,type:OscillatorType='sine',volume=.1,to=frequency)=>{
    const t=timing(at,duration); if(t.duration<=0)return;
    const source=ctx.createOscillator(), gain=ctx.createGain(); source.type=type;
    source.frequency.setValueAtTime(frequency,t.when);source.frequency.exponentialRampToValueAtTime(to,t.when+t.duration);
    gain.gain.setValueAtTime(0,t.when);gain.gain.linearRampToValueAtTime(volume,t.when+Math.min(.04,t.duration/3));gain.gain.exponentialRampToValueAtTime(.001,t.when+t.duration);
    source.connect(gain).connect(master);sources.push(source);nodes.push(gain);source.start(t.when);source.stop(t.when+t.duration);
  };
  const noise=(at:number,duration:number,frequency:number,volume:number)=>{
    const t=timing(at,duration);if(t.duration<=0)return;
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*t.duration),ctx.sampleRate), data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*( .6+.4*Math.sin(i/ctx.sampleRate*2));
    const source=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), gain=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;
    gain.gain.setValueAtTime(0,t.when);gain.gain.linearRampToValueAtTime(volume,t.when+Math.min(.4,t.duration/3));gain.gain.linearRampToValueAtTime(.001,t.when+t.duration);
    source.connect(filter).connect(gain).connect(master);sources.push(source);nodes.push(filter,gain);source.start(t.when);source.stop(t.when+t.duration);
  };
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
  let stopped=false;
  return ()=>{
    if(stopped)return;stopped=true;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(.0001,ctx.currentTime,.015);
    for(const source of sources){try{source.stop(ctx.currentTime+.06);}catch{/* Bereits beendet. */}}
    window.setTimeout(()=>{for(const source of sources)source.disconnect();for(const node of nodes)node.disconnect();},100);
  };
}


const professorVoiceCache = new Map<string, Promise<AudioBuffer>>();
/** Play permanent, locally hosted ElevenLabs recordings through the display audio output. */
export async function playProfessorVoice(id: string): Promise<() => void> {
  if (!/^[a-z0-9-]{1,32}$/.test(id) || !context || context.state !== 'running') throw new Error('Professor-Stimme nicht aktiviert');
  const ctx = context;
  let audio = professorVoiceCache.get(id);
  if (!audio) {
    audio = fetch(`/professor-bluff/${id}.mp3`).then(r => { if (!r.ok) throw new Error('Professor-Aufnahme fehlt'); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b));
    professorVoiceCache.set(id, audio);
    audio.catch(() => { if (professorVoiceCache.get(id) === audio) professorVoiceCache.delete(id); });
  }
  const source = ctx.createBufferSource(); source.buffer = await audio;
  const gain = ctx.createGain(); gain.gain.value = .94; source.connect(gain).connect(ctx.destination); source.start();
  source.onended = () => { source.disconnect(); gain.disconnect(); };
  return () => { try { source.stop(); } catch { /* finished */ } };
}
