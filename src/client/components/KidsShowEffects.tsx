import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { KidsGame } from '../../shared/kids-game';
import { kidsPresentationMoment, type KidsPresentationMoment } from '../lib/kids-presentation';
import { KIDS_SUSPENSE_MS } from '../lib/kids-sound';
import { KidsGroupName } from './KidsGroupName';
import { KidsMascot } from './KidsMascot';
import './kids-show-effects.css';

export function useKidsPresentationMoment(game: KidsGame | null): KidsPresentationMoment | null {
  const previous = useRef<KidsGame | null>(null);
  const [moment, setMoment] = useState<KidsPresentationMoment | null>(null);
  useEffect(() => {
    const next = kidsPresentationMoment(previous.current, game);
    previous.current = game;
    setMoment(null);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!next || reduced.matches) return;
    const delay = next.kind === 'points' ? KIDS_SUSPENSE_MS : 0;
    const show = window.setTimeout(() => setMoment(next), delay);
    const hide = window.setTimeout(() => setMoment(null), delay + (next.kind === 'group' ? 2200 : next.kind === 'sweep' ? 1300 : 1850));
    const cancel = () => { if (reduced.matches) { clearTimeout(show); clearTimeout(hide); setMoment(null); } };
    reduced.addEventListener('change', cancel);
    return () => { clearTimeout(show); clearTimeout(hide); reduced.removeEventListener('change', cancel); };
  }, [game?.phase, game?.index, game?.results[game?.index ?? 0]]);
  if (!game || moment?.index !== game.index) return null;
  if (moment.kind === 'group') return game.phase === 'reading' ? moment : null;
  if (moment.kind === 'sweep') return game.phase === 'chapter' || game.phase === 'superbluff' ? moment : null;
  return game.phase === 'revealed' && game.results[game.index] === moment.result ? moment : null;
}

/** Licht in der Dunkelheit: Beim Kapitelstart fliegt die Leuchtlupe mit einem hellen Streifen einmal quer über die Bühne. */
export function KidsLightSweep() {
  return <div class="kids-light-sweep" aria-hidden="true"><div class="kids-light-runner"><span class="kids-light-beam"/><KidsMascot group="minis"/></div></div>;
}

/** Punkte starten am Gruppensymbol und landen an der tatsächlichen Position des gemeinsamen Zählers. */
export function KidsPointsFlight({ game, points }: { game: KidsGame; points: number }) {
  const element = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  useLayoutEffect(() => {
    const stage = element.current?.closest('.kids-show');
    const start = stage?.querySelector('.kids-reveal-result .kids-group-symbol')?.getBoundingClientRect();
    const end = stage?.querySelector('.kids-score-team')?.getBoundingClientRect();
    if (!start?.width || !end?.width) return;
    const x = start.x + start.width / 2, y = start.y + start.height / 2;
    setRoute({ x, y, dx: end.x + end.width / 2 - x, dy: end.y + end.height / 2 - y });
  }, []);
  return <div ref={element} class="kids-points-flight" aria-hidden="true">
    {route && <div class="kids-points-path" style={{ left: route.x, top: route.y, '--flight-x': `${route.dx}px`, '--flight-y': `${route.dy}px` }}>
      <span class="kids-points-token"><KidsGroupName group={game.rounds[game.index].question.group}/><b>+{points}</b><span class="kids-points-spark">✦</span></span>
    </div>}
  </div>;
}
