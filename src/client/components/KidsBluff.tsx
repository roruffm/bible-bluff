import { KidsGroupName } from './KidsGroupName';
import { ProfessorHead, StoryPicture } from './KidsShow';
import { Face } from './KidsCuteParts';
import { KidsFieldShape } from './KidsField';
import type { KidsRound } from '../../shared/kids-game';
import { KIDS_CHEERS, kidsAnswerPicture, type KidsGroup } from '../../shared/kids-show-questions';
import './kids-bluff.css';

/** Kleiner Professor-Kopf am Feld, auf das Professor Bluff tippt. Auch Kinder, die noch nicht lesen, sehen seinen Tipp. */
export function BluffPin() {
  return <span class="kids-bluff-pin" role="img" aria-label="Professor Bluff tippt auf dieses Feld"><span aria-hidden="true"><ProfessorHead/></span><b aria-hidden="true">?</b></span>;
}

/** Professor Bluffs Behauptung zur laufenden Aufgabe. Sie ist immer ein Bluff, den die Kinder entlarven. */
export function BluffClaim({ text }: { text: string }) {
  return <div class="kids-discovery kids-bluff-claim">
    <span class="kids-bluff-claim-head" aria-hidden="true"><ProfessorHead/></span>
    <div><small>PROFESSOR BLUFF BEHAUPTET</small><p>{text}</p></div>
    <span class="kids-bluff-question">Stimmt das?</span>
  </div>;
}

/** Feste Mitmach-Geste für alle Gruppen, die gerade nicht laufen. */
export function KidsCheers({ active }: { active: Exclude<KidsGroup, 'all'> }) {
  return <span class="kids-cheers">{(['minis', 'mittis', 'maxis'] as const).filter(group => group !== active).map(group =>
    <span key={group} class="kids-cheer" data-group={group}><span class="kids-cheer-icon" aria-hidden="true">{KIDS_CHEERS[group].icon}</span><KidsGroupName group={group}/> {KIDS_CHEERS[group].verb}</span>)}
  </span>;
}

const octagon = (r: number) => Array.from({ length: 8 }, (_, i) => { const a = (22.5 + i * 45) * Math.PI / 180; return `${60 + Math.cos(a) * r} ${58 + Math.sin(a) * r}`; }).join('L');
/** Freundliches Stoppschild, sobald die Antwortzeit vorbei ist; links und rechts der Frage. */
export function KidsStopSign({ side }: { side: 'left' | 'right' }) {
  return <svg class={`kids-stop-sign is-${side}`} viewBox="0 0 120 150" aria-hidden="true"><g stroke="#12324a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M54 104h12v42H54z" fill="#b9c3cc"/>
    <path d={`M${octagon(54)}z`} fill="#ff6b6b"/><path d={`M${octagon(46)}z`} fill="none" stroke="#fff" stroke-width="3"/>
    <Face x={60} y={37} s={.7}/>
    <text x="60" y="79" text-anchor="middle" font-size="21" font-weight="900" fill="#fff" stroke="none">STOPP</text>
  </g></svg>;
}

/** Große Zahl zum lauten Mitzählen in den letzten fünf Sekunden. */
export function KidsCountdown({ seconds }: { seconds: number }) {
  return <div class="kids-countdown" aria-hidden="true"><span key={seconds}>{seconds}</span></div>;
}

/** Trommelwirbel vor der Auflösung: Erst drehen sich die falschen Felder auf ihre Bluff-Rückseite, Professor Bluffs Tipp zuletzt. Dann leuchtet die Wahrheit. */
export function KidsSuspense({ round }: { round: KidsRound }) {
  const pick = (i: number) => round.answers[i] === round.question.bluff.answer ? 1 : 0;
  const wrong = [0, 1, 2].filter(i => i !== round.correctIndex).sort((a, b) => pick(a) - pick(b));
  return <div class="kids-suspense" role="status">
    <p class="kids-suspense-title">Trommelwirbel …</p>
    <ol class="kids-suspense-cards" aria-hidden="true">{round.answers.map((answer, i) => {
      const truth = i === round.correctIndex;
      return <li key={i} class={`kids-suspense-card kids-field-${i + 1} ${truth ? 'is-truth' : 'is-bluff'}`} style={{ '--step': truth ? 2 : wrong.indexOf(i) }}>
        <span class="kids-suspense-number">{i + 1}<KidsFieldShape index={i}/></span>
        <StoryPicture motif={kidsAnswerPicture(round.question, answer)}/>
        <span class="kids-suspense-text">{answer}</span>
        {!truth && <span class="kids-suspense-back"><span class="kids-suspense-back-face"><ProfessorHead/></span></span>}
        {truth ? <span class="kids-truth-mark">✓</span> : <span class="kids-bluff-stamp">BLUFF!</span>}
        {answer === round.question.bluff.answer && <BluffPin/>}
      </li>;
    })}</ol>
  </div>;
}
