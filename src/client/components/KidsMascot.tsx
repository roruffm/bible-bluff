import type { KidsGroup } from '../../shared/kids-show-questions';
import { Face } from './KidsCuteParts';

/** Die Gruppensymbole als kleine Mitspieler mit Armen: Leuchtlupe, Stern und Fackel. Rein schmückend. */
export function KidsMascot({ group }: { group: Exclude<KidsGroup, 'all'> }) {
  return <svg class={`kids-mascot is-${group}`} viewBox="0 0 140 150" aria-hidden="true">
    <g stroke="#12324a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      {group === 'minis' ? <>
        <path class="kids-mascot-arms" d="M36 74 14 44M104 74l22-30" fill="none" stroke-width="6"/>
        <circle cx="13" cy="41" r="8" fill="#ffd96a"/><circle cx="127" cy="41" r="8" fill="#ffd96a"/>
        <path d="m92 98 24 30" stroke-width="20"/><path d="m92 98 24 30" stroke="#d8a34e" stroke-width="11"/>
        <circle cx="70" cy="70" r="44" fill="#ffd96a" stroke-width="5"/><circle cx="70" cy="70" r="34" fill="#fff6c2"/>
        <path d="M44 58a28 28 0 0 1 18-18" fill="none" stroke="#fffdf6" stroke-width="6" opacity=".9"/>
        <Face x={70} y={70} s={1.05}/>
      </> : group === 'mittis' ? <>
        <circle cx="16" cy="56" r="8" fill="#ffd96a"/><circle cx="124" cy="56" r="8" fill="#ffd96a"/>
        <path d="M70 8l17 37 40 4-30 27 9 40-36-21-36 21 9-40-30-27 40-4z" fill="#ffd05a" stroke-width="5"/>
        <path d="M44 132q8-8 14 0m24 0q6-8 14 0" fill="none" stroke-width="5"/>
        <Face x={70} y={70} s={1.05}/>
      </> : <>
        <path class="kids-mascot-arms" d="M46 92 22 66M94 92l24-26" fill="none" stroke-width="6"/>
        <circle cx="20" cy="63" r="8" fill="#ffd96a"/><circle cx="120" cy="63" r="8" fill="#ffd96a"/>
        <path d="M56 96h28l-6 46H62z" fill="#c99467"/><path d="M46 88h48l-6 12H52z" fill="#e0a26a"/>
        <path d="M70 6c10 18 32 26 26 52-4 16-16 26-26 26S48 74 44 58C40 40 52 30 58 20c2 10 8 12 8 12s6-12 4-26z" fill="#ff9c45" stroke-width="5"/>
        <path d="M70 34c6 12 18 16 14 30-3 9-8 12-14 12s-11-3-14-12c-3-12 8-18 14-30z" fill="#ffe679" stroke="none"/>
        <Face x={70} y={62} s={.95}/>
      </>}
    </g>
  </svg>;
}
