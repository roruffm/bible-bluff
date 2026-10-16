import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { professorVoiceKey } from '../../shared/professor-voice';
import { playProfessorVoice } from '../lib/kids-sound';
import { playDeviceQuestion } from '../lib/kids-device-speech';

const VoiceContext = createContext<{ available:boolean; playing:'quote'|'question'|null; questionAvailable:boolean; questionDevice:boolean; busy:boolean; play:()=>void; read:()=>void; stop:()=>void } | null>(null);

export function KidsVoiceProvider({ game, enabled, enable, act, busy, onError, children }: {
  game:KidsGame|null; enabled:boolean; enable:()=>Promise<void>; act:(action:KidsAction)=>void;
  busy:boolean; onError:(message:string)=>void; children:ComponentChildren;
}) {
  const [playing,setPlaying] = useState<'quote'|'question'|null>(null);
  const [preparing,setPreparing] = useState(false);
  const previous = useRef<number|null>(null);
  const playback = useRef<AbortController|null>(null);
  const currentCue = useRef<string|null>(null);
  currentCue.current=game ? `${game.phase}:${game.index}` : null;
  const stop = () => { const old=playback.current; playback.current=null; old?.abort(); setPlaying(null); };
  const key = game ? professorVoiceKey(game,game.voiceKind ?? 'quote') : null;
  useEffect(() => {
    stop();
    if (!game) { previous.current=null; return; }
    const sequence=game.voiceSeq ?? 0;
    const requested=previous.current !== null && sequence !== previous.current;
    previous.current=sequence;
    // Ein Seitenaufruf, Phasenwechsel oder erneutes Verbinden löst keine Sprache aus.
    if (!requested || !game.voicePlaying || !key || game.voiceCue!==`${game.phase}:${game.index}`) return;
    if (!enabled) { onError('Professor-Ton am Beamer unter „Bedienung → Klang einschalten“ aktivieren. Danach den Spruch erneut starten.'); return; }
    const controller=new AbortController(); playback.current=controller; setPlaying(game.voiceKind ?? 'quote');
    const ended=()=>{if(playback.current===controller){playback.current=null;setPlaying(null);}};
    const playbackPromise=game.voiceKind==='question' && game.index===9 ? playDeviceQuestion(game.rounds[game.index].question.prompt,controller.signal,ended) : playProfessorVoice(key,controller.signal,ended);
    void playbackPromise.catch(error=>{
      if (playback.current!==controller) return;
      playback.current=null;setPlaying(null);onError(error instanceof Error ? error.message : 'Die Professor-Aufnahme konnte nicht abgespielt werden.');
    });
    return () => { if(playback.current===controller) playback.current=null; controller.abort(); };
  },[game?.voiceSeq,game?.phase,game?.index,game?.voiceKind,enabled]);
  useEffect(()=>()=>{currentCue.current=null;playback.current?.abort();},[]);
  const request=(action:'speak'|'read-question')=>{const cue=currentCue.current;onError('');setPreparing(true);void enable().then(()=>{if(cue!==null && currentCue.current===cue)act(action);}).catch(error=>onError(error instanceof Error ? error.message : 'Professor-Ton nicht verfügbar.')).finally(()=>setPreparing(false));};
  return <VoiceContext.Provider value={{available:!!game && !!professorVoiceKey(game),questionAvailable:game?.phase==='reading',questionDevice:game?.index===9,playing,busy:busy||preparing,
    play:()=>request('speak'),read:()=>request('read-question'),
    stop:()=>{stop();act('stop-speech');},
  }}>{children}</VoiceContext.Provider>;
}

/** Kompakter Knopf am jeweils sichtbaren Professor-Spruch. */
export function KidsVoiceButton({ labelled = false }: { labelled?: boolean } = {}) {
  const voice=useContext(VoiceContext);
  if (!voice?.available) return null;
  return <button type="button" class={`kids-voice-play${labelled ? ' has-label' : ''}`} disabled={voice.busy} aria-label={voice.playing==='quote' ? 'Professor-Spruch stoppen' : 'Professor-Spruch abspielen'} title={voice.playing==='quote' ? 'Spruch stoppen' : 'Diesen Spruch abspielen'} onClick={voice.playing==='quote' ? voice.stop : voice.play}><span aria-hidden="true">{voice.playing==='quote' ? '■' : '▶'}</span>{labelled && <span>{voice.playing==='quote' ? 'Spruch stoppen' : 'Spruch abspielen'}</span>}</button>;
}

export function KidsQuestionVoiceButton() {
  const voice=useContext(VoiceContext);
  if(!voice?.questionAvailable)return null;
  const reading=voice.playing==='question';
  return <button type="button" class="kids-tool kids-question-voice" title={voice.questionDevice ? 'Finalfrage vorläufig mit deutscher Gerätestimme' : 'Professor Bluff liest die Frage vor'} disabled={voice.busy} onClick={reading ? voice.stop : voice.read}>{reading ? '■ Vorlesen stoppen' : '▶ Frage vorlesen'}</button>;
}
