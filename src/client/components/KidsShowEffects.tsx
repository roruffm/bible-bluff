import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { KidsGame } from '../../shared/kids-game';
import { KIDS_GROUP_ARRIVAL_MS, KIDS_MASCOT_FLIGHT_MS, kidsPresentationMoment, type KidsPresentationMoment } from '../lib/kids-presentation';
import type { KidsGroup } from '../../shared/kids-show-questions';
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
    const hide = window.setTimeout(() => setMoment(null), delay + (next.kind === 'group' ? KIDS_GROUP_ARRIVAL_MS : next.kind === 'sweep' ? 1300 : 1850));
    const cancel = () => { if (reduced.matches) { clearTimeout(show); clearTimeout(hide); setMoment(null); } };
    reduced.addEventListener('change', cancel);
    return () => { clearTimeout(show); clearTimeout(hide); reduced.removeEventListener('change', cancel); };
  }, [game?.phase, game?.index, game?.results[game?.index ?? 0]]);
  if (!game || moment?.index !== game.index) return null;
  if (moment.kind === 'group') return game.phase === 'reading' ? moment : null;
  if (moment.kind === 'sweep') return game.phase === 'chapter' || game.phase === 'superbluff' ? moment : null;
  return game.phase === 'revealed' && game.results[game.index] === moment.result ? moment : null;
}

/** Dieselbe Figur fliegt groß über die Bühne und bleibt anschließend am tatsächlichen Bannerplatz sitzen. */
export function KidsBannerMascot({ group, entering }: { group: Exclude<KidsGroup, 'all'>; entering: boolean }) {
  const perch = useRef<HTMLSpanElement>(null);
  const [route, setRoute] = useState<Record<string, string> | null>(null);
  useLayoutEffect(() => {
    setRoute(null);
    if (!entering || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = perch.current?.getBoundingClientRect();
    if (!target?.width || !target.height) return;
    const x = target.x + target.width / 2, y = target.y + target.height / 2;
    const width = window.innerWidth, height = window.innerHeight;
    // Einheitlicher großer Auftritt, auch auf schmalen und flachen Bildschirmen vollständig sichtbar.
    const scale = Math.min(3.4, width * .52 / target.width, height * .4 / target.height);
    const point = (px: number, py: number) => `${(px - x + target.width / 2).toFixed(2)} ${(py - y + target.height / 2).toFixed(2)}`;
    // Gespiegelte Kontrollpunkte (S) verbinden die Bögen ohne Knick oder Zwischenstopp.
    const path = `M ${point(-width * .28, height * .62)} C ${point(width * .07, height * .8)} ${point(width * .28, height * .25)} ${point(width * .49, height * .42)} S ${point(width * .85, height * .61)} ${point(width * .74, height * .32)} S ${point(x + width * .14, y - height * .03)} ${point(x, y)}`;
    setRoute({
      '--arrival-path': `path('${path}')`,
      '--arrival-scale': String(scale),
      '--arrival-duration': `${KIDS_MASCOT_FLIGHT_MS}ms`,
    });
    // Bei Vollbildwechsel/Rotation sofort sicher auf dem neu positionierten Banner landen.
    const land = () => setRoute(null);
    window.addEventListener('resize', land);
    return () => window.removeEventListener('resize', land);
  }, [entering, group]);
  const stage = perch.current?.closest<HTMLElement>('.kids-show');
  return <span ref={perch} class={`kids-mascot-perch is-${group}${entering && route ? ' is-flying' : ''}`} style={route ?? undefined} aria-hidden="true">
    <span class="kids-mascot-seat-shadow"/>
    <span class="kids-mascot-arrival"><KidsMascot group={group} motion={entering ? 'flying' : 'quiet'}/></span>
    {entering && route && stage && createPortal(<KidsMascotStarTrail target={perch.current!} group={group}/>, stage)}
  </span>;
}

/** Die Sterne bleiben an früheren Flugpositionen zurück, statt starr an der Figur zu hängen. */
function KidsMascotStarTrail({ target, group }: { target: HTMLSpanElement; group: Exclude<KidsGroup, 'all'> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current, sprite = target.querySelector('.kids-mascot-arrival');
    const ctx = surface?.getContext('2d');
    if (!surface || !sprite || !ctx) return;
    const width = window.innerWidth, height = window.innerHeight;
    const density = Math.min(window.devicePixelRatio || 1, 1.5);
    surface.width = Math.round(width * density); surface.height = Math.round(height * density);
    ctx.scale(density, density);
    const colors = ['#fff9d7', '#ffe08a', group === 'minis' ? '#b3ffea' : group === 'mittis' ? '#fff1af' : '#ffc39b'];
    const stars: { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; angle: number; color: string }[] = [];
    const wake: { x: number; y: number; time: number }[] = [];
    let frame = 0, previous: { x: number; y: number; time: number; width: number } | null = null, lastSpawn = 0;
    const start = performance.now();
    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const box = sprite.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
      const dt = previous ? Math.max(1, now - previous.time) : 16;
      const dx = previous ? x - previous.x : 0, dy = previous ? y - previous.y : 0;
      const speed = Math.hypot(dx, dy), nx = speed ? dx / speed : 1, ny = speed ? dy / speed : 0;
      const emissionEnd = start + KIDS_MASCOT_FLIGHT_MS * .85;
      if (previous && previous.time < emissionEnd && speed > .4) {
        // Zeitbasierte Abgabe hält den Schweif auch bei gedrosselter Bildrate dicht und begrenzt die Arbeit pro Bild.
        for (let born = Math.max(lastSpawn + 20, now - 480, previous.time); born <= Math.min(now, emissionEnd); born += 20) {
          lastSpawn = born;
          const fraction = Math.max(0, Math.min(1, (born - previous.time) / dt));
          const bodyWidth = previous.width + (box.width - previous.width) * fraction;
          const tailX = previous.x + dx * fraction - nx * bodyWidth * .28;
          const tailY = previous.y + dy * fraction - ny * bodyWidth * .28;
          wake.push({ x: tailX, y: tailY, time: born });
          for (let i = 0; i < 2; i++) {
            const spread = (Math.random() - .5) * bodyWidth * .23;
            stars.push({ x: tailX - ny * spread, y: tailY + nx * spread,
              vx: -dx / dt * .065 + (Math.random() - .5) * .025, vy: -dy / dt * .065 - .012,
              born, life: 650 + Math.random() * 350, size: 4 + Math.random() * 8,
              angle: Math.random() * Math.PI, color: colors[stars.length % colors.length] });
          }
        }
      }
      previous = { x, y, time: now, width: box.width };
      while (wake.length && now - wake[0].time > 450) wake.shift();
      ctx.lineCap = 'round';
      for (let i = 1; i < wake.length; i++) {
        ctx.globalAlpha = (1 - (now - wake[i].time) / 450) * .24;
        ctx.strokeStyle = '#ffe3a0'; ctx.lineWidth = 2 + 3 * i / wake.length;
        ctx.beginPath(); ctx.moveTo(wake[i - 1].x, wake[i - 1].y); ctx.lineTo(wake[i].x, wake[i].y); ctx.stroke();
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i], age = now - star.born, life = age / star.life;
        if (life >= 1) { stars.splice(i, 1); continue; }
        ctx.save(); ctx.translate(star.x + star.vx * age, star.y + star.vy * age);
        ctx.rotate(star.angle + life * .7); ctx.globalAlpha = (1 - life) ** 1.5;
        ctx.fillStyle = star.color; ctx.shadowColor = '#ffda68'; ctx.shadowBlur = 8;
        const size = star.size * (1 - life * .6);
        ctx.beginPath();
        for (let corner = 0; corner < 10; corner++) {
          const angle = corner * Math.PI / 5 - Math.PI / 2, radius = corner % 2 ? size * .4 : size;
          const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
          if (corner) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (now - start < KIDS_GROUP_ARRIVAL_MS) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, width, height); };
  }, [target, group]);
  return <canvas ref={canvas} class="kids-mascot-star-trail" aria-hidden="true"/>;
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
