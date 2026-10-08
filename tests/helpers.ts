import type { Ctx } from '../src/server/state';

/** Deterministischer Zufall für reproduzierbare Tests */
export function seeded(seed = 42): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Clock {
  constructor(public now = 1_700_000_000_000) {}
  advance(ms: number) {
    this.now += ms;
    return this.now;
  }
}

export function ctxFor(clock: Clock, online: string[], rng = seeded()): Ctx {
  return { now: clock.now, rng, presence: Object.fromEntries(online.map((id) => [id, clock.now])) };
}
