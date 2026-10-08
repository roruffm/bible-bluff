import type { BookGroup, Difficulty, Settings } from './types';

export const ROUND_OPTIONS = [4, 6, 8, 10, 12] as const;
export const WRITE_OPTIONS = [45, 60, 90, 120] as const;
export const VOTE_OPTIONS = [20, 30, 45, 60] as const;
export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'leicht', label: 'Leicht' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'schwer', label: 'Schwer' },
  { value: 'gemischt', label: 'Gemischt' },
];

export const DEFAULT_SETTINGS: Settings = {
  rounds: 8,
  difficulty: 'gemischt',
  writeSeconds: 60,
  voteSeconds: 30,
};

export const MIN_PLAYERS = 2;
export const RECOMMENDED_MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;
export const NAME_MAX = 16;
export const BLUFF_MAX = 80;

/** Punkte */
export const POINTS_TRUTH = 2;
export const POINTS_PER_FOOLED = 1;

/** Aufdeckung: Dauer der einzelnen Schritte in ms */
export const REVEAL_INTRO_MS = 2600;
export const REVEAL_BLUFF_MS = 6000;
export const REVEAL_TRUTH_MS = 7500;
export const REVEAL_REST_MS = 5500;
/** Innerhalb eines Schritts: ab wann der Urheber bzw. die Wahrheit gezeigt wird */
export const REVEAL_AUTHOR_AT_MS = 2600;

/** Punkte-Phase läuft ohne Eingriff nach dieser Zeit weiter */
export const SCORES_SECONDS = 40;

/** Präsenz */
export const ONLINE_WINDOW_MS = 15_000;
export const PRESENCE_TOUCH_MS = 5_000;
export const HOST_TAKEOVER_MS = 90_000;
/** Räume verfallen nach dieser Zeit ohne Änderung */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export const GROUP_LABELS: Record<BookGroup, string> = {
  evangelien: 'Evangelien',
  geschichte: 'Geschichte',
  paulus: 'Paulusbriefe',
  pastoral: 'Pastoralbriefe',
  allgemein: 'Allgemeine Lehrschriften',
  prophetie: 'Prophetie & Apokalypse',
  nt: 'Neues Testament',
};

export const PLAYER_COLORS = [
  '#5d6b2f', // olivgrün
  '#b2492c', // rost
  '#6b3a5b', // pflaume
  '#4e6577', // schieferblau
  '#a0701a', // ocker
  '#7a5537', // braun
  '#2f6f6a', // petrol
  '#9b3d63', // beere
  '#3f4a8a', // indigo
  '#8a6d1f', // senf
  '#5b4636', // mokka
  '#4d7a3a', // grün
  '#7c3f2c', // ziegel
  '#53606b', // grau
];

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g;

export function cleanName(input: string): string {
  return input
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
}

export function cleanBluff(input: string): string {
  return input
    .replace(INVISIBLE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
