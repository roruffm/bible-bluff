import { kidsResumeGame, type KidsGame } from '../../shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../../shared/kids-remote';

const KEY = 'bb:kids:show';
/** So lange wie ein Fernbedienungs-Link: für den Gemeindetag, nicht für die nächste Woche. */
export const KIDS_SAVE_TTL = 6 * 60 * 60 * 1000;
export interface KidsSavedShow { savedAt: number; game: KidsGame }
let last = '';

const fullSeconds = (ms: number) => Math.ceil(ms / 1000) * 1000;
/** Sichert den Spielstand auf diesem Gerät. Restzeiten zählen in vollen Sekunden, darum schreibt ein Countdown höchstens einmal pro Sekunde. */
export function saveKidsShow(game: KidsGame, now = Date.now()): void {
  // Der Missionsstart zählt als feste Gerätezeit, sonst änderte sich der Stand jede Sekunde.
  const { startedAgoMs: _ago, ...packed } = packKidsGame(game, now);
  const show = { ...packed, remainingMs: fullSeconds(packed.remainingMs), sceneRemainingMs: packed.sceneRemainingMs === undefined ? undefined : fullSeconds(packed.sceneRemainingMs) };
  const text = JSON.stringify(show);
  if (text === last) return;
  last = text;
  try { localStorage.setItem(KEY, JSON.stringify({ v: 1, savedAt: now, startedAt: game.startedAt ?? null, game: show })); } catch { /* Ohne Speicher läuft die Show trotzdem. */ }
}

/** Liefert eine gesicherte Show nur, wenn sie frisch und gültig ist. Ein laufender Countdown ist danach angehalten. */
export function loadKidsShow(now = Date.now()): KidsSavedShow | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!saved) return null;
    const { v, savedAt, startedAt, game } = saved as Record<string, unknown>;
    const unpacked = v === 1 && typeof savedAt === 'number' && now - savedAt <= KIDS_SAVE_TTL ? unpackKidsGame(game, now) : null;
    if (unpacked) return { savedAt: savedAt as number, game: kidsResumeGame({ ...unpacked, ...(typeof startedAt === 'number' && Number.isFinite(startedAt) ? { startedAt } : {}) }, now) };
  } catch { /* unlesbar: wie nicht vorhanden */ }
  clearKidsShow();
  return null;
}

export function clearKidsShow(): void {
  last = '';
  try { localStorage.removeItem(KEY); } catch { /* nichts zu löschen */ }
}
