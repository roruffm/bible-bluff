import type { KidsGame } from '../../shared/kids-game';

/** Feste Sternenkarte: gleichmäßig verteilt, aber in zufälliger Reihenfolge, damit der Himmel überall gleichzeitig voller wird. */
const STARS = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const stars = Array.from({ length: 56 }, (_, i) => ({ x: (i % 8 + next()) * 200, y: (Math.floor(i / 8) + next()) * 128, big: next() > .78, delay: Math.round(next() * 40) / 10, order: next() }));
  return stars.map((star, i) => ({ ...star, rank: stars.filter(other => other.order < star.order).length, i }));
})();
const FIRST_STARS = 8;

/** 0 zur Begrüßung, steigt mit jeder Aufgabe, die Finalrunde bringt die Dämmerung, der Abschluss den Morgen. */
export function kidsSkyProgress(game: KidsGame) {
  if (game.phase === 'finished') return 1;
  const done = game.index + (game.phase === 'revealed' ? 1 : 0);
  return Math.min(1, done / game.rounds.length);
}

/** Nachthimmel hinter der Bühne. Rein schmückend: Die Kopfzeile nennt den Fortschritt in Worten. */
export function KidsSky({ game }: { game: KidsGame }) {
  const progress = kidsSkyProgress(game);
  const lit = Math.round(FIRST_STARS + progress * (STARS.length - FIRST_STARS));
  return <div class={`kids-sky${game.phase === 'finished' ? ' is-morning' : ''}`} style={{ '--sky': progress }} data-stars={lit} aria-hidden="true">
    <svg viewBox="0 0 1600 896" preserveAspectRatio="xMidYMid slice">
      {STARS.map(star => star.big
        ? <path key={star.i} class={star.rank < lit ? 'is-lit' : undefined} style={{ '--delay': `${star.delay}s` }} d={`M${star.x} ${star.y - 12}q2.4 9.6 12 12q-9.6 2.4-12 12q-2.4-9.6-12-12q9.6-2.4 12-12z`}/>
        : <circle key={star.i} class={star.rank < lit ? 'is-lit' : undefined} style={{ '--delay': `${star.delay}s` }} cx={star.x} cy={star.y} r="3.2"/>)}
    </svg>
  </div>;
}
