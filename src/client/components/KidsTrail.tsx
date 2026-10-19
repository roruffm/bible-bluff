import type { KidsGame } from '../../shared/kids-game';

/** Spur durch die Show für die Kopfzeile: gespielte Aufgaben abgehakt, die aktuelle leuchtet, am Ende wartet das Finale.
 * Rein schmückend; die Kapitelanzeige daneben sagt dasselbe in Worten. */
export function KidsTrail({ game }: { game: KidsGame }) {
  const final = game.rounds.length - 1;
  const state = (i: number) => i === game.index ? 'is-now' : game.results[i] !== null ? 'is-done' : i < game.index ? 'is-skipped' : undefined;
  return <ol class="kids-trail" aria-hidden="true">
    {game.rounds.slice(0, final).map((_, i) => <li key={i} class={state(i)}>{state(i) === 'is-done' ? '✓' : i === game.index ? i % 3 + 1 : ''}</li>)}
    <li class={`kids-trail-final${state(final) ? ` ${state(final)}` : ''}`}>🏁</li>
  </ol>;
}
