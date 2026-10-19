import type { RefObject } from 'preact';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { KIDS_CHAPTERS, KIDS_GROUPS } from '../../shared/kids-show-questions';
import { professorMotion } from '../lib/professor-motion';
import { KidsGroupName } from './KidsGroupName';
import { KidsVoiceButton } from './KidsVoice';
import { ProfessorBluff, professorMood, professorSays, ShowControls, StoryPicture } from './KidsShow';
import { KidsIntroControls } from './KidsIntroVideo';

/** Je Kapitel ein eigenes Bild: die erste Spur, die Schatzkarte, die Zielflagge. */
const CHAPTER_PICTURES = ['clue', 'map', 'flag'] as const;

/** Die Übergänge teilen sich die Bühne, behalten aber ihre vorhandenen Ansagen und Steuerung. */
export function KidsInterlude({ game, chapter, act, disabled, primaryRef }: {
  game: KidsGame; chapter: number; act: (action: Exclude<KidsAction, 'tick'>) => void;
  disabled: boolean; primaryRef: RefObject<HTMLButtonElement>;
}) {
  const welcome = game.phase === 'welcome', finale = game.phase === 'superbluff';
  return <section class={`kids-show-interlude is-${game.phase}`}>
    <div class="kids-show-host">
      <blockquote>{professorSays(game)}</blockquote>
      <ProfessorBluff key={`${game.phase}:${game.index}`} mood={professorMood(game)} motion={professorMotion(game)}/>
      <span class="kids-professor-signature">Professor Bluff <KidsVoiceButton/></span>
    </div>
    <div class="kids-show-story">
      <p class="kids-eyebrow">{welcome ? 'WILLKOMMEN, BIBLEBLUFF-DETEKTIVE!' : finale ? 'ALLE TEAMS WERDEN GEBRAUCHT' : `KAPITEL ${chapter + 1}`}</p>
      <h1>{welcome ? 'Zusammen knacken wir jeden Bluff!' : finale ? 'Knackt den Superbluff!' : KIDS_CHAPTERS[chapter]}</h1>
      {finale ? <>
        <div class="kids-final-groups"><KidsGroupName group="minis"/><KidsGroupName group="mittis"/><KidsGroupName group="maxis"/><strong>Alle gemeinsam</strong></div>
        <p>Jetzt sind alle drei Teams zusammen dran.</p>
        <StoryPicture motif="stage"/>
        <p>Welche Geschichte spielen die Eltern?</p>
        <div class="kids-final-bonuses"><span>Professor Bluff <b>+0</b></span><span>Unser Team <b>bis zu +20</b></span></div>
      </> : <>
        {welcome ? <div class="kids-team-badges">{(['minis','mittis','maxis'] as const).map(g=><div key={g} class={`group-${g}`}><StoryPicture motif={KIDS_GROUPS[g].symbol}/><b><KidsGroupName group={g}/></b><span class="kids-group-ages">{KIDS_GROUPS[g].ages}</span></div>)}</div> : <>
          <StoryPicture motif={CHAPTER_PICTURES[chapter]}/>
          <div class="kids-chapter-groups">{(['minis','mittis','maxis'] as const).map(g=><KidsGroupName key={g} group={g}/>)}</div>
        </>}
        <p>{welcome ? <>Wir sammeln alle für EIN Team.<br/><span class="kids-welcome-promise">Niemand scheidet aus. Alle gehören dazu!</span></> : chapter === 0 ? 'Eure erste Spur wartet auf alle drei Gruppen!' : chapter === 1 ? 'Zusammen findet ihr die nächste Spur!' : 'Jeder Beitrag zählt. Gemeinsam geht die Punktejagd weiter!'}</p>
        {!welcome && <ol class="kids-chapter-progress" aria-label="Kapitelfortschritt">{[0,1,2].map(i=><li key={i} aria-current={i === chapter ? 'step' : undefined} class={i <= chapter ? 'is-reached' : ''}>{i + 1}</li>)}</ol>}
      </>}
      {!game.introVideo && <KidsIntroControls game={game} act={act} disabled={disabled}/>}
      <ShowControls game={game} act={act} disabled={disabled || !!game.introVideo} primaryRef={primaryRef}/>
    </div>
  </section>;
}
