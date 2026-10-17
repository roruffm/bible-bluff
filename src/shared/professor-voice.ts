import { kidsResultPoints, kidsScores, type KidsGame } from './kids-game';
import { PROFESSOR_INTERJECTIONS } from './professor-interjections';

// Diese zwei alten Aufnahmen erwähnen einen Schatz, den es im Spiel nicht mehr gibt.
const comfortClip = (index: number) => `comfort-${index === 4 ? 7 : index === 9 ? 2 : index}`;
const series = (name: string, count: number) => Array.from({ length: count }, (_, i) => `${name}-${i}`);

/** Alle Aufnahmen, die am Beamer erklingen können. „Show vorbereiten“ lädt sie vollständig vorab. */
export const PROFESSOR_VOICE_KEYS: readonly string[] = [...new Set([
  'welcome', 'intro', 'chapter2', 'chapter3', 'superbluff', 'win', 'lose',
  ...series('startled', 10), ...Array.from({ length: 10 }, (_, i) => comfortClip(i)), ...series('question', 10),
  ...PROFESSOR_INTERJECTIONS.map(clip => `interjection-${clip.id}`),
])];

/** Nur Aufnahmen, die zum aktuell sichtbaren Professor-Spruch passen. */
export function professorVoiceKey(game: KidsGame, kind:'quote'|'question'='quote'): string | null {
  if (kind==='question') return game.phase==='reading' ? `question-${game.index}` : null;
  // Während der Aufgabe zeigt der Beamer Professor Bluffs Behauptung. Dafür gibt es keine Aufnahme; die Spielleitung liest sie vor.
  if (['scene','returning','judging','reading','moving','paused','locked'].includes(game.phase)) return null;
  if (game.phase === 'welcome') return 'welcome';
  if (game.phase === 'superbluff') return 'superbluff';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'win' : 'lose';
  if (game.phase === 'revealed') {
    if (kidsResultPoints(game.results[game.index]) > 0) return `startled-${game.index}`;
    return comfortClip(game.index);
  }
  return game.index >= 6 ? 'chapter3' : game.index >= 3 ? 'chapter2' : 'intro';
}
