import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { professorVoiceKey } from '../../shared/professor-voice';
import { playProfessorVoice } from '../lib/kids-sound';

const VoiceContext = createContext<{ available:boolean; playing:boolean; busy:boolean; play:()=>void; stop:()=>void } | null>(null);

export function KidsVoiceProvider({ game, enabled, enable, act, busy, onError, children }: {
  game:KidsGame|null; enabled:boolean; enable:()=>Promise<void>; act:(action:KidsAction)=>void;
  busy:boolean; onError:(message:string)=>void; children:ComponentChildren;
}) {
  const [playing,setPlaying] = useState(false);
  const [preparing,setPreparing] = useState(false);
  const previous = useRef<number|null>(null);
  const playback = useRef<AbortController|null>(null);
  const currentCue = useRef<string|null>(null);
  currentCue.current=game ? `${game.phase}:${game.index}` : null;
  const stop = () => { const old=playback.current; playback.current=null; old?.abort(); setPlaying(false); };
  const key = game ? professorVoiceKey(game) : null;
  useEffect(() => {
    stop();
    if (!game) { previous.current=null; return; }
    const sequence=game.voiceSeq ?? 0;
    const requested=previous.current !== null && sequence !== previous.current;
    previous.current=sequence;
    // Ein Seitenaufruf, Phasenwechsel oder erneutes Verbinden löst keine Sprache aus.
    if (!requested || !game.voicePlaying || !key || game.voiceCue!==`${game.phase}:${game.index}`) return;
    if (!enabled) { onError('Professor-Ton am Beamer unter „Bedienung → Klang einschalten“ aktivieren. Danach den Spruch erneut starten.'); return; }
    const controller=new AbortController(); playback.current=controller; setPlaying(true);
    void playProfessorVoice(key,controller.signal,()=>{if(playback.current===controller){playback.current=null;setPlaying(false);}}).catch(error=>{
      if (playback.current!==controller) return;
      playback.current=null;setPlaying(false);onError(error instanceof Error ? error.message : 'Die Professor-Aufnahme konnte nicht abgespielt werden.');
    });
    return () => { if(playback.current===controller) playback.current=null; controller.abort(); };
  },[game?.voiceSeq,game?.phase,game?.index,enabled]);
  useEffect(()=>()=>{currentCue.current=null;playback.current?.abort();},[]);
  return <VoiceContext.Provider value={{available:!!key,playing,busy:busy||preparing,
    play:()=>{const cue=currentCue.current;onError('');setPreparing(true);void enable().then(()=>{if(cue!==null && currentCue.current===cue)act('speak');}).catch(error=>onError(error instanceof Error ? error.message : 'Professor-Ton nicht verfügbar.')).finally(()=>setPreparing(false));},
    stop:()=>{stop();act('stop-speech');},
  }}>{children}</VoiceContext.Provider>;
}

/** Kompakter Knopf am jeweils sichtbaren Professor-Spruch. */
export function KidsVoiceButton() {
  const voice=useContext(VoiceContext);
  if (!voice?.available) return null;
  return <button type="button" class="kids-voice-play" disabled={voice.busy} aria-label={voice.playing ? 'Professor-Spruch stoppen' : 'Professor-Spruch abspielen'} title={voice.playing ? 'Spruch stoppen' : 'Diesen Spruch abspielen'} onClick={voice.playing ? voice.stop : voice.play}><span aria-hidden="true">{voice.playing ? '■' : '▶'}</span></button>;
}
