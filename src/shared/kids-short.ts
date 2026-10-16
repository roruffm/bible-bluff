import type { KidsGame } from './kids-game';

/** Zeitplan der Kurzshow in Sekunden ab „Mission starten“. Die Begrüßung (ca. 1:30) liegt davor, zusammen 15 Minuten. */
export const KIDS_SHORT_PLAN = [
  { label: 'Aufgabe 1', until: 150 },
  { label: 'Aufgabe 2', until: 300 },
  { label: 'Aufgabe 3', until: 450 },
  { label: 'Superbluff', until: 690 },
  { label: 'Abschluss', until: 810 },
] as const;
export const KIDS_SHORT_WELCOME_SECONDS = 90;

/** Welcher Planschritt gerade läuft; -1 heißt Begrüßung. */
export function kidsShortStep(game: KidsGame): number {
  if (game.phase === 'welcome') return -1;
  if (game.phase === 'finished') return 4;
  return game.index === 9 ? 3 : Math.min(2, game.index);
}

export interface KidsShortTiming { step: number; elapsedSeconds: number; untilSeconds: number; behindSeconds: number }
/** Stand gegenüber dem Plan, solange die Mission läuft; null vor dem Start oder ohne Kurzshow. */
export function kidsShortTiming(game: KidsGame, now: number): KidsShortTiming | null {
  const step = kidsShortStep(game);
  if (!game.short || step < 0 || typeof game.startedAt !== 'number') return null;
  const elapsedSeconds = Math.max(0, Math.floor((now - game.startedAt) / 1000)), untilSeconds = KIDS_SHORT_PLAN[step].until;
  return { step, elapsedSeconds, untilSeconds, behindSeconds: Math.max(0, elapsedSeconds - untilSeconds) };
}

export function kidsClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
