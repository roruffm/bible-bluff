// Gemeinsame Typen für Server und Client.
// Alles hier darf im Browser landen – keine geheimen Spieldaten.

export type Difficulty = 'leicht' | 'mittel' | 'schwer' | 'gemischt';
export type Phase = 'write' | 'vote' | 'reveal' | 'scores';
export type RoomStatus = 'lobby' | 'playing' | 'finished' | 'closed';

export interface Settings {
  rounds: number;
  difficulty: Difficulty;
  writeSeconds: number;
  voteSeconds: number;
}

export type BookGroup =
  | 'evangelien'
  | 'geschichte'
  | 'paulus'
  | 'pastoral'
  | 'allgemein'
  | 'prophetie'
  | 'nt'
  | 'at';

export type Action =
  | { type: 'start' }
  | { type: 'settings'; settings?: Partial<Settings>; hostPlays?: boolean }
  | { type: 'bluff'; text: string }
  | { type: 'suggest'; n?: number }
  | { type: 'vote'; optionId: string }
  | { type: 'like'; optionId: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'skipPhase' }
  | { type: 'swapQuestion' }
  | { type: 'revealNext' }
  | { type: 'next' }
  | { type: 'kick'; playerId: string }
  | { type: 'makeHost'; playerId: string }
  | { type: 'lock'; locked: boolean }
  | { type: 'close' }
  | { type: 'playAgain' }
  | { type: 'leave' };

export interface PlayerView {
  id: string;
  name: string;
  color: string;
  score: number;
  online: boolean;
  plays: boolean;
  isHost: boolean;
  /** Schreibphase: hat einen Bluff abgegeben. Abstimmung: hat gewählt. */
  done: boolean;
}

export interface QuestionView {
  id: string;
  book: string;
  group: BookGroup;
  difficulty: 1 | 2 | 3;
  prompt: string;
}

export interface OptionView {
  id: string;
  text: string;
  mine: boolean;
}

export interface PersonRef {
  id: string;
  name: string;
  color: string;
}

export type RevealStepView =
  | { kind: 'intro'; at: number; duration: number }
  | {
      kind: 'bluff';
      at: number;
      duration: number;
      optionId: string;
      text: string;
      voters: PersonRef[];
      /** Leer = vom Spiel erfundener Bluff. */
      authors: PersonRef[];
      pointsPerAuthor: number;
    }
  | {
      kind: 'truth';
      at: number;
      duration: number;
      optionId: string;
      text: string;
      voters: PersonRef[];
      ref: string;
    }
  | {
      kind: 'rest';
      at: number;
      duration: number;
      items: { text: string; authors: PersonRef[] }[];
    };

export interface AnswerView {
  text: string;
  ref: string;
  discovery: string;
}

export interface RoundResultView {
  playerId: string;
  truth: number;
  bluff: number;
  foundTruth: boolean;
  fooled: number;
  /** Extrapunkt für den Lieblingsbluff – steht während der Punkte-Phase noch nicht fest */
  favorite: number;
}

/** Punkte-Phase: ein Bluff der Mitspielenden, für den man ein Herz vergeben kann */
export interface FavoriteOptionView {
  optionId: string;
  text: string;
  authors: PersonRef[];
  likes: number;
  /** eigener Bluff – kein Herz möglich */
  mine: boolean;
  /** liegt gerade vorn (mindestens ein Herz) */
  leading: boolean;
}

export interface RoundView {
  index: number;
  total: number;
  phase: Phase;
  phaseStartedAt: number;
  deadline: number | null;
  question: QuestionView;
  /** Schreibphase */
  myBluff: string | null;
  /** Abstimmung + Aufdeckung */
  options: OptionView[] | null;
  myVote: string | null;
  /** ab Aufdeckung */
  answer: AnswerView | null;
  reveal: { startedAt: number; steps: RevealStepView[]; total: number } | null;
  /** Punkte-Phase */
  results: RoundResultView[] | null;
  favorites: FavoriteOptionView[] | null;
  myLike: string | null;
}

export interface AwardView {
  key: 'bluffer' | 'finder' | 'trusting' | 'favorite';
  title: string;
  text: string;
  players: PersonRef[];
  value: number;
  /** Lieblingsbluff: der Bluff selbst */
  quote?: string;
}

export interface DiscoveryView {
  prompt: string;
  answer: string;
  ref: string;
  discovery: string;
}

export interface FinalView {
  ranking: (PersonRef & { score: number; rank: number })[];
  awards: AwardView[];
  discoveries: DiscoveryView[];
  /** Dauerhafte Entdeckungen-Seite (/e/ID), sobald jemand sie angelegt hat */
  recapId: string | null;
}

/** Eine Frage auf der Entdeckungen-Seite – bewusst ohne Namen der Mitspielenden */
export interface RecapItem {
  book: string;
  group: BookGroup;
  prompt: string;
  answer: string;
  ref: string;
  discovery: string;
  /** Lieblingsbluff der Runde (bei Gleichstand mehrere) */
  favorites: string[];
}

export interface RecapView {
  id: string;
  /** Ende der Partie */
  playedAt: number;
  players: number;
  items: RecapItem[];
}

export interface RecapResponse {
  recap: RecapView;
}

export interface RecapCreatedResponse {
  id: string;
}

export interface MeView {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  plays: boolean;
}

export interface RoomView {
  code: string;
  serverNow: number;
  version: number;
  status: RoomStatus;
  me: MeView | null;
  hostId: string;
  locked: boolean;
  paused: { at: number } | null;
  settings: Settings;
  hostPlays: boolean;
  players: PlayerView[];
  round: RoundView | null;
  final: FinalView | null;
  poolSize: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface SessionResponse {
  code: string;
  playerId: string;
  token: string;
  view: RoomView;
}

export interface ViewResponse {
  view: RoomView;
  suggestion?: string;
}
