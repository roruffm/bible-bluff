import { KIDS_QUESTIONS, type KidsQuestion } from '../../shared/kids-questions';

export const KIDS_SECONDS = 30;
export type KidsPhase = 'reading' | 'moving' | 'paused' | 'locked' | 'revealed' | 'finished';
export interface KidsRound { question: KidsQuestion; answers: string[]; correctIndex: number }
export interface KidsGame {
  rounds: KidsRound[];
  index: number;
  phase: KidsPhase;
  remainingMs: number;
  deadline: number | null;
}
export type KidsAction = 'start' | 'pause' | 'resume' | 'tick' | 'reveal' | 'next';

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createKidsGame(count: number, easy = false, random: () => number = Math.random): KidsGame {
  const pool = KIDS_QUESTIONS.filter((q) => !easy || q.level === 1);
  const selected = shuffle(pool, random).slice(0, Math.max(1, Math.min(pool.length, Math.floor(count) || 1)));
  // Ungefähr gleich oft Feld 1, 2 und 3. Auch nach Wiederholung keine feste Reihenfolge.
  const positions = shuffle(selected.map((_, i) => i % 3), random);
  const rounds = selected.map((question, i) => {
    const answers = shuffle(question.distractors, random);
    answers.splice(positions[i], 0, question.answer);
    return { question, answers, correctIndex: positions[i] };
  });
  return { rounds, index: 0, phase: 'reading', remainingMs: KIDS_SECONDS * 1000, deadline: null };
}

/** Deadline statt tickbasierter Sekunden: Tabwechsel oder ein langsamer Rechner verlängern die Zeit nicht. */
export function updateKidsGame(game: KidsGame, action: KidsAction, now: number): KidsGame {
  if (action === 'start' && game.phase === 'reading') return { ...game, phase: 'moving', deadline: now + KIDS_SECONDS * 1000 };
  if ((action === 'tick' || action === 'pause') && game.phase === 'moving') {
    const remainingMs = Math.max(0, (game.deadline ?? now) - now);
    if (remainingMs === 0) return { ...game, phase: 'locked', remainingMs: 0, deadline: null };
    return { ...game, remainingMs, ...(action === 'pause' ? { phase: 'paused' as const, deadline: null } : {}) };
  }
  if (action === 'resume' && game.phase === 'paused') return { ...game, phase: 'moving', deadline: now + game.remainingMs };
  if (action === 'reveal' && game.phase === 'locked') return { ...game, phase: 'revealed' };
  if (action === 'next' && game.phase === 'revealed') {
    if (game.index + 1 === game.rounds.length) return { ...game, phase: 'finished' };
    return { ...game, index: game.index + 1, phase: 'reading', remainingMs: KIDS_SECONDS * 1000, deadline: null };
  }
  return game;
}

export function kidsPrimaryAction(phase: KidsPhase): KidsAction | null {
  return ({ reading: 'start', paused: 'resume', locked: 'reveal', revealed: 'next' } as const)[phase as 'reading' | 'paused' | 'locked' | 'revealed'] ?? null;
}
