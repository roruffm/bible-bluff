import type { RefObject } from 'preact';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { ProfessorBluff, ShowControls } from './KidsShow';
import { ChildFigure } from './KidsChildrenArt';

function RegroupPicture({ returned }: { returned: boolean }) {
  return <svg class="kids-regroup-picture" viewBox="0 0 520 160" aria-hidden="true">
    {returned ? <>
      <rect x="65" y="35" width="390" height="115" rx="44" fill="#d7eee2" stroke="#76b299" stroke-width="3"/>
      {[120,245,370].map((x,i)=><g class="kids-regroup-friends" key={x} style={{'--delay':`${i*150}ms`}}>{[-23,0,23].map((dx,j)=><g key={j} transform={`translate(${x+dx} ${j===1?85:100}) scale(1.35)`}><ChildFigure index={i*3+j}/></g>)}</g>)}
      <g class="kids-regroup-check"><circle cx="260" cy="30" r="25" fill="#14795e" stroke="#fffdf1" stroke-width="4"/><path d="m247 29 9 9 17-20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
    </> : <>
      {[0,1,2].map((i)=><g key={i}><rect x={12+i*36} y="88" width="31" height="48" rx="8" fill={['#ffe29b','#a4e6de','#fac4d0'][i]} stroke="#12324a" stroke-width="2"/><text x={27+i*36} y="121" text-anchor="middle" font-size="25" font-weight="900" fill="#12324a">{i+1}</text></g>)}
      <path class="kids-regroup-arrow" d="M143 110h196m-18-17 18 17-18 17" fill="none" stroke="#168579" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="365" y="36" width="145" height="110" rx="35" fill="#d7eee2" stroke="#76b299" stroke-width="3"/>
      {[403,438,473].map((x,i)=><g key={x} transform={`translate(${x} ${i===1?75:91}) scale(1.3)`}><ChildFigure index={i+3}/></g>)}
      {[0,1,2].map((i)=><g class="kids-regroup-walker" key={i} style={{'--delay':`${i*400}ms`}}><g transform={`translate(${122+i*15} ${61+i*3}) scale(1.2)`}><ChildFigure index={i}/></g></g>)}
    </>}
  </svg>;
}
export function KidsRegroup({ game, act, disabled, primaryRef }: { game: KidsGame; act: (action: Exclude<KidsAction,'tick'>)=>void; disabled:boolean; primaryRef:RefObject<HTMLButtonElement> }) {
  const returned=game.phase==='judging';
  return <section class={`kids-regroup is-${game.phase}`} aria-labelledby="kids-regroup-title">
    <div class="kids-regroup-professor"><ProfessorBluff/><span>Professor Bluff</span></div>
    <div class="kids-regroup-content">
      <p class="kids-eyebrow">{returned ? 'ALLE WIEDER ZUSAMMEN' : 'DIE ANTWORT BLEIBT NOCH GEHEIM'}</p>
      <h1 id="kids-regroup-title">{returned ? 'Alle sind zurück!' : 'Alle zurück zu eurer Gruppe!'}</h1>
      <p class="kids-regroup-instruction">{returned ? 'Bleibt bei eurer Gruppe. Gleich kommt die Auflösung!' : 'Geht ruhig zurück. Wir warten, bis alle da sind.'}</p>
      <RegroupPicture key={game.phase} returned={returned}/>
    </div>
    <div class="kids-regroup-operator"><ShowControls game={game} act={act} disabled={disabled} primaryRef={primaryRef}/><p>{returned ? 'Spielleitung: Helfer melden das Ergebnis. Bei richtiger Mehrheit immer +10 wählen.' : 'Spielleitung: Erst bestätigen, wenn alle Kinder wieder bei ihrer Gruppe sind.'}</p></div>
  </section>;
}
