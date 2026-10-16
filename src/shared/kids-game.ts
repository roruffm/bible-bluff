import { KIDS_SHOW_QUESTIONS, type KidsShowQuestion, type KidsGroup } from './kids-show-questions';
import { KIDS_SCENE_MS } from './kids-scenes';
import { professorInterjection, type ProfessorInterjectionId } from './professor-interjections';

export const KIDS_SECONDS = 30;
/** Kurzshow: ein Kapitel und der Superbluff, 20 Sekunden, Abstimmen mit Fingern am Platz. */
export const KIDS_SHORT_SECONDS = 20;
export type KidsPhase = 'welcome' | 'chapter' | 'superbluff' | 'reading' | 'scene' | 'moving' | 'paused' | 'locked' | 'returning' | 'judging' | 'revealed' | 'finished';
/** participated bleibt als gespeicherter Protokollwert erhalten: mindestens ein Kind richtig, ohne Mehrheit. */
export type KidsResult = 'correct' | 'participated' | 'none';
export function kidsResultPoints(result: KidsResult | null): number { return result === 'correct' ? 10 : result === 'participated' ? 5 : 0; }
export interface KidsRound { question: KidsShowQuestion; answers: string[]; correctIndex: number }
export interface KidsGame {
  rounds: KidsRound[]; index: number; phase: KidsPhase; remainingMs: number; deadline: number | null;
  results: (KidsResult | null)[]; cueSeq: number;
  /** Kurzshow; fehlt bei der vollen Show. */ short?: boolean;
  /** Gerätezeit, zu der die Mission nach der Begrüßung startete; für den Zeitplan der Kurzshow. */ startedAt?: number | null;
  voiceSeq?: number; voicePlaying?: boolean; voiceCue?: string|null; voiceKind?: 'quote'|'question'|'interjection'; voiceClip?: ProfessorInterjectionId|null;
}
export type KidsAction = 'start' | 'pause' | 'resume' | 'tick' | 'return' | 'ready' | 'correct' | 'participated' | 'none' | 'next' | 'scene' | 'end-scene' | 'finish' | 'jump-final' | 'speak' | 'stop-speech' | 'read-question' | 'correct-last' | 'participated-last' | 'none-last' | `interjection:${ProfessorInterjectionId}`;

export function kidsCanJumpToFinal(game: KidsGame): boolean {
  const final = game.rounds.length - 1;
  return game.results[final] === null && (game.index < final || game.phase === 'finished');
}

/** Antwortzeit je Aufgabe in Millisekunden. */
export function kidsAnswerMs(game: Pick<KidsGame, 'short'>): number { return (game.short ? KIDS_SHORT_SECONDS : KIDS_SECONDS) * 1000; }
/** In der Kurzshow wird gleich nach dem Stopp gewertet, ohne Rückweg: Die Kinder zeigen ihre Antwort am Platz. */
export function kidsCanScore(game: KidsGame): boolean {
  return game.results[game.index] === null && (game.phase === 'judging' || (!!game.short && game.phase === 'locked'));
}

export function kidsLastScoredIndex(game: KidsGame): number {
  for (let i = game.results.length - 1; i >= 0; i--) if (game.results[i] !== null) return i;
  return -1;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createKidsGame(random: () => number = Math.random, { short = false }: { short?: boolean } = {}): KidsGame {
  // Die drei Aufgaben der Kurzshow nutzen jedes Feld genau einmal.
  const positions = short ? [...shuffle([0, 1, 2], random), ...shuffle([0, 1, 2, 0, 1, 2], random)] : shuffle([0, 1, 2, 0, 1, 2, 0, 1, 2], random);
  const rounds = KIDS_SHOW_QUESTIONS.map((question, i) => {
    const correctIndex = i === 9 ? Math.floor(random() * 3) : positions[i];
    const answers = shuffle(question.distractors, random); answers.splice(correctIndex, 0, question.answer);
    return { question, answers, correctIndex };
  });
  return { rounds, index: 0, phase: 'welcome', remainingMs: kidsAnswerMs({ short }), deadline: null, results: rounds.map(() => null), cueSeq: 0, ...(short ? { short } : {}) };
}
/** hiddenIndex blendet eine Wertung aus, etwa solange der Trommelwirbel die Auflösung noch zurückhält. */
export function kidsScores(game: KidsGame, hiddenIndex = -1) {
  const groups = { minis: 0, mittis: 0, maxis: 0 };
  let professor = 0; let bonus = 0; let playedRounds = 0;
  game.results.forEach((result, i) => {
    if (result === null || i === hiddenIndex) return;
    playedRounds++;
    if (i === 9) { bonus = kidsResultPoints(result); professor += 10; return; }
    const group = game.rounds[i].question.group as Exclude<KidsGroup, 'all'>;
    groups[group] += kidsResultPoints(result);
    professor += 7;
  });
  return { groups, bonus, team: groups.minis + groups.mittis + groups.maxis + bonus, professor, playedRounds };
}
/** Ergebnisse der drei Aufgaben einer Altersgruppe in Spielreihenfolge, für die Leuchtpunkte am Beamer. */
export function kidsGroupResults(game: KidsGame, group: Exclude<KidsGroup, 'all'>, hiddenIndex = -1): (KidsResult | null)[] {
  // In der Kurzshow hat jede Gruppe nur ihre Aufgabe im ersten Kapitel.
  return game.rounds.flatMap((round, i) => round.question.group === group && (!game.short || i < 3) ? [i === hiddenIndex ? null : game.results[i]] : []);
}
/** Das Kinderteam zieht mit der gerade aufgelösten Aufgabe an Professor Bluff vorbei. */
export function kidsOvertook(game: KidsGame): boolean {
  if (game.phase !== 'revealed' || game.results[game.index] === null) return false;
  const before = kidsScores(game, game.index), after = kidsScores(game);
  return before.team <= before.professor && after.team > after.professor;
}
/** Zeit und Punkte sind geräteunabhängig; doppelte oder unpassende Schritte ändern nichts. */
export function updateKidsGame(game: KidsGame, action: KidsAction, now: number): KidsGame {
  const phase = game.phase;
  if (action === 'jump-final') {
    if (!kidsCanJumpToFinal(game)) return game;
    return { ...game, index: game.rounds.length - 1, phase: 'superbluff', remainingMs: kidsAnswerMs(game), deadline: null,
      voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  }
  if (action === 'correct-last' || action === 'participated-last' || action === 'none-last') {
    const index = kidsLastScoredIndex(game), result = action.slice(0, -5) as KidsResult;
    if (index < 0 || game.results[index] === result) return game;
    const results = [...game.results]; results[index] = result;
    return { ...game, results, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  }
  if (action.startsWith('interjection:')) {
    const clip = professorInterjection(action.slice('interjection:'.length));
    if (!clip) return game;
    return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind: 'interjection', voiceClip: clip.id };
  }
  if (action === 'speak' && !['scene','returning','judging'].includes(phase)) return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind:'quote' };
  if (action === 'read-question' && phase === 'reading') return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind:'question' };
  if (action === 'stop-speech') return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  if (action === 'finish' && phase !== 'finished') return { ...game, phase: 'finished', remainingMs: 0, deadline: null };
  if (phase === 'scene' && (action === 'end-scene' || (action === 'tick' && now >= (game.deadline ?? now)))) return { ...game, phase: 'reading', deadline: null };
  if (action === 'next') {
    if (phase === 'welcome') return { ...game, phase: 'chapter', startedAt: game.startedAt ?? now };
    if (phase === 'chapter' || phase === 'superbluff') return { ...game, phase: 'reading' };
    if (phase === 'revealed') {
      if (game.index === 9) return updateKidsGame(game, 'finish', now);
      // Die Kurzshow geht nach ihrem einzigen Kapitel direkt ins Finale.
      const index = game.short && game.index === 2 ? 9 : game.index + 1;
      return { ...game, index, phase: index === 9 ? 'superbluff' : index % 3 === 0 ? 'chapter' : 'reading', remainingMs: kidsAnswerMs(game), deadline: null };
    }
  }
  if (action === 'start' && phase === 'reading') return { ...game, phase: 'moving', deadline: now + kidsAnswerMs(game) };
  if ((action === 'tick' || action === 'pause') && phase === 'moving') {
    const remainingMs = Math.max(0, (game.deadline ?? now) - now);
    if (remainingMs === 0) return { ...game, phase: 'locked', remainingMs: 0, deadline: null };
    return { ...game, remainingMs, ...(action === 'pause' ? { phase: 'paused' as const, deadline: null, voicePlaying: false, voiceCue: null } : {}) };
  }
  if (action === 'resume' && phase === 'paused') return { ...game, phase: 'moving', deadline: now + game.remainingMs };
  if (action === 'return' && phase === 'locked' && !game.short) return { ...game, phase: 'returning' };
  if (action === 'ready' && phase === 'returning') return { ...game, phase: 'judging' };
  if (['correct', 'participated', 'none'].includes(action) && kidsCanScore(game)) {
    const results = [...game.results]; results[game.index] = action as KidsResult;
    return { ...game, results, phase: 'revealed' };
  }
  if (action === 'scene' && phase === 'reading' && game.rounds[game.index].question.scene) return { ...game, phase: 'scene', deadline: now + KIDS_SCENE_MS, cueSeq: game.cueSeq + 1 };
  return game;
}
/** Nach dem Neuladen wartet die Show auf die Spielleitung: Der Countdown steht, eine Szene ist vorbei, der Professor schweigt. */
export function kidsResumeGame(game: KidsGame, now: number): KidsGame {
  const waiting = game.phase === 'moving' ? updateKidsGame(game, 'pause', now) : game.phase === 'scene' ? { ...game, phase: 'reading' as const, deadline: null } : game;
  return { ...waiting, voicePlaying: false, voiceCue: null };
}
export function kidsPrimaryAction(game: Pick<KidsGame, 'phase' | 'short'>): Exclude<KidsAction, 'tick'> | null {
  if (game.short && game.phase === 'locked') return null;
  return ({ welcome: 'next', chapter: 'next', superbluff: 'next', reading: 'start', scene: 'end-scene', paused: 'resume', locked: 'return', returning: 'ready', revealed: 'next' } as Partial<Record<KidsPhase, Exclude<KidsAction, 'tick'>>>)[game.phase] ?? null;
}
export function kidsActionLabel(game: KidsGame): string {
  if (game.phase === 'welcome') return 'Mission starten';
  if (game.phase === 'chapter') return 'Erste Aufgabe im Kapitel';
  if (game.phase === 'superbluff') return 'Gemeinsam ins Finale';
  if (game.phase === 'reading') return `${kidsAnswerMs(game) / 1000} Sekunden starten`;
  if (game.phase === 'scene') return 'Zur Frage';
  if (game.phase === 'paused') return 'Weiter geht’s';
  if (game.phase === 'locked') return 'Zurück in die Gruppen';
  if (game.phase === 'returning') return 'Alle sind zurück';
  if (game.index === 9) return 'Zum Abschluss';
  if (game.index === 8 || (game.short && game.index === 2)) return 'Zum Superbluff';
  return (game.index + 1) % 3 === 0 ? 'Nächstes Kapitel' : 'Nächste Aufgabe';
}
