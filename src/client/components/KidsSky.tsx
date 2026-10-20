import type { KidsGame } from '../../shared/kids-game';

/** Feste Sternenkarte: gleichmäßig verteilt, aber in zufälliger Reihenfolge, damit der Himmel überall gleichzeitig voller wird. */
const STARS = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const stars = Array.from({ length: 56 }, (_, i) => ({ x: (i % 8 + next()) * 200, y: (Math.floor(i / 8) + next()) * 128, big: next() > .78, delay: Math.round(next() * 40) / 10, order: next() }));
  return stars.map((star, i) => ({ ...star, rank: stars.filter(other => other.order < star.order).length, i }));
})();
const FIRST_STARS = 8;

/** Häuschen am Horizont (x, Dachtraufe, Breite) und je Aufgabe ein Fenster; die Reihenfolge verteilt die Lichter über die ganze Breite. */
const HOUSES = [[250, 96, 64], [560, 76, 90], [700, 106, 60], [1120, 66, 70], [1240, 90, 80], [1440, 82, 64], [1640, 98, 56]];
const WINDOWS = [[260, 112], [282, 148], [574, 80], [612, 80], [718, 116], [1130, 80], [1152, 116], [1252, 104], [1286, 104], [1460, 98]];
const WINDOW_ORDER = [4, 0, 7, 2, 9, 5, 1, 8, 3, 6];

/** 0 zur Begrüßung, steigt mit jeder Aufgabe, die Finalrunde bringt die Dämmerung, der Abschluss den Morgen. */
export function kidsSkyProgress(game: KidsGame) {
  if (game.phase === 'finished') return 1;
  const done = game.index + (game.phase === 'revealed' ? 1 : 0);
  return Math.min(1, done / game.rounds.length);
}

/** Nachthimmel hinter der Bühne mit einem Horizont, an dem für jede gewertete Aufgabe ein Fenster aufleuchtet.
 * Rein schmückend: Die Kopfzeile nennt den Fortschritt in Worten. */
export function KidsSky({ game }: { game: KidsGame }) {
  const progress = kidsSkyProgress(game);
  const lit = Math.round(FIRST_STARS + progress * (STARS.length - FIRST_STARS));
  const windows = game.results.filter(result => result !== null).length;
  return <div class={`kids-sky${game.phase === 'finished' ? ' is-morning' : ''}`} style={{ '--sky': progress }} data-stars={lit} data-windows={windows} aria-hidden="true">
    <svg class="kids-sky-stars" viewBox="0 0 1600 896" preserveAspectRatio="xMidYMid slice">
      {STARS.map(star => star.big
        ? <path key={star.i} class={star.rank < lit ? 'is-lit' : undefined} style={{ '--delay': `${star.delay}s` }} d={`M${star.x} ${star.y - 12}q2.4 9.6 12 12q-9.6 2.4-12 12q-2.4-9.6-12-12q9.6-2.4 12-12z`}/>
        : <circle key={star.i} class={star.rank < lit ? 'is-lit' : undefined} style={{ '--delay': `${star.delay}s` }} cx={star.x} cy={star.y} r="3.2"/>)}
    </svg>
    <svg class="kids-skyline" viewBox="0 0 1920 330" preserveAspectRatio="xMidYMax slice">
      <defs><radialGradient id="kids-window-glow"><stop offset="0" stop-color="#ffd36a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></radialGradient></defs>
      <path class="kids-skyline-hills" d="M0 150q260-70 560-50t520 10 480-30 360 20V330H0z"/>
      <g class="kids-skyline-front">
        {HOUSES.map(([x, y, w]) => <path key={x} d={`M${x} 330V${y}l${w / 2} -26l${w / 2} 26V330z`}/>)}
        <path d="M880 330l70-110 70 110zM1000 330l44-66 44 66z"/>
        <path d="M440 330q4-120-6-200M434 132q-34-14-54 2m54-2q32-18 54-2m-54 2q-8-24 6-40M1780 330q4-100-6-170M1774 162q-30-12-48 2m48-2q28-16 48-2" fill="none" stroke-width="10" stroke-linecap="round"/>
      </g>
      {WINDOWS.map(([x, y], i) => <g key={i} class={`kids-window${WINDOW_ORDER.indexOf(i) < windows ? ' is-lit' : ''}`}>
        <circle cx={x + 12} cy={y + 14} r="60" fill="url(#kids-window-glow)"/>
        <rect x={x} y={y} width="24" height="28" rx="4"/><path d={`M${x + 12} ${y}v28M${x} ${y + 14}h24`}/>
      </g>)}
      <path class="kids-skyline-ground" d="M0 250q480-30 960-8t960-8V330H0z"/>
    </svg>
  </div>;
}
