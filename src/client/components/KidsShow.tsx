import { kidsRoundReaction } from '../lib/kids-reactions';
import type { ProfessorMood } from './ProfessorBluff';
export { ProfessorBluff, ProfessorHead } from './ProfessorBluff';
export { StoryPicture } from './KidsStoryArt';
export type { ProfessorMood } from './ProfessorBluff';
import type { RefObject } from 'preact';
import { kidsActionLabel, kidsCanScore, kidsOvertook, kidsPrimaryAction, kidsResultPoints, kidsScores, type KidsAction, type KidsGame } from '../../shared/kids-game';

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
  if (game.phase === 'superbluff') return 'ALARM! Mein Superbluff! Jetzt könnt ihr zusammen bis zu zwanzig Punkte holen! Für mich gibt es diesmal keine neuen Punkte!';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'Ihr habt meinen Bluff geknackt! Hut ab, ihr großartigen Detektive. Es war wunderbar mit euch!' : 'Meine Punkte kann ich zählen. Euer Zusammenhalt ist unbezahlbar! Danke, ihr großartigen Detektive!';
  if (game.phase === 'revealed') return kidsRoundReaction(game).quote;
  if (kidsClaimPhase(game.phase)) return `„${game.rounds[game.index].question.bluff.claim}“`;
  if (game.index >= 6) return 'Nur noch ein Kapitel! Meine Knie zittern? Das ist mein Denk-Tanz!';
  if (game.index >= 3) return 'Das war nur die Aufwärmrunde. Jetzt wird geblufft!';
  return 'Ich bin Professor Bluff. Mein Spezialgebiet? Mich selbst überschätzen!';
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
      <button class="kids-button kids-primary" type="button" disabled={disabled} onClick={() => act('correct')}>Mehrheit richtig · +{kidsResultPoints('correct', game.index)}</button>
      <button class="kids-button" type="button" disabled={disabled} onClick={() => act('participated')}>Mindestens ein Kind richtig · +{kidsResultPoints('participated', game.index)}</button>
      <button class="kids-tool" type="button" disabled={disabled} onClick={() => act('none')}>Keiner richtig · +0</button>
    </div> : game.phase === 'moving' ? <button type="button" class="kids-button" disabled={disabled} onClick={() => act('pause')}>Ⅱ Pause</button> : action && <button ref={primaryRef} type="button" class="kids-button kids-primary" disabled={disabled} onClick={() => act(action)}>{kidsActionLabel(game)}</button>}
  </div>;
}
