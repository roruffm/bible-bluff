import { kidsResultPoints, kidsScores, type KidsGame } from './kids-game';

/** Stable IDs of prerecorded Professor Bluff audio files. */
export function professorVoiceKey(game: KidsGame): string {
  if (game.phase === 'welcome') return 'welcome';
  if (game.phase === 'superbluff') return 'superbluff';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'win' : 'lose';
  if (game.phase === 'revealed') return `${kidsResultPoints(game.results[game.index]) > 0 ? 'startled' : 'comfort'}-${game.index % 10}`;
  if (game.index >= 6) return 'chapter3';
  if (game.index >= 3) return 'chapter2';
  return 'intro';
}

export function availableProfessorVoices(game: KidsGame): string[] {
  const primary = professorVoiceKey(game);
  if (game.phase === 'scene') return [];
  if (game.phase === 'reading' && game.index === 2) return [primary, 'coin-claim'];
  if (game.phase === 'finished' && primary === 'win') return [primary, 'win-short'];
  return [primary];
}
