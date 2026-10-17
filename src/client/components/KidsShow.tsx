import { kidsRoundReaction } from '../lib/kids-reactions';
import { AnswerMotifArt } from './KidsAnswerArt';
import type { ProfessorMood } from './ProfessorBluff';
export { ProfessorBluff, ProfessorHead } from './ProfessorBluff';
export type { ProfessorMood } from './ProfessorBluff';
import type { RefObject } from 'preact';
import { kidsActionLabel, kidsCanScore, kidsOvertook, kidsPrimaryAction, kidsScores, type KidsAction, type KidsGame } from '../../shared/kids-game';
import { type StoryMotif } from '../../shared/kids-show-questions';

export function professorMood(game: KidsGame): ProfessorMood {
  const s = kidsScores(game);
  if (game.phase === 'revealed') return kidsRoundReaction(game).mood;
  if (game.phase === 'finished') return 'kind';
  if (game.phase === 'superbluff') return 'panic';
  if (s.team >= s.professor && s.playedRounds > 3) return 'panic';
  return s.team >= s.professor && s.playedRounds > 0 ? 'nervous' : 'confident';
}
/** In diesen Phasen steht Professor Bluffs Behauptung zur laufenden Aufgabe am Beamer. */
export function kidsClaimPhase(phase: KidsGame['phase']): boolean { return ['reading','moving','paused','locked'].includes(phase); }
export function professorSays(game: KidsGame): string {
  if (game.phase === 'welcome') return 'Ha! Drei Detektivteams gegen MEIN Superhirn? Das wird ja heiter!';
  if (game.phase === 'superbluff') return 'ALARM! Mein Superbluff! Zehn Punkte für mich … aber ihr könnt sie auch holen!';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'Ihr habt meinen Bluff geknackt! Hut ab, ihr großartigen Detektive. Es war wunderbar mit euch!' : 'Meine Punkte kann ich zählen. Euer Zusammenhalt ist unbezahlbar! Danke, ihr großartigen Detektive!';
  if (game.phase === 'revealed') return kidsRoundReaction(game).quote;
  if (kidsClaimPhase(game.phase)) return `„${game.rounds[game.index].question.bluff.claim}“`;
  if (game.index >= 6) return 'Nur noch ein Kapitel! Meine Knie zittern? Das ist mein Denk-Tanz!';
  if (game.index >= 3) return 'Das war nur die Aufwärmrunde. Jetzt wird geblufft!';
  return 'Ich bin Professor Bluff. Mein Spezialgebiet? Mich selbst überschätzen!';
}
export function StoryPicture({ motif, animated = false }: { motif: StoryMotif; animated?: boolean }) {
  return <svg class={`kids-story-picture${animated ? ' is-animated' : ''}`} viewBox="0 0 220 140" aria-hidden="true" data-motif={motif}>
    <ellipse cx="110" cy="128" rx="91" ry="8" fill="#12324a15"/>
    <g stroke="#12324a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <AnswerMotifArt motif={motif}/>
      {(motif === 'ark' || motif === 'boat') && <g class="story-bob"><path d="M26 87h168l-27 36H58z" fill="#c8884b"/><path d="M42 101h134M62 114h103" fill="none" stroke="#986238"/>{motif === 'ark' ? <><path d="M60 86V42h101v44" fill="#ffd978"/><path d="m48 43 62-28 63 28z" fill="#d76b60"/><path d="M86 86V62h43v24" fill="#fff7da"/><path d="M64 56h12m70 0h12"/><circle cx="94" cy="70" r="7" fill="#f0c78c"/><circle cx="121" cy="70" r="7" fill="#b6d7ac"/><path d="m120 63 1-16 7 3" fill="none"/></> : <><path d="M110 85V19l49 57h-49" fill="#fffdf1"/><path d="M63 81q20-19 42 0" fill="#9c8cc8"/><rect x="54" y="76" width="24" height="12" rx="6" fill="#fff"/></>}<path class="story-waves" d="M10 126q17-12 34 0t34 0 34 0 34 0 34 0 34 0" fill="none" stroke="#328eae"/></g>}
      {motif === 'manger' && <><path d="m52 78 18 38h83l16-38z" fill="#bd874f"/><path d="m69 113-12 17m95-17 12 17"/><path d="m58 76 15-13 17 12 15-15 17 16 17-15 23 16" fill="#ffdc74"/><ellipse cx="116" cy="76" rx="34" ry="18" fill="#f8f1d5"/><circle cx="87" cy="72" r="14" fill="#efb98e"/><path d="m82 71 3 2m7-3 2 2"/><path d="m110 8 5 12 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1z" fill="#ffd362" stroke="#b08121"/></>}
      {motif === 'lion' && <><path d="M48 114q27-42 62 0m15 0q25-42 55 0" fill="#e8b65a"/><circle cx="75" cy="74" r="42" fill="#bc7843"/><circle cx="75" cy="78" r="28" fill="#ffd67c"/><circle cx="152" cy="74" r="42" fill="#bc7843"/><circle cx="152" cy="78" r="28" fill="#ffd67c"/>{[75,152].map(x=><g key={x}><path d={`m${x-14} 73q5-7 10 0m9 0q5-7 10 0`} fill="none"/><path d={`m${x-5} 85h10l-5 6z`} fill="#12324a"/><path d={`M${x} 91v6m-11-1q11 10 22 0`} fill="none"/></g>)}</>}
      {(motif === 'fish' || motif === 'coin') && <><path class="story-bob" d="M45 75q50-65 112 0-62 66-112 0L20 48v54z" fill="#73cfce"/><circle cx="139" cy="69" r="5" fill="#12324a"/><path d="m91 42 20-23 10 23M70 79l19-9-4 19" fill="#54aaa9"/>{motif === 'coin' && <g><circle cx="168" cy="92" r="27" fill="#ffd362"/><circle cx="168" cy="92" r="19" fill="none" stroke="#b18426"/><path d="M168 80v24m-6-22 6-3" stroke="#b18426"/></g>}</>}
      {motif === 'leaf' && <><path d="m63 119 87-89" fill="none" stroke="#418d60" stroke-width="7"/>{[[78,99,-45],[98,79,-45],[119,58,-45],[94,107,45],[115,86,45],[137,65,45]].map(([x,y,a],i)=><ellipse key={i} cx={x} cy={y} rx="13" ry="25" transform={`rotate(${a} ${x} ${y})`} fill={i%2 ? '#8fcd7c' : '#5caf79'}/>)}</>}
      {motif === 'bread' && <><path d="M42 109V77q0-36 46-36t46 36v32z" fill="#df9e50"/><path d="m62 60 12 22m11-27 12 23m13-17 10 19" stroke="#fff0ad" stroke-width="6"/></>}
      {motif === 'tree' && <><path d="M99 78h26v51H99z" fill="#bd874f"/><path d="M72 91q-45-20-15-53 4-35 40-27 30-21 47 9 44-1 39 37 14 33-25 39z" fill="#8fcd7c"/><path d="m111 103 25-26m-26 11-27-18" fill="none"/></>}
      {motif === 'donkey' && <><path d="m76 55-5-43q7-17 17 0l9 42m28 0 10-42q12-16 16 3l-7 44" fill="#aaa8b6"/><path d="M65 72q0-36 43-36t47 36v30q-44 38-90 0z" fill="#aaa8b6"/><ellipse cx="110" cy="99" rx="46" ry="26" fill="#e4d5c3"/><circle cx="89" cy="72" r="4" fill="#12324a"/><circle cx="131" cy="72" r="4" fill="#12324a"/><path d="m98 102 1 2m23-2-1 2m-18 10q8 5 16 0" fill="none"/></>}
      {motif === 'twins' && <>{[76,146].map(x=><g key={x}><path d={`M${x-27} 125v-30q27-29 54 0v30`} fill="#81cfbd"/><circle cx={x} cy="60" r="26" fill="#efb98e"/><path d={`M${x-26} 58q-5-40 26-32 31-8 26 32l-16-15-10 7-10-7z`} fill="#8e654b"/><path d={`m${x-10} 63 1 1m18-1 1 1m-17 11q7 8 14 0`} fill="none"/></g>)}</>}
      {motif === 'crown' && <><path d="m40 43 33 29 37-48 37 48 33-29-14 69H54z" fill="#ffd362"/><path d="M53 96h114"/><circle cx="110" cy="82" r="9" fill="#e88b9d"/></>}
    </g>
  </svg>;
}
/** Ein gemeinsamer Punktestand hält die Spielfläche frei; die Wertung bleibt bis zur Auflösung verborgen. */
export function ShowScoreboard({ game, hiddenIndex = -1 }: { game: KidsGame; hiddenIndex?: number }) {
  const s = kidsScores(game, hiddenIndex);
  const overtook = game.phase === 'revealed' && hiddenIndex !== game.index && kidsOvertook(game);
  return <section class="kids-scoreboard kids-compact-score" aria-label={`Gemeinsame Punktejagd: Kinderteam ${s.team}, Professor Bluff ${s.professor}`}>
    <span class="kids-score-label">Unser Team</span><strong class="kids-score-team" data-testid="team-score">{s.team}</strong>
    <span class="kids-score-colon" aria-hidden="true">:</span><strong class="kids-score-professor" data-testid="prof-score">{s.professor}</strong><span class="kids-score-label">Professor Bluff</span>
    {overtook && <b class="kids-score-overtake">Überholt!</b>}
  </section>;
}
export function ShowControls({ game, act, disabled = false, primaryRef }: { game: KidsGame; act: (action: Exclude<KidsAction, 'tick'>) => void; disabled?: boolean; primaryRef?: RefObject<HTMLButtonElement> }) {
  const action = kidsPrimaryAction(game), scoring = kidsCanScore(game);
  return <div class={`kids-controls${scoring ? ' is-judging' : ''}`}>
    {scoring ? <div class="kids-score-actions" aria-label="Mehrheitsresultat eintragen">
      <button class="kids-button kids-primary" type="button" disabled={disabled} onClick={() => act('correct')}>Mehrheit richtig · +10</button>
      <button class="kids-button" type="button" disabled={disabled} onClick={() => act('participated')}>Mindestens ein Kind richtig · +5</button>
      <button class="kids-tool" type="button" disabled={disabled} onClick={() => act('none')}>Keiner richtig · +0</button>
    </div> : game.phase === 'moving' ? <button type="button" class="kids-button" disabled={disabled} onClick={() => act('pause')}>Ⅱ Pause</button> : action && <button ref={primaryRef} type="button" class="kids-button kids-primary" disabled={disabled} onClick={() => act(action)}>{kidsActionLabel(game)}</button>}
  </div>;
}
