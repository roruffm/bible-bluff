import type { KidsGroup } from '../../shared/kids-show-questions';
import { Face } from './KidsCuteParts';
import './kids-mascot.css';

/** Bewegliche Arme, Füße und Mimik geben jeder Gruppe einen eigenen kleinen Tanz. */
function MascotFace({ y = 70, s = 1.05 }: { y?: number; s?: number }) {
  return <g class="kids-mascot-face">
    <Face x={70} y={y} s={s}/>
    <g class="kids-mascot-laugh">
      <ellipse cx="70" cy={y + 11 * s} rx={7 * s} ry={6 * s} fill="#12324a" stroke="none"/>
      <path d={`M${70 - 4 * s} ${y + 14 * s}q${4 * s} ${-3 * s} ${8 * s} 0`} stroke="#ff9fb4" stroke-width="3" fill="none"/>
    </g>
  </g>;
}
function MascotArm({ side, x, y, handX, handY }: { side: 'left' | 'right'; x: number; y: number; handX: number; handY: number }) {
  return <g class={`kids-mascot-arm is-${side}`} style={{ transformOrigin: `${x}px ${y}px` }}>
    <path d={`M${x} ${y}Q${handX} ${y - 7} ${handX} ${handY}`} fill="none" stroke-width="6"/>
    <g class="kids-mascot-hand" style={{ transformOrigin: `${handX}px ${handY}px` }}>
      <circle cx={handX} cy={handY} r="8" fill="#ffd96a"/>
      <path d={`m${handX - 3} ${handY - 4} 1-6m4 6 2-5`} stroke-width="3"/>
    </g>
  </g>;
}
function MascotFoot({ side, torch = false }: { side: 'left' | 'right'; torch?: boolean }) {
  const left = side === 'left', x = left ? (torch ? 64 : 55) : (torch ? 76 : 85), y = torch ? 128 : 108;
  const footX = x + (left ? -11 : 11), footY = torch ? 143 : 132;
  return <g class={`kids-mascot-foot is-${side}`} style={{ transformOrigin: `${x}px ${y}px` }}>
    <path d={`M${x} ${y}q${left ? -7 : 7} 8 ${left ? -4 : 4} ${footY - y - 2}`} fill="none" stroke-width="5"/>
    <ellipse cx={footX} cy={footY} rx="10" ry="5" fill="#fff6c2" stroke-width="3"/>
  </g>;
}

/** Die vorhandenen Gruppensymbole bleiben erkennbar; die Gelenke bewegen sich unabhängig voneinander. */
export function KidsMascot({ group, motion = 'quiet' }: { group: Exclude<KidsGroup, 'all'>; motion?: 'quiet' | 'greeting' | 'celebrating' | 'flying' }) {
  return <svg class={`kids-mascot is-${group} is-${motion}`} viewBox="0 0 140 150" aria-hidden="true">
    <g class="kids-mascot-dance" stroke="#12324a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <MascotFoot side="left" torch={group === 'maxis'}/><MascotFoot side="right" torch={group === 'maxis'}/>
      <MascotArm side="left" x={group === 'maxis' ? 46 : 36} y={group === 'maxis' ? 92 : 74} handX={group === 'maxis' ? 20 : 13} handY={group === 'maxis' ? 63 : 41}/>
      <MascotArm side="right" x={group === 'maxis' ? 94 : 104} y={group === 'maxis' ? 92 : 74} handX={group === 'maxis' ? 120 : 127} handY={group === 'maxis' ? 63 : 41}/>
      {group === 'minis' ? <>
        <path d="m92 98 24 30" stroke-width="20"/><path d="m92 98 24 30" stroke="#d8a34e" stroke-width="11"/>
        <circle cx="70" cy="70" r="44" fill="#ffd96a" stroke-width="5"/><circle cx="70" cy="70" r="34" fill="#fff6c2"/>
        <path d="M44 58a28 28 0 0 1 18-18" fill="none" stroke="#fffdf6" stroke-width="6" opacity=".9"/>
        <MascotFace/>
      </> : group === 'mittis' ? <>
        <path d="M70 8l17 37 40 4-30 27 9 40-36-21-36 21 9-40-30-27 40-4z" fill="#ffd05a" stroke-width="5"/>
        <MascotFace/>
      </> : <>
        <path d="M56 96h28l-6 46H62z" fill="#c99467"/><path d="M46 88h48l-6 12H52z" fill="#e0a26a"/>
        <g class="kids-mascot-flame">
          <path d="M70 6c10 18 32 26 26 52-4 16-16 26-26 26S48 74 44 58C40 40 52 30 58 20c2 10 8 12 8 12s6-12 4-26z" fill="#ff9c45" stroke-width="5"/>
          <path class="kids-mascot-flame-core" d="M70 34c6 12 18 16 14 30-3 9-8 12-14 12s-11-3-14-12c-3-12 8-18 14-30z" fill="#ffe679" stroke="none"/>
          <MascotFace y={62} s={.95}/>
        </g>
      </>}
    </g>
  </svg>;
}
