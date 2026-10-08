// Serverseitiger Raumzustand. Wird als JSON in D1 gespeichert und nie ungefiltert ausgeliefert.

import type { Phase, RoomStatus, Settings } from '../shared/types';

export interface PlayerStats {
  /** wie oft die Wahrheit gefunden */
  found: number;
  /** wie viele Personen insgesamt auf eigene Bluffs hereinfielen */
  fooled: number;
  /** wie oft selbst auf einen Bluff hereingefallen */
  fellFor: number;
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
}

export interface HistoryRec {
  questionId: string;
  results: Record<string, ResultRec>;
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
}

export interface RoomState {
  v: 1;
  code: string;
  createdAt: number;
  status: RoomStatus;
  hostId: string;
  locked: boolean;
  settings: Settings;
  players: PlayerRec[];
  kicked: KickedRec[];
  game: GameRec | null;
  usedQuestionIds: string[];
  paused: { at: number } | null;
}

/** Laufzeit-Kontext für alle Zustandsübergänge – macht die Engine testbar. */
export interface Ctx {
  now: number;
  rng: () => number;
  /** Zeitpunkt der letzten Aktivität je Spieler-ID */
  presence: Record<string, number>;
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
