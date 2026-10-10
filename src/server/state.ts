// Serverseitiger Raumzustand. Wird als JSON in D1 gespeichert und nie ungefiltert ausgeliefert.

import type { Phase, RoomStatus, Settings } from '../shared/types';

export interface PlayerStats {
  /** wie oft die Wahrheit gefunden */
  found: number;
  /** wie viele Personen insgesamt auf eigene Bluffs hereinfielen */
  fooled: number;
  /** wie oft selbst auf einen Bluff hereingefallen */
  fellFor: number;
  /** „Liebe deinen Nächsten“: wie viele Punkte verschenkt (fehlt in älteren Räumen) */
  gifted?: number;
}

export interface PlayerRec {
  id: string;
  name: string;
  color: string;
  tokenHash: string;
  joinedAt: number;
  plays: boolean;
  score: number;
  stats: PlayerStats;
  /** „Ruhige Minute“: diese Runde (Index) setzt die Person aus */
  quietRound?: number;
  /** vom Spiel gesteuerte Figur (Joseph) – immer verbunden, zieht selbst */
  bot?: true;
}

export interface KickedRec {
  id: string;
  name: string;
  color: string;
  tokenHash: string;
}

export interface OptionRec {
  id: string;
  text: string;
  kind: 'truth' | 'player' | 'house';
  authorIds: string[];
}

export interface ResultRec {
  truth: number;
  bluff: number;
  foundTruth: boolean;
  fooled: number;
  /** Option, auf die man hereingefallen ist */
  fellFor: string | null;
}

export type StepRec =
  | { kind: 'intro'; at: number; duration: number }
  | { kind: 'bluff'; at: number; duration: number; optionId: string }
  | { kind: 'truth'; at: number; duration: number; optionId: string }
  | { kind: 'rest'; at: number; duration: number; optionIds: string[] };

export interface RoundRec {
  index: number;
  questionId: string;
  bluffs: Record<string, { text: string; at: number }>;
  options: OptionRec[] | null;
  votes: Record<string, string>;
  results: Record<string, ResultRec> | null;
  revealStartedAt: number | null;
  plan: StepRec[] | null;
  /** Punkte-Phase: Herz je Person für einen Bluff der Mitspielenden (Personen-ID → Options-ID) */
  likes?: Record<string, string>;
  /** „Liebe deinen Nächsten“: verschenkter Punkt je Person (Schenkende → Beschenkte) */
  gifts?: Record<string, string>;
  /** „Keine Idee?“: der eine Bluff-Vorschlag je Person in dieser Runde (Personen-ID → Text) */
  suggestions?: Record<string, string>;
}

/** Bluff mit den meisten Herzen einer Runde */
export interface FavoriteRec {
  text: string;
  authorIds: string[];
  likes: number;
}

/** Bluff, der viele reingelegt oder viele Herzen bekommen hat – Kandidat für frische Hausbluffs */
export interface StrongBluffRec {
  text: string;
  fooled: number;
  likes: number;
}

export interface HistoryRec {
  questionId: string;
  results: Record<string, ResultRec>;
  /** bei Gleichstand mehrere */
  favorites?: FavoriteRec[];
  /** starke Bluffs der Runde, ohne Namen der Urheber */
  strong?: StrongBluffRec[];
}

/** Gespräch nach dem Spiel */
export interface TalkRec {
  questionId: string;
  step: number;
}

export interface GameRec {
  questionIds: string[];
  spareIds: string[];
  roundIndex: number;
  phase: Phase;
  phaseStartedAt: number;
  deadline: number | null;
  round: RoundRec;
  history: HistoryRec[];
  /** Zeitpunkt des Partie-Endes */
  finishedAt?: number;
  /** ID der Entdeckungen-Seite, sobald angelegt */
  recapId?: string;
  /** läuft gerade das Gespräch nach dem Spiel? */
  talk?: TalkRec | null;
}

export interface RoomState {
  v: 1;
  code: string;
  createdAt: number;
  status: RoomStatus;
  hostId: string;
  locked: boolean;
  /** öffentlich auf der Startseite anzeigen (fehlt bei älteren Räumen = nein) */
  listed?: boolean;
  /** nur im früheren gemeinsamen Raum JOSEPH gesetzt – solche Räume sind abgeschaltet */
  botRoom?: true;
  settings: Settings;
  players: PlayerRec[];
  kicked: KickedRec[];
  game: GameRec | null;
  usedQuestionIds: string[];
  paused: { at: number } | null;
  /** „Neues für alle“: wie viele Personen im Raum eine Frage schon kennen (Frage-ID → Anzahl) */
  seenCounts?: Record<string, number>;
  /** wessen Liste schon mitgezählt ist (Personen-IDs) */
  seenFrom?: string[];
}

/** Laufzeit-Kontext für alle Zustandsübergänge – macht die Engine testbar. */
export interface Ctx {
  now: number;
  rng: () => number;
  /** Zeitpunkt der letzten Aktivität je Spieler-ID */
  presence: Record<string, number>;
  /** freigegebene Bluffs aus echten Partien, ergänzen die Hausbluffs (Frage-ID → Texte) */
  extraBluffs?: Record<string, string[]>;
}

export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
