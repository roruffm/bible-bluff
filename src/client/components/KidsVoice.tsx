import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { professorAnswerVoiceKeys, professorVoiceKey } from '../../shared/professor-voice';
import { professorInterjection } from '../../shared/professor-interjections';
import { playProfessorVoice, playProfessorVoiceSequence } from '../lib/kids-sound';

const VoiceContext = createContext<{ available:boolean; playing:'quote'|'question'|'answers'|null; answerField:number|null; questionAvailable:boolean; sceneInviteAvailable:boolean; busy:boolean; play:()=>void; read:()=>void; readAnswers:()=>void; inviteScene:()=>void; stop:()=>void } | null>(null);

/** Lokale Rückmeldung der tatsächlich gestarteten Aufnahme, auch bei Smartphone-Bedienung. */
export function useKidsSpokenAnswer(): number | null {
  return useContext(VoiceContext)?.answerField ?? null;
}

export function KidsVoiceProvider({ game, enabled, enable, act, busy, onError, children }: {
  game:KidsGame|null; enabled:boolean; enable:()=>Promise<void>; act:(action:KidsAction)=>void;
  busy:boolean; onError:(message:string)=>void; children:ComponentChildren;
}) {
  const [playing,setPlaying] = useState<'quote'|'question'|'answers'|'interjection'|null>(null);
  const [preparing,setPreparing] = useState(false);
  const [answerField,setAnswerField] = useState<{ field:number; sequence:number }|null>(null);
  const previous = useRef<number|null>(null);
  const playback = useRef<AbortController|null>(null);
  const currentCue = useRef<string|null>(null);
  currentCue.current=game ? `${game.phase}:${game.index}` : null;
  const stop = () => { const old=playback.current; playback.current=null; old?.abort(); setPlaying(null); setAnswerField(null); };
  const clip = professorInterjection(game?.voiceClip);
  const key = game?.voiceKind === 'interjection' ? clip ? `interjection-${clip.id}` : null : game && game.voiceKind !== 'answers' ? professorVoiceKey(game,game.voiceKind ?? 'quote') : null;
  useEffect(() => {
    stop();
    if (!game) { previous.current=null; return; }
    const sequence=game.voiceSeq ?? 0;
    const initial = previous.current === null;
    const requested=previous.current !== null && sequence !== previous.current;
    previous.current=sequence;
    // Ein Seitenaufruf, Phasenwechsel oder erneutes Verbinden löst keine Sprache aus.
    if (game.introVideo || !requested || !game.voicePlaying || (!key && game.voiceKind !== 'answers') || game.voiceCue!==`${game.phase}:${game.index}`) {
      if (initial && game.voicePlaying && !game.introVideo) act(`voice-status:${sequence}:failed`);
      return;
    }
    // Die automatische Startansage meldet keinen Fehler, wenn der Klang am Beamer bewusst aus ist.
    if (!enabled) { act(`voice-status:${sequence}:failed`); if (game.voiceClip !== 'signal-go') onError('Professor-Ton am Beamer unter „Bedienung → Klang einschalten“ aktivieren. Danach den Spruch erneut starten.'); return; }
    const controller=new AbortController(); playback.current=controller; setPlaying(game.voiceKind ?? 'quote');
    const ended=()=>{if(playback.current===controller){playback.current=null;setPlaying(null);setAnswerField(null);
      act(`voice-status:${sequence}:ended`);
    }};
    const countdownDeadline=game.voiceKind==='interjection' && game.voiceClip==='signal-countdown' && game.phase==='moving' ? game.deadline ?? undefined : undefined;
    const started=(index:number)=>{if(playback.current===controller && !controller.signal.aborted){setAnswerField({field:Math.floor(index/2),sequence});if(index===0)act(`voice-status:${sequence}:playing`);}};
    const clipEnded=()=>{if(playback.current===controller)setAnswerField(null);};
    const playbackPromise=game.voiceKind === 'answers' ? playProfessorVoiceSequence(professorAnswerVoiceKeys(game),controller.signal,ended,started,clipEnded) : playProfessorVoice(key!,controller.signal,ended,countdownDeadline,()=>{if(playback.current===controller && !controller.signal.aborted)act(`voice-status:${sequence}:playing`);});
    void playbackPromise.catch(error=>{
      if (playback.current!==controller) return;
      playback.current=null;setPlaying(null);setAnswerField(null);
      act(`voice-status:${sequence}:failed`);
      onError(error instanceof Error ? error.message : 'Die Professor-Aufnahme konnte nicht abgespielt werden.');
    });
    return () => { if(playback.current===controller) playback.current=null; controller.abort(); };
  },[game?.voiceSeq,game?.phase,game?.index,game?.voiceKind,game?.voiceClip,enabled]);
  useEffect(()=>()=>{currentCue.current=null;playback.current?.abort();},[]);
  const request=(action:'speak'|'read-question'|'read-answers'|'interjection:scene-invite')=>{const cue=currentCue.current;onError('');setPreparing(true);void enable().then(()=>{if(cue!==null && currentCue.current===cue)act(action);}).catch(error=>onError(error instanceof Error ? error.message : 'Professor-Ton nicht verfügbar.')).finally(()=>setPreparing(false));};
  const spokenField=game?.phase==='reading' && game.voicePlaying && game.voiceKind==='answers' && answerField && answerField.sequence===game.voiceSeq ? answerField.field : null;
  return <VoiceContext.Provider value={{available:!!game && !!professorVoiceKey(game),questionAvailable:game?.phase==='reading',sceneInviteAvailable:game?.phase==='reading' && game.rounds[game.index].question.group==='minis' && !!game.rounds[game.index].question.scene,playing:playing==='interjection' ? null : playing,answerField:spokenField,busy:busy||preparing,
    play:()=>request('speak'),read:()=>request('read-question'),readAnswers:()=>request('read-answers'),
    inviteScene:()=>request('interjection:scene-invite'),
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
  return <button type="button" class="kids-tool kids-question-voice" title="Professor Bluff liest die Frage vor" disabled={voice.busy} onClick={reading ? voice.stop : voice.read}>{reading ? '■ Vorlesen stoppen' : '▶ Frage vorlesen'}</button>;
}

/** Nur in der eingeblendeten Mausbedienung sichtbar. */
export function KidsAnswersVoiceButton() {
  const voice=useContext(VoiceContext);
  if(!voice?.questionAvailable)return null;
  const reading=voice.playing==='answers';
  return <button type="button" class="kids-tool kids-question-voice" title="Professor Bluff liest alle drei Antworten in der Reihenfolge der Felder vor" disabled={voice.busy} onClick={reading ? voice.stop : voice.readAnswers}>{reading ? '■ Antworten stoppen' : '▶ Antworten vorlesen'}</button>;
}

/** Manuelle Ansage direkt vor der Szene, ohne den Szenenablauf oder Countdown zu starten. */
export function KidsSceneInviteVoiceButton() {
  const voice=useContext(VoiceContext);
  if(!voice?.sceneInviteAvailable)return null;
  return <button type="button" class="kids-tool kids-scene-invite" disabled={voice.busy} onClick={voice.inviteScene}><span aria-hidden="true">▶</span> Seht euch die Szene an</button>;
}
