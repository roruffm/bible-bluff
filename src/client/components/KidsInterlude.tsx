import type { RefObject } from 'preact';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { KIDS_CHAPTERS, KIDS_GROUPS } from '../../shared/kids-show-questions';
import { professorMotion } from '../lib/professor-motion';
import { KidsGroupName } from './KidsGroupName';
import { KidsVoiceButton } from './KidsVoice';
import { ProfessorBluff, professorMood, professorSays, ShowControls, StoryPicture } from './KidsShow';

function ChapterPicture() {
  return <svg class="kids-chapter-picture" viewBox="0 0 240 180" aria-hidden="true">
    <ellipse cx="120" cy="165" rx="85" ry="9" fill="#12324a18"/>
    <path d="m91 113-58 44q-10 7-17-3t2-17l59-43" fill="#bc8142" stroke="#12324a" stroke-width="7"/>
    <circle cx="137" cy="76" r="62" fill="#ffd362" stroke="#12324a" stroke-width="7"/>
    <circle cx="137" cy="76" r="48" fill="#bceafa" stroke="#12324a" stroke-width="6"/>
    <path d="M119 58q0-21 20-21 21 0 21 19 0 14-17 21-6 3-6 11" fill="none" stroke="#12324a" stroke-width="12" stroke-linecap="round"/>
    <circle cx="137" cy="108" r="7" fill="#12324a"/>
  </svg>;
}

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
        <StoryPicture motif="boat"/>
        <p>Welche Geschichte spielen die Eltern?</p>
        <div class="kids-final-bonuses"><span>Professor Bluff <b>+0</b></span><span>Unser Team <b>bis zu +20</b></span></div>
      </> : <>
        {!welcome && <ChapterPicture/>}
        <div class="kids-team-badges">{(['minis','mittis','maxis'] as const).map(g=><div key={g}><b><KidsGroupName group={g}/></b><span class="kids-group-ages">{KIDS_GROUPS[g].ages}</span></div>)}</div>
        <p>{welcome ? <>Wir sammeln alle für EIN Team.<br/><span class="kids-welcome-promise">Niemand scheidet aus. Alle gehören dazu!</span></> : chapter === 0 ? 'Eure erste Spur wartet auf alle drei Gruppen!' : chapter === 1 ? 'Zusammen findet ihr die nächste Spur!' : 'Jeder Beitrag zählt. Gemeinsam geht die Punktejagd weiter!'}</p>
        {!welcome && <ol class="kids-chapter-progress" aria-label="Kapitelfortschritt">{[0,1,2].map(i=><li key={i} aria-current={i === chapter ? 'step' : undefined} class={i <= chapter ? 'is-reached' : ''}>{i + 1}</li>)}</ol>}
      </>}
      <ShowControls game={game} act={act} disabled={disabled} primaryRef={primaryRef}/>
    </div>
  </section>;
}
