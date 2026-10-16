import { kidsResultPoints, type KidsGame } from '../../shared/kids-game';

export type ProfessorMotion = 'greet' | 'startle' | 'spin' | 'stumble' | 'double-take' | 'encourage' | 'guide' | 'think' | 'bow' | 'nervous';

/** Feste Choreografie pro Szene: Polling und Timer rendern dieselbe Bewegung nicht neu. */
export function professorMotion(game: KidsGame): ProfessorMotion | undefined {
  if (game.phase === 'welcome') return 'greet';
  if (game.phase === 'chapter') return (['spin', 'double-take', 'nervous'] as const)[Math.min(2, Math.floor(game.index / 3))];
  if (game.phase === 'superbluff') return 'nervous';
  if (game.phase === 'returning') return 'guide';
  if (game.phase === 'judging') return 'think';
  if (game.phase === 'finished') return 'bow';
  if (game.phase === 'revealed') {
    if (kidsResultPoints(game.results[game.index]) === 0) return 'encourage';
    return (['startle', 'double-take', 'stumble', 'spin', 'startle', 'double-take', 'stumble', 'spin', 'startle', 'spin'] as const)[game.index];
  }
  return undefined;
}
