import { kidsResultPoints, type KidsGame } from '../../shared/kids-game';

/** Die aktuelle Runde entscheidet über die Reaktion, unabhängig vom Gesamtstand. */
export function kidsRoundReaction(game: KidsGame) {
  const points = kidsResultPoints(game.results[game.index], game.index);
  return {
    points,
    mood: points > 0 ? 'startled' as const : 'kind' as const,
    quote: game.rounds[game.index].question.revealQuote,
    caption: points > 0 ? `+${points} für euer Team!` : 'Zusammen geht’s weiter!',
  };
}
