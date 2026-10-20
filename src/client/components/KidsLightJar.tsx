import { useId } from 'preact/hooks';

/** Höchstpunktzahl des Teams: neun Aufgaben je 10 und das Finale mit 20. Beide Gläser nutzen dieselbe Skala. */
const JAR_MAX = 110;
/** Plätze der Lichter, von unten aufgeschichtet; je 10 Punkte ein Licht. */
const SLOTS = [[28, 118], [44, 120], [60, 118], [76, 120], [36, 104], [52, 103], [68, 105], [28, 89], [44, 88], [60, 90], [76, 88], [52, 74]];

/** Glas, das sich mit Punkten als Licht füllt. Rein schmückend; die Zahl daneben nennt den Stand. */
export function KidsLightJar({ points, kind }: { points: number; kind: 'team' | 'professor' }) {
  const id = useId();
  const fill = Math.min(1, points / JAR_MAX);
  const lights = Math.min(SLOTS.length, Math.floor(points / 10));
  const body = 'M30 24h40v8q16 10 16 32v52q0 16-16 16H30q-16 0-16-16V64q0-22 16-32z';
  return <svg class={`kids-jar is-${kind}`} viewBox="0 0 100 140" aria-hidden="true">
    <defs>
      <clipPath id={`${id}-glass`}><path d={body}/></clipPath>
      <radialGradient id={`${id}-light`}><stop offset="0" stop-color="#fff"/><stop offset=".45" class="kids-jar-tone"/><stop offset="1" class="kids-jar-tone" stop-opacity="0"/></radialGradient>
    </defs>
    <path d={body} class="kids-jar-glass"/>
    <g clip-path={`url(#${id}-glass)`}>
      <rect class="kids-jar-fill" x="10" y="36" width="80" height="96" style={{ transform: `scaleY(${fill})` }}/>
      {SLOTS.slice(0, lights).map(([x, y], i) => <g key={i} class="kids-jar-light"><circle cx={x} cy={y} r="14" fill={`url(#${id}-light)`}/><circle cx={x} cy={y} r="5.5" class="kids-jar-dot"/></g>)}
    </g>
    <path d="M24 44q-6 30 0 66" class="kids-jar-shine"/>
    <path d={body} class="kids-jar-outline"/>
    <rect x="24" y="10" width="52" height="16" rx="5" class="kids-jar-lid"/>
  </svg>;
}
