import { kidsResultPoints, kidsScores, type KidsGame } from './kids-game';
import { PROFESSOR_INTERJECTIONS } from './professor-interjections';

// Diese zwei alten Aufnahmen erwähnen einen Schatz, den es im Spiel nicht mehr gibt.
const comfortClip = (index: number) => `comfort-${index === 4 ? 7 : index === 9 ? 2 : index}`;
const series = (name: string, count: number) => Array.from({ length: count }, (_, i) => `${name}-${i}`);

// Diese Aufgaben verwenden auch die Feldnummern aus den hochgeladenen Antwortaufnahmen.
const uploadedAnswerRounds = [2, 3, 4, 5, 6, 8, 9];

/** Alle Aufnahmen, die am Beamer erklingen können. „Show vorbereiten“ lädt sie vollständig vorab. */
export const PROFESSOR_VOICE_KEYS: readonly string[] = [...new Set([
  'welcome', 'intro', 'chapter2', 'chapter3', 'superbluff-finale20', 'win', 'lose',
  ...series('startled', 10), ...Array.from({ length: 10 }, (_, i) => comfortClip(i)), ...series('question', 10),
  ...series('answer-number', 3), ...Array.from({ length: 10 }, (_, i) => series(`answer-${i}`, 3)).flat(),
  ...uploadedAnswerRounds.flatMap(index => series(`answer-number-${index}`, 3)),
  ...PROFESSOR_INTERJECTIONS.map(clip => `interjection-${clip.id}`),
])];

/** Nur Aufnahmen, die zum aktuell sichtbaren Professor-Spruch passen. */
export function professorVoiceKey(game: KidsGame, kind:'quote'|'question'='quote'): string | null {
  if (kind==='question') return game.phase==='reading' ? `question-${game.index}` : null;
  // Während der Aufgabe zeigt der Beamer Professor Bluffs Behauptung. Dafür gibt es keine Aufnahme; die Spielleitung liest sie vor.
  if (['scene','returning','judging','reading','moving','paused','locked'].includes(game.phase)) return null;
  if (game.phase === 'welcome') return 'welcome';
  if (game.phase === 'superbluff') return 'superbluff-finale20';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'win' : 'lose';
  if (game.phase === 'revealed') {
    if (kidsResultPoints(game.results[game.index], game.index) > 0) return `startled-${game.index}`;
    return comfortClip(game.index);
  }
  return game.index >= 6 ? 'chapter3' : game.index >= 3 ? 'chapter2' : 'intro';
}

/** Die Felder werden gemischt: Nummer und Antwort folgen der sichtbaren Reihenfolge. */
export function professorAnswerVoiceKeys(game: KidsGame): string[] {
  if (game.phase !== 'reading') return [];
  const { question, answers } = game.rounds[game.index];
  const original = [question.answer, ...question.distractors];
  const numberPrefix = uploadedAnswerRounds.includes(game.index) ? `answer-number-${game.index}` : 'answer-number';
  return answers.flatMap((answer, field) => [`${numberPrefix}-${field}`, `answer-${game.index}-${original.indexOf(answer)}`]);
}
