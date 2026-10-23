import type { KidsGroup } from '../../shared/kids-show-questions';
import { KidsMascot } from './KidsMascot';

/** Die Begrüßung läuft durchgehend, der Abschluss jubelt kurz. */
export function KidsTeamPortrait({ group, celebrating = false }: { group: Exclude<KidsGroup, 'all'>; celebrating?: boolean }) {
  return <span class={`kids-team-portrait group-${group}`} aria-hidden="true">
    <KidsMascot group={group} motion={celebrating ? 'celebrating' : 'greeting'}/>
  </span>;
}
