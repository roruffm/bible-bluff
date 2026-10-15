import { kidsResultPoints, kidsScores, type KidsGame } from './kids-game';

/** Nur Aufnahmen, die zum aktuell sichtbaren Professor-Spruch passen. */
export function professorVoiceKey(game: KidsGame, kind:'quote'|'question'='quote'): string | null {
  if (kind==='question') return game.phase==='reading' ? `question-${game.index}` : null;
  if (['scene','returning','judging'].includes(game.phase)) return null;
  if (game.phase === 'welcome') return 'welcome';
  if (game.phase === 'superbluff') return 'superbluff';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'win' : 'lose';
  if (game.phase === 'revealed') {
    if (kidsResultPoints(game.results[game.index]) > 0) return `startled-${game.index}`;
    // Diese zwei alten Aufnahmen erwähnen einen Schatz, den es im Spiel nicht mehr gibt.
    return `comfort-${game.index === 4 ? 7 : game.index === 9 ? 2 : game.index}`;
  }
  return game.index >= 6 ? 'chapter3' : game.index >= 3 ? 'chapter2' : 'intro';
}
