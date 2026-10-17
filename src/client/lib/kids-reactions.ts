import { kidsResultPoints, type KidsGame } from '../../shared/kids-game';

const STARTLED = [
  'Huch! Schon Punkte für euch? Meine Brille braucht einen Sicherheitsgurt!',
  'Potzblitz! Ihr habt meinen Bluff entdeckt. Mein Schnurrbart zittert!',
  'Waaas? Noch mehr Teampunkte! Wo ist mein Notfall-Denkhut?',
  'Hoppla! Ihr seid mir auf der Spur. Ich muss dringend nachlesen!',
  'Oha! Euer Detektivteam macht meinem Superhirn Beine!',
  'Hilfe, mein Bluff wackelt! Ihr seid ja richtig gute Spürnasen!',
  'Huch! Da hüpft mir vor Schreck fast die Brille von der Nase!',
  'Donnerwetter! Ihr sammelt Punkte schneller als ich Ausreden!',
  'Ei, ei, ei! Mein großer Plan bekommt ganz kleine Knie!',
  'Mein Superbluff! Geknackt! Ich brauche eine neue Rätsel-Ausbildung!',
];
const COMFORT = [
  'Das war knifflig! Kopf hoch – die nächste Spur wartet schon.',
  'Nicht jede Spur ist sofort klar. Wir entdecken einfach weiter!',
  'Auch große Detektive rätseln mal daneben. Ihr bleibt ein tolles Team!',
  'Einmal tief durchatmen. Ihr gehört alle dazu – und weiter geht’s!',
  'Ihr habt zusammen überlegt. Bleibt neugierig und haltet zusammen!',
  'Meine Rätsel haben Ecken und Kanten. Euer Zusammenhalt ist stärker!',
  'Kopf hoch, Spürnasen! Zusammen findet ihr die nächste Spur.',
  'Ihr habt zusammen überlegt. Bleibt neugierig und haltet zusammen!',
  'Ein schweres Rätsel ändert nichts: Jeder von euch ist wichtig!',
  'Auch große Detektive rätseln mal daneben. Ihr bleibt ein tolles Team!',
];
/** Die aktuelle Runde entscheidet über die Reaktion, unabhängig vom Gesamtstand. */
export function kidsRoundReaction(game: KidsGame) {
  const points = kidsResultPoints(game.results[game.index], game.index);
  return {
    points,
    mood: points > 0 ? 'startled' as const : 'kind' as const,
    quote: (points > 0 ? STARTLED : COMFORT)[game.index % STARTLED.length],
    caption: points > 0 ? `+${points} für euer Team!` : 'Zusammen geht’s weiter!',
  };
}
