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
/** Lieblingsbluff: Extrapunkt für den Bluff mit den meisten Herzen einer Runde */
export const POINTS_FAVORITE = 1;
/** „Liebe deinen Nächsten“: so viele eigene Punkte verschenkt man (einmal pro Runde) */
export const POINTS_GIFT = 1;

/** „Neues für alle“: so viele zuletzt gesehene Fragen merkt sich bzw. meldet ein Gerät */
export const SEEN_STORE_MAX = 300;
export const SEEN_SEND_MAX = 200;

/** Frische Hausbluffs: ab so vielen Reingelegten oder Herzen wird ein Bluff zum Kandidaten */
export const STRONG_BLUFF_MIN = 2;

/** Gespräch nach dem Spiel: vier einfache Schritte */
export const TALK_STEPS = [
  { key: 'lesen', title: 'Lesen', prompt: 'Schlagt die Stelle auf. Eine Person liest den Abschnitt laut vor.' },
  { key: 'entdecken', title: 'Entdecken', prompt: 'Was fällt euch auf? Was hat euch überrascht – vielleicht schon beim Raten?' },
  { key: 'nachfragen', title: 'Nachfragen', prompt: 'Warum, meint ihr, erzählt die Bibel davon?' },
  { key: 'mitnehmen', title: 'Mitnehmen', prompt: 'Was nehmt ihr mit in die Woche? Wofür wollt ihr danken oder beten?' },
] as const;

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
/**
 * Öffentliche Räume bleiben so lange auf der Startseite, nachdem zuletzt jemand im Raum verbunden
 * war. Großzügig, weil Handys im Hintergrund nicht nachfragen: Die Leitung soll in Ruhe auf
 * Mitspielende warten können, auch wenn sie in WhatsApp wechselt oder der Bildschirm aus ist.
 */
export const LISTED_ALIVE_MS = 15 * 60 * 1000;

/** Joseph: ein Bot, mit dem man jederzeit allein spielen kann (eigener Raum je Person) */
export const BOT_NAME = 'Joseph';
/** Josephs Spieler-ID – auch die App erkennt ihn daran und zeigt sein Gesicht statt Initialen */
export const BOT_ID = 'bot-joseph';
/** Vorschlag für eine Partie gegen Joseph: etwas kürzer als sonst */
export const BOT_SETTINGS: Settings = { rounds: 6, difficulty: 'gemischt', writeSeconds: 60, voteSeconds: 30 };
/** Josephs Trefferquote: so oft wählt er die richtige Antwort */
export const BOT_TRUTH_RATE = 0.45;
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
  at: 'Altes Testament',
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

/** Josephs Farbe: die zweite – die erste bekommt immer, wer den Raum eröffnet */
export const BOT_COLOR = PLAYER_COLORS[1];

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
