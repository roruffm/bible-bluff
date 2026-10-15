import type { ComponentChildren, RefObject } from 'preact';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { KIDS_GROUPS } from '../../shared/kids-show-questions';
import { kidsRoundReaction } from '../lib/kids-reactions';
import { ProfessorBluff, ShowControls, StoryPicture } from './KidsShow';

export function KidsReveal({ game, act, disabled, primaryRef, children }: { game: KidsGame; act: (action: Exclude<KidsAction,'tick'>)=>void; disabled:boolean; primaryRef:RefObject<HTMLButtonElement>; children?:ComponentChildren }) {
  const round=game.rounds[game.index], reaction=kidsRoundReaction(game);
  return <section class={`kids-reveal is-revealed reaction-${reaction.mood}`} aria-labelledby="kids-reveal-title" data-points={reaction.points}>
    <div class="kids-reveal-result">
      <header><p class="kids-eyebrow">AUFGELÖST · {KIDS_GROUPS[round.question.group].name}</p><h1 id="kids-reveal-title">Feld {round.correctIndex+1} ist richtig!</h1></header>
      <div class={`kids-answer kids-reveal-answer kids-field-${round.correctIndex+1} is-correct has-picture`}>
        <span class="kids-number">{round.correctIndex+1}</span>
        <StoryPicture motif={round.question.pictures[0]}/>
        <span class="kids-answer-text">{round.question.answer}</span><span class="kids-correct-mark">✓ Entdeckt!</span>
      </div>
      <div class="kids-discovery"><div><p>{round.question.explanation}</p><small>{round.question.ref}</small></div></div>
    </div>
    <aside class="kids-reaction" aria-label="Professor Bluffs Reaktion">
      <div class="kids-reaction-art"><div class="kids-reaction-halo" aria-hidden="true"/><ProfessorBluff mood={reaction.mood}/><div class="kids-reaction-symbols" aria-hidden="true">{[0,1,2].map(i=><span key={i} style={{'--i':i}}>{reaction.points>0 ? ['!','✦','!'][i] : '♥'}</span>)}</div></div>
      <blockquote class="kids-reaction-bubble"><span>PROFESSOR BLUFF</span><p class="kids-reaction-quote">{reaction.quote}</p></blockquote>
      <p class="kids-reaction-caption">{reaction.caption}</p>
    </aside>
    <footer class="kids-reveal-footer"><p>{game.index===9 ? 'Alle Altersgruppen haben zusammengeholfen.' : 'Ein neues Schatzteil! Gemeinsam geht die Jagd weiter.'}</p><ShowControls game={game} act={act} disabled={disabled} primaryRef={primaryRef}/></footer>
    {children}
  </section>;
}
