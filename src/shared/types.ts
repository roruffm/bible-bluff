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
  | { type: 'suggest' }
  | { type: 'vote'; optionId: string }
  | { type: 'like'; optionId: string }
  /** „Liebe deinen Nächsten“: einen eigenen Punkt verschenken (einmal pro Runde) */
  | { type: 'gift'; playerId: string }
  /** „Ruhige Minute“: diese (beim Schreiben/Abstimmen) oder die nächste Runde aussetzen */
  | { type: 'quiet'; on: boolean }
  /** Gespräch nach dem Spiel (nur Spielleitung) */
  | { type: 'talk'; questionId?: string }
  | { type: 'talkStep'; step: number }
  | { type: 'talkEnd' }
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
  /** setzt die laufende Runde aus („Ruhige Minute“) */
  quiet: boolean;
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
  /** „Liebe deinen Nächsten“: wer dieser Person in dieser Runde einen Punkt geschenkt hat */
  giftsIn: PersonRef[];
  /** an wen diese Person in dieser Runde einen Punkt verschenkt hat */
  giftOut: PersonRef | null;
  /** hat die Runde ausgesetzt („Ruhige Minute“) */
  quiet: boolean;
}

/** Spickzettel der Leitung und Stoff für das Gespräch nach dem Spiel */
export interface TalkNotes {
  background: string;
  question: string;
  crossRef: { ref: string; note: string };
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
  /** mein Bluff-Vorschlag dieser Runde – höchstens einer, danach gibt es keinen weiteren */
  mySuggestion: string | null;
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
  /** an wen ich in dieser Runde einen Punkt verschenkt habe (Personen-ID) */
  myGift: string | null;
  /** Spickzettel – nur für die Spielleitung, ab der Punkte-Phase */
  talk: TalkNotes | null;
}

export interface AwardView {
  key: 'bluffer' | 'finder' | 'trusting' | 'favorite' | 'neighbor';
  title: string;
  text: string;
  players: PersonRef[];
  value: number;
  /** Lieblingsbluff: der Bluff selbst */
  quote?: string;
}

export interface DiscoveryView {
  questionId: string;
  prompt: string;
  answer: string;
  ref: string;
  discovery: string;
  /** wie viele abgestimmt haben und wie viele davon auf einen Bluff hereingefallen sind */
  voted: number;
  missed: number;
}

/** Gespräch nach dem Spiel: eine Frage der Partie in vier Schritten vertiefen */
export interface TalkView {
  questionId: string;
  /** 0 … TALK_STEPS.length - 1 */
  step: number;
  book: string;
  group: BookGroup;
  prompt: string;
  answer: string;
  ref: string;
  discovery: string;
  notes: TalkNotes | null;
  voted: number;
  missed: number;
}

export interface FinalView {
  ranking: (PersonRef & { score: number; rank: number })[];
  awards: AwardView[];
  discoveries: DiscoveryView[];
  /** Dauerhafte Entdeckungen-Seite (/e/ID), sobald jemand sie angelegt hat */
  recapId: string | null;
  /** läuft gerade das Gespräch nach dem Spiel? */
  talk: TalkView | null;
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
  /** „Ruhige Minute“: setzt die laufende oder die nächste Runde aus */
  quiet: 'now' | 'next' | null;
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
  /** Fragen, die in diesem Raum noch niemand kennt („Neues für alle“) */
  freshCount: number;
}

/** Freigabe-Seite: ein starker Bluff aus echten Partien */
export type BluffStatus = 'new' | 'approved' | 'rejected';

export interface BluffCandidateView {
  questionId: string;
  key: string;
  text: string;
  fooled: number;
  likes: number;
  times: number;
  status: BluffStatus;
  updatedAt: number;
  question: { prompt: string; answer: string; ref: string; houseBluffs: string[] } | null;
}

export interface BluffListResponse {
  items: BluffCandidateView[];
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
