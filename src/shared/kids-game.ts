import { KIDS_SHOW_QUESTIONS, type KidsShowQuestion, type KidsGroup } from './kids-show-questions';

export const KIDS_SECONDS = 30;
export type KidsPhase = 'welcome' | 'chapter' | 'superbluff' | 'reading' | 'moving' | 'paused' | 'locked' | 'returning' | 'judging' | 'revealed' | 'finished';
/** participated bleibt als gespeicherter Protokollwert erhalten: mindestens ein Kind richtig, ohne Mehrheit. */
export type KidsResult = 'correct' | 'participated' | 'none';
export function kidsResultPoints(result: KidsResult | null): number { return result === 'correct' ? 10 : result === 'participated' ? 5 : 0; }
export interface KidsRound { question: KidsShowQuestion; answers: string[]; correctIndex: number }
export interface KidsGame {
  rounds: KidsRound[]; index: number; phase: KidsPhase; remainingMs: number; deadline: number | null;
  results: (KidsResult | null)[]; jokerFor: number | null; cueSeq: number;
}
export type KidsAction = 'start' | 'pause' | 'resume' | 'tick' | 'return' | 'ready' | 'correct' | 'participated' | 'none' | 'next' | 'joker' | 'scene';

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createKidsGame(random: () => number = Math.random): KidsGame {
  const positions = shuffle([0, 1, 2, 0, 1, 2, 0, 1, 2], random);
  const rounds = KIDS_SHOW_QUESTIONS.map((question, i) => {
    const correctIndex = i === 9 ? Math.floor(random() * 3) : positions[i];
    const answers = shuffle(question.distractors, random); answers.splice(correctIndex, 0, question.answer);
    return { question, answers, correctIndex };
  });
  return { rounds, index: 0, phase: 'welcome', remainingMs: 30000, deadline: null, results: rounds.map(() => null), jokerFor: null, cueSeq: 0 };
}
export function kidsScores(game: KidsGame) {
  const groups = { minis: 0, mittis: 0, maxis: 0 };
  let professor = game.index === 9 ? 10 : 0; let bonus = 0; let pieces = 0;
  game.results.forEach((result, i) => {
    if (result === null) return;
    if (i === 9) { bonus = kidsResultPoints(result); return; }
    const group = game.rounds[i].question.group as Exclude<KidsGroup, 'all'>;
    groups[group] += kidsResultPoints(result);
    professor += 7; pieces++;
  });
  return { groups, bonus, team: groups.minis + groups.mittis + groups.maxis + bonus, professor, pieces };
}
/** Zeit und Punkte sind geräteunabhängig; doppelte oder unpassende Schritte ändern nichts. */
export function updateKidsGame(game: KidsGame, action: KidsAction, now: number): KidsGame {
  const phase = game.phase;
  if (action === 'next') {
    if (phase === 'welcome') return { ...game, phase: 'chapter' };
    if (phase === 'chapter' || phase === 'superbluff') return { ...game, phase: 'reading' };
    if (phase === 'revealed') {
      if (game.index === 9) return { ...game, phase: 'finished' };
      const index = game.index + 1;
      return { ...game, index, phase: index === 9 ? 'superbluff' : index % 3 === 0 ? 'chapter' : 'reading', remainingMs: 30000, deadline: null };
    }
  }
  if (action === 'start' && phase === 'reading') return { ...game, phase: 'moving', deadline: now + 30000 };
  if ((action === 'tick' || action === 'pause') && phase === 'moving') {
    const remainingMs = Math.max(0, (game.deadline ?? now) - now);
    if (remainingMs === 0) return { ...game, phase: 'locked', remainingMs: 0, deadline: null };
    return { ...game, remainingMs, ...(action === 'pause' ? { phase: 'paused' as const, deadline: null } : {}) };
  }
  if (action === 'resume' && phase === 'paused') return { ...game, phase: 'moving', deadline: now + game.remainingMs };
  if (action === 'return' && phase === 'locked') return { ...game, phase: 'returning' };
  if (action === 'ready' && phase === 'returning') return { ...game, phase: 'judging' };
  if (['correct', 'participated', 'none'].includes(action) && phase === 'judging' && game.results[game.index] === null) {
    const results = [...game.results]; results[game.index] = action as KidsResult;
    return { ...game, results, phase: 'revealed' };
  }
  if (action === 'joker' && game.jokerFor === null && game.index >= 3 && game.index <= 5 && phase === 'reading') return { ...game, jokerFor: game.index };
  if (action === 'scene' && phase === 'reading' && game.rounds[game.index].question.scene) return { ...game, cueSeq: game.cueSeq + 1 };
  return game;
}
export function kidsPrimaryAction(phase: KidsPhase): Exclude<KidsAction, 'tick'> | null {
  return ({ welcome: 'next', chapter: 'next', superbluff: 'next', reading: 'start', paused: 'resume', locked: 'return', returning: 'ready', revealed: 'next' } as Partial<Record<KidsPhase, Exclude<KidsAction, 'tick'>>>)[phase] ?? null;
}
export function kidsActionLabel(game: KidsGame): string {
  if (game.phase === 'welcome') return 'Mission starten';
  if (game.phase === 'chapter') return 'Erste Aufgabe im Kapitel';
  if (game.phase === 'superbluff') return 'Gemeinsam ins Finale';
  if (game.phase === 'reading') return '30 Sekunden starten';
  if (game.phase === 'paused') return 'Weiter geht’s';
  if (game.phase === 'locked') return 'Zurück in die Gruppen';
  if (game.phase === 'returning') return 'Alle sind zurück';
  if (game.index === 9) return 'Schatz öffnen';
  return game.index === 8 ? 'Zum Superbluff' : (game.index + 1) % 3 === 0 ? 'Nächstes Kapitel' : 'Nächste Aufgabe';
}
