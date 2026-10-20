import { KidsGroupName } from './KidsGroupName';
import { KidsVoiceButton } from './KidsVoice';
import type { ComponentChildren, RefObject } from 'preact';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { kidsRoundReaction } from '../lib/kids-reactions';
import { professorMotion } from '../lib/professor-motion';
import { ProfessorBluff, ShowControls, StoryPicture } from './KidsShow';
import { KidsSuspense } from './KidsBluff';
import { Spark } from './KidsCuteParts';

/** Aufgeschlagene Bibel für das Erklärkärtchen. */
const BibleBook = () => <svg class="kids-discovery-book" viewBox="0 0 64 56" stroke="#12324a" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
  <path d="M3 16v34q15-4 29 2 14-6 29-2V16" fill="#3f9b7c"/>
  <path d="M32 15q-13-7-27-3v33q14-3 27 4zM32 15q13-7 27-3v33q-14-3-27 4z" fill="#fffdf1"/>
  <path d="M11 22q8-2 15 1m-15 7q8-2 15 1m12-8q7-3 15-1m-15 8q7-3 15-1" fill="none" stroke="#9fb7c2" stroke-width="2"/>
  <path d="M45 29v10m-5-6h10" fill="none" stroke="#e8b84a" stroke-width="3"/>
  <Spark x={54} y={7} r={5}/>
</svg>;

/** suspense zeigt zuerst den Trommelwirbel. Bedienung und Weiter bleiben dabei erreichbar. */
export function KidsReveal({ game, act, disabled, primaryRef, suspense = false, children }: { game: KidsGame; act: (action: Exclude<KidsAction,'tick'>)=>void; disabled:boolean; primaryRef:RefObject<HTMLButtonElement>; suspense?: boolean; children?:ComponentChildren }) {
  const round=game.rounds[game.index], reaction=kidsRoundReaction(game);
  return <section class={`kids-reveal is-revealed reaction-${reaction.mood}${suspense ? ' is-suspense' : ''}`} aria-labelledby="kids-reveal-title" data-points={reaction.points}>
    {suspense && <KidsSuspense round={round}/>}
    <div class="kids-reveal-result">
      <header><p class="kids-eyebrow">AUFGELÖST · <KidsGroupName group={round.question.group}/></p><h1 id="kids-reveal-title">Feld {round.correctIndex+1} ist richtig!</h1></header>
      <div class={`kids-answer kids-reveal-answer kids-field-${round.correctIndex+1} is-correct has-picture`}>
        <span class="kids-number">{round.correctIndex+1}</span>
        <StoryPicture motif={round.question.pictures[0]}/>
        <span class="kids-answer-text">{round.question.answer}</span><span class="kids-correct-mark">✓ Entdeckt!</span>
      </div>
      <div class="kids-discovery"><BibleBook/><div><p>{round.question.explanation}</p><small>{round.question.ref}</small></div></div>
      <p class="kids-reveal-points">{reaction.caption}</p>
    </div>
    <aside class="kids-reaction" aria-label="Professor Bluffs Reaktion">
      <div class="kids-reaction-art"><div class="kids-reaction-halo" aria-hidden="true"/><ProfessorBluff mood={reaction.mood} motion={professorMotion(game)}/><div class="kids-reaction-symbols" aria-hidden="true">{[0,1,2].map(i=><span key={i} style={{'--i':i}}>{reaction.points>0 ? ['!','✦','!'][i] : '♥'}</span>)}</div></div>
      <blockquote class="kids-reaction-bubble"><span class="kids-professor-signature">PROFESSOR BLUFF <KidsVoiceButton labelled/></span><p class="kids-reaction-quote">{reaction.quote}</p></blockquote>
    </aside>
    <footer class="kids-reveal-footer"><p>{suspense ? 'Wo hat Professor Bluff geflunkert?' : game.index===9 ? 'Alle Altersgruppen haben zusammengeholfen.' : 'Gemeinsam geht die Jagd weiter. Jeder Beitrag zählt!'}</p><ShowControls game={game} act={act} disabled={disabled} primaryRef={primaryRef}/></footer>
    {children}
  </section>;
}
