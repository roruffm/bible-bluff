import { useEffect, useState } from 'preact/hooks';
import type { KidsGame } from '../../shared/kids-game';
import { KIDS_SHORT_PLAN, KIDS_SHORT_WELCOME_SECONDS, kidsClock, kidsShortStep, kidsShortTiming } from '../../shared/kids-short';

/** Zeitplan der Kurzshow für die Spielleitung: Wo steht ihr, und liegt ihr im Plan? */
export function KidsTimePlan({ game, compact = false }: { game: KidsGame; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (!game.short) return null;
  const timing = kidsShortTiming(game, now), step = kidsShortStep(game);
  const summary = !timing
    ? `Begrüßung ca. ${kidsClock(KIDS_SHORT_WELCOME_SECONDS)}, dann „Mission starten“. Ab da läuft die Uhr.`
    : game.phase === 'finished' ? `Geschafft nach ${kidsClock(timing.elapsedSeconds)} seit Missionsstart.`
    : `${kidsClock(timing.elapsedSeconds)} seit Missionsstart · Jetzt ${KIDS_SHORT_PLAN[step].label}, Ziel bis ${kidsClock(timing.untilSeconds)}`;
  const behind = timing && game.phase !== 'finished' ? timing.behindSeconds : 0;
  return <section class={`kids-time-plan${compact ? ' is-compact' : ''}`} aria-label="Zeitplan der Kurzshow">
    <p class="kids-time-plan-summary"><b>⏱ Kurzshow · 15 Min.</b> <span>{summary}</span></p>
    {timing && game.phase !== 'finished' && <p class={`kids-time-plan-status${behind ? ' is-behind' : ''}`} role="status">{behind ? `${kidsClock(behind)} über dem Plan · Erklärungen kürzen, Szene weglassen` : 'Im Plan ✓'}</p>}
    {!compact && <ol class="kids-time-plan-steps">{KIDS_SHORT_PLAN.map((item, i) => <li key={item.label} class={i === step ? 'is-current' : i < step ? 'is-done' : undefined}><span>{item.label}</span><span>bis {kidsClock(item.until)}</span></li>)}</ol>}
  </section>;
}
