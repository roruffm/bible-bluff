// Bluff-Texte für die End-to-End-Tests. Die Fragen werden zufällig gezogen – diese Texte dürfen
// deshalb bei keiner Frage als „zu nah an der Wahrheit“ gelten. tests/questions.test.ts prüft das.
export const SAFE_BLUFFS = {
  host: 'Ein Zylinderhut aus Quarzglas',
  mirjam: 'Zwei Becher Ziegenmilch',
  anna: 'Eine Harfe aus Zedernholz',
} as const;
