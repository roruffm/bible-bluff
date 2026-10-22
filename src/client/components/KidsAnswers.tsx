import type { KidsGame } from '../../shared/kids-game';
import { kidsAnswerLabel, kidsAnswerPicture } from '../../shared/kids-show-questions';
import { BluffPin } from './KidsBluff';
import { StoryPicture } from './KidsStoryArt';
import { KidsFieldShape } from './KidsField';
import { useKidsSpokenAnswer } from './KidsVoice';

export function KidsAnswers({ game }: { game: KidsGame }) {
  const field = useKidsSpokenAnswer();
  const round = game.rounds[game.index];
  return <ol class={`kids-answers has-pictures${field !== null ? ' is-reading-answers' : ''}`} aria-label="Antworten und Spielfelder">
    {round.answers.map((answer, i) => <li key={`${game.index}-${i}`}
      class={`kids-answer kids-field-${i + 1}${answer === round.question.bluff.answer ? ' is-bluff-pick' : ''}${field === i ? ' is-speaking' : ''}`}
      aria-current={field === i ? 'true' : undefined}>
      <span class="kids-number">{i + 1}<KidsFieldShape index={i}/></span><StoryPicture motif={kidsAnswerPicture(round.question, answer)}/>
      <span class="kids-answer-text">{kidsAnswerLabel(round.question, answer)}</span>{answer === round.question.bluff.answer && <BluffPin/>}
    </li>)}
  </ol>;
}
