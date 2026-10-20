import type { RefObject } from 'preact';
import { kidsResultPoints, type KidsAction, type KidsGame } from '../../shared/kids-game';
import { ProfessorBluff, ShowControls } from './KidsShow';
import { Kid, Spark } from './KidsCuteParts';
import type { KidsGroup } from '../../shared/kids-show-questions';
import { professorMotion } from '../lib/professor-motion';

/** Gewänder in den Gruppenfarben; im Finale laufen alle drei Farben gemeinsam. */
const ROBES: Record<KidsGroup, string[]> = { minis: ['#7fe0c4'], mittis: ['#ffd36a'], maxis: ['#f79aa8'], all: ['#7fe0c4', '#ffd36a', '#f79aa8'] };
/** Jede Gruppe ist bunt gemischt: In jedem Dreierpulk steht mindestens ein dunkelhäutiges Kind. */
const LOOKS = [
  { skin: '#ffdcc4', hair: '#8a5a3c' }, { skin: '#8a5636', hair: '#1f1611', curly: true }, { skin: '#f2c49b', hair: '#e0a84a' },
  { skin: '#c88a5c', hair: '#3d2a1e' }, { skin: '#ffe1cc', hair: '#c0703a' }, { skin: '#6b4027', hair: '#1f1611', curly: true },
  { skin: '#a8693f', hair: '#2b1d14', curly: true }, { skin: '#ffdcc4', hair: '#5a3a28' }, { skin: '#e8b48a', hair: '#2b1d14' },
];
const FIELDS = ['#ffdc72', '#9cf1dc', '#f8a1ad'];

/** Rückweg: Die aktive Gruppe läuft von den Feldern zu ihrem Platz. Danach stehen alle drei Gruppen beisammen. */
function RegroupPicture({ returned, group }: { returned: boolean; group: KidsGroup }) {
  const robe = (i: number) => ROBES[group][i % ROBES[group].length];
  return <svg class="kids-regroup-picture" viewBox="0 0 520 200" stroke="#12324a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {returned ? <>
      <ellipse cx="260" cy="150" rx="236" ry="22" fill="#d7eee2"/>
      {[120, 260, 400].map((x, i) => <g class="kids-regroup-friends" key={x} style={{ '--delay': `${i * 150}ms` }}>
        {[-36, 36, 0].map((dx, j) => <Kid key={dx} x={x + dx} y={dx ? 98 : 86} s={.85} robe={ROBES.all[i]} {...LOOKS[i * 3 + j]}/>)}
      </g>)}
      <g class="kids-regroup-check"><circle cx="260" cy="34" r="24" fill="#14795e" stroke="#fffdf1" stroke-width="4"/><path d="m248 34 8 8 16-18" fill="none" stroke="#fff" stroke-width="5"/></g>
      <Spark x={60} y={48} r={9}/><Spark x={462} y={42} r={8}/>
    </> : <>
      {FIELDS.map((fill, i) => <g key={fill} transform={`rotate(${[-6, 4, -3][i]} ${37 + i * 44} 137)`}>
        <path d={`M${37 + i * 44} 162v18`} stroke-width="4"/>
        <rect x={18 + i * 44} y="112" width="38" height="50" rx="10" fill={fill}/>
        <text x={37 + i * 44} y="148" text-anchor="middle" font-size="30" font-weight="900" fill="#12324a" stroke="none">{i + 1}</text>
      </g>)}
      <g class="kids-regroup-arrow"><path d="M160 178q95-30 190 0" fill="none" stroke="#7cbfae" stroke-width="5" stroke-dasharray="1 13"/><path d="m336 166 16 12-18 8" fill="none" stroke="#168579" stroke-width="5"/></g>
      <ellipse cx="435" cy="150" rx="78" ry="16" fill="#d7eee2"/>
      {[396, 474, 435].map((x, i) => <Kid key={x} x={x} y={x === 435 ? 96 : 102} s={.72} robe={robe(i)} {...LOOKS[i + 3]}/>)}
      {[0, 1, 2].map(i => <g class="kids-regroup-walker" key={i} style={{ '--delay': `${i * 400}ms` }}><Kid x={126 + i * 30} y={120 + (i % 2) * 5} s={.6} robe={robe(i)} {...LOOKS[i + 6]}/></g>)}
      <Spark x={250} y={56} r={8}/><Spark x={480} y={44} r={7}/>
    </>}
  </svg>;
}
export function KidsRegroup({ game, act, disabled, primaryRef }: { game: KidsGame; act: (action: Exclude<KidsAction,'tick'>)=>void; disabled:boolean; primaryRef:RefObject<HTMLButtonElement> }) {
  const returned=game.phase==='judging';
  return <section class={`kids-regroup is-${game.phase}`} aria-labelledby="kids-regroup-title">
    <div class="kids-regroup-professor"><ProfessorBluff key={game.phase} motion={professorMotion(game)}/><blockquote class="kids-regroup-bubble">{returned ? 'Gleich kommt die Auflösung!' : 'Wir warten auf euch!'}</blockquote></div>
    <div class="kids-regroup-content">
      <p class="kids-eyebrow">{returned ? 'ALLE WIEDER ZUSAMMEN' : 'DIE ANTWORT BLEIBT NOCH GEHEIM'}</p>
      <h1 id="kids-regroup-title">{returned ? 'Alle sind zurück!' : 'Alle zurück zu eurer Gruppe!'}</h1>
      <p class="kids-regroup-instruction">{returned ? 'Bleibt bei eurer Gruppe. Gleich kommt die Auflösung!' : 'Geht ruhig zurück. Wir warten, bis alle da sind.'}</p>
      <RegroupPicture key={game.phase} returned={returned} group={game.rounds[game.index].question.group}/>
    </div>
    <div class="kids-regroup-operator"><ShowControls game={game} act={act} disabled={disabled} primaryRef={primaryRef}/><p>{returned ? `Spielleitung: Helfer melden das Ergebnis. Bei richtiger Mehrheit +${kidsResultPoints('correct', game.index)} wählen.` : 'Spielleitung: Erst bestätigen, wenn alle Kinder wieder bei ihrer Gruppe sind.'}</p></div>
  </section>;
}
