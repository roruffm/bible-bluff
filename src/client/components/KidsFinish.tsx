import { KidsTeamPortrait } from './KidsTeamPortrait';
import { KidsGroupName } from './KidsGroupName';
import { KidsVoiceButton } from './KidsVoice';
import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { kidsScores, type KidsGame } from '../../shared/kids-game';
import { ProfessorBluff, professorSays } from './KidsShow';
import { Face, Spark } from './KidsCuteParts';

/** Aufkleber über dem Endstand: ein Pokal, wenn das Team vorne liegt, sonst ein Herz. Beides ist ein Lob. */
function EndingSticker({ won }: { won:boolean }) {
  return <svg class="kids-ending-sticker" viewBox="0 0 120 120" aria-hidden="true" data-sticker={won ? 'trophy' : 'heart'}><g stroke="#12324a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    {won ? <>
      <path d="M32 34q-20 0-20 16t24 18m52-34q20 0 20 16t-24 18" fill="none" stroke-width="11"/><path d="M32 34q-20 0-20 16t24 18m52-34q20 0 20 16t-24 18" fill="none" stroke="#ffd24a" stroke-width="5"/>
      <path d="M52 76h16v12H52z" fill="#f0b83c"/><rect x="36" y="86" width="48" height="16" rx="6" fill="#e0a72a"/>
      <path d="M30 20h60v22q0 34-30 34T30 42z" fill="#ffd96a"/><path d="M41 30q-1 18 8 30" fill="none" stroke="#fff6c2" stroke-width="4"/>
      <Face x={60} y={44} s={.8}/>
    </> : <>
      <path d="M60 102Q14 74 14 46q0-22 22-22 15 0 24 15 9-15 24-15 22 0 22 22 0 28-46 56z" fill="#ff8ea8"/><path d="M28 44q0-10 10-12" fill="none" stroke="#ffd0dc" stroke-width="4"/>
      <Face x={60} y={56} s={.85}/>
    </>}
    <Spark x={16} y={18} r={8}/><Spark x={106} y={22} r={7}/><Spark x={104} y={96} r={6}/>
  </g></svg>;
}

export function KidsFinish({ game, children }: { game:KidsGame; children?:ComponentChildren }) {
  const s=kidsScores(game);
  return <section class="kids-ending" aria-labelledby="kids-ending-title">
    <header><h1 id="kids-ending-title">Gemeinsam seid ihr stark!</h1><div class="kids-ending-groups" aria-label="Ein großer Applaus für alle drei Gruppen">{(['minis','mittis','maxis'] as const).map(group=><div key={group} class={`kids-ending-group group-${group}`}><KidsTeamPortrait group={group} celebrating/><KidsGroupName group={group}/></div>)}</div></header>
    <div class="kids-ending-host"><blockquote>{professorSays(game)}</blockquote><ProfessorBluff mood="kind" motion="bow"/><span class="kids-professor-signature">Professor Bluff <KidsVoiceButton/></span></div>
    <div class="kids-ending-results" aria-label="Endpunktestand">
      <EndingSticker won={s.team > s.professor}/>
      <div class="kids-ending-team"><span>UNSER TEAM</span><strong data-testid="team-score">{s.team}</strong></div>
      <span class="kids-ending-colon" aria-hidden="true">:</span><div class="kids-ending-professor"><span>PROFESSOR BLUFF</span><strong data-testid="prof-score">{s.professor}</strong></div>
      <p class="kids-ending-count">{s.playedRounds === 0 ? 'Danke, dass ihr dabei seid!' : `${s.playedRounds} ${s.playedRounds === 1 ? 'Aufgabe gemeinsam gespielt' : 'Aufgaben gemeinsam gespielt'}`}</p>
    </div>
    <footer><p>Bei Jesus sind wir willkommen.</p><small>Jesus lädt die Kinder zu sich ein. · Markus 10,14</small><h2>Noch viel Spaß bei Hello King!</h2></footer>
    {children}
  </section>;
}

export function KidsFinishDialog({ game, onCancel, onFinish, disabled, error }: { game:KidsGame; onCancel:()=>void; onFinish:()=>void; disabled:boolean; error?:string }) {
  const s=kidsScores(game);
  const cancel=useRef<HTMLButtonElement>(null);
  useLayoutEffect(()=>{cancel.current?.focus({preventScroll:true});},[]);
  return <div class="kids-exit kids-finish-dialog" role="dialog" aria-modal="true" aria-labelledby="kids-finish-title" onKeyDown={e=>{
    if(e.key==='Escape'){e.preventDefault();onCancel();}
    if(e.key==='Tab'){
      const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
    }
  }}><div><h2 id="kids-finish-title">Spiel jetzt abschließen?</h2><p>Der gemeinsame Endbildschirm zeigt die Punkte aller bereits gewerteten Aufgaben.</p><div class="kids-finish-preview"><span>Kinderteam <b>{s.team}</b></span><span>Professor Bluff <b>{s.professor}</b></span></div><p>Eine noch nicht gewertete Aufgabe bleibt ohne Wertung.</p>{error && <p role="alert">{error}</p>}<button type="button" class="kids-button" ref={cancel} onClick={onCancel}>Weiterspielen</button><button type="button" class="kids-button kids-primary" disabled={disabled} onClick={onFinish}>Jetzt mit Punktestand abschließen</button></div></div>;
}
