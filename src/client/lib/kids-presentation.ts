import { kidsResultPoints, type KidsGame, type KidsResult } from '../../shared/kids-game';

export type KidsPresentationMoment =
  | { kind: 'group'; index: number }
  | { kind: 'points'; index: number; result: KidsResult; points: number };

/** Nur echte Vorwärtsschritte feiern: kein Wiederholen nach Neuladen, Rückweg oder Wertungskorrektur. */
export function kidsPresentationMoment(before: KidsGame | null, game: KidsGame | null): KidsPresentationMoment | null {
  if (!before || !game) return null;
  if (game.phase === 'reading' && game.rounds[game.index].question.group !== 'all' &&
    ((before.phase === 'chapter' && before.index === game.index) ||
      (before.phase === 'revealed' && game.index === before.index + 1))) return { kind: 'group', index: game.index };
  const result = game.results[game.index];
  if (before.phase === 'judging' && game.phase === 'revealed' && before.index === game.index &&
    before.results[game.index] === null && result !== null) {
    const points = kidsResultPoints(result, game.index);
    if (points > 0) return { kind: 'points', index: game.index, result, points };
  }
  return null;
}
