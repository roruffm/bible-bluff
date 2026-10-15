import type { ComponentChildren } from 'preact';
import { kidsScores, type KidsGame } from '../../shared/kids-game';
import { ProfessorBluff, professorSays } from './KidsShow';

export function KidsFinish({ game, children }: { game:KidsGame; children?:ComponentChildren }) {
  const s=kidsScores(game);
  return <section class="kids-ending" aria-labelledby="kids-ending-title">
    <header><p class="kids-eyebrow">EURE GEMEINSAME BLUFF-JAGD</p><h1 id="kids-ending-title">Gemeinsam seid ihr stark!</h1><p>Ein großer Applaus für Minis, Mittis und Maxis!</p></header>
    <div class="kids-ending-host"><ProfessorBluff mood="kind"/><blockquote>{professorSays(game)}</blockquote><span>Professor Bluff</span></div>
    <div class="kids-ending-results" aria-label="Endpunktestand">
      <div class="kids-ending-team"><span>BIBLEBLUFF-TEAM</span><strong data-testid="team-score">{s.team}</strong><b>gemeinsam gesammelte Punkte</b></div>
      <div class="kids-ending-professor"><span>PROFESSOR BLUFF</span><strong data-testid="prof-score">{s.professor}</strong><b>Punkte</b></div>
      <p class="kids-ending-count">{s.playedRounds === 0 ? 'Danke, dass ihr dabei seid!' : `${s.playedRounds} ${s.playedRounds === 1 ? 'Aufgabe gemeinsam gespielt' : 'Aufgaben gemeinsam gespielt'}`}</p>
    </div>
    <footer><p>Bei Jesus sind wir willkommen.</p><small>Jesus lädt die Kinder zu sich ein. · Markus 10,14</small><div class="kids-finale-seal"><span aria-hidden="true">♥</span> ALLE GEHÖREN DAZU <span aria-hidden="true">♥</span></div></footer>
    {children}
  </section>;
}

export function KidsFinishDialog({ game, onCancel, onFinish, disabled, error }: { game:KidsGame; onCancel:()=>void; onFinish:()=>void; disabled:boolean; error?:string }) {
  const s=kidsScores(game);
  return <div class="kids-exit kids-finish-dialog" role="dialog" aria-modal="true" aria-labelledby="kids-finish-title" onKeyDown={e=>{
    if(e.key==='Escape'){e.preventDefault();onCancel();}
    if(e.key==='Tab'){
      const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
    }
  }}><div><h2 id="kids-finish-title">Spiel jetzt abschließen?</h2><p>Der gemeinsame Endbildschirm zeigt die Punkte aller bereits gewerteten Aufgaben.</p><div class="kids-finish-preview"><span>Kinderteam <b>{s.team}</b></span><span>Professor Bluff <b>{s.professor}</b></span></div><p>Eine noch nicht gewertete Aufgabe bleibt ohne Wertung.</p>{error && <p role="alert">{error}</p>}<button type="button" class="kids-button" autoFocus onClick={onCancel}>Weiterspielen</button><button type="button" class="kids-button kids-primary" disabled={disabled} onClick={onFinish}>Jetzt mit Punktestand abschließen</button></div></div>;
}
