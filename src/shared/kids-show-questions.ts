import { KIDS_QUESTIONS, type KidsQuestion } from './kids-questions';

export type KidsGroup = 'minis' | 'mittis' | 'maxis' | 'all';
export type StoryMotif = 'ark' | 'manger' | 'lion' | 'fish' | 'leaf' | 'bread' | 'coin' | 'donkey' | 'twins' | 'boat' | 'tree' | 'crown';
export interface KidsShowQuestion extends KidsQuestion {
  group: KidsGroup;
  pictures: readonly [StoryMotif, StoryMotif, StoryMotif];
  scene?: StoryMotif;
  direction: string;
  hint: string;
}
export const KIDS_GROUPS = {
  minis: { name: 'Minis', title: 'Die Spürnasen', ages: '3–5 Jahre', symbol: '✦' },
  mittis: { name: 'Mittis', title: 'Die Rätselknacker', ages: '6–8 Jahre', symbol: '◆' },
  maxis: { name: 'Maxis', title: 'Die Bluffjäger', ages: '9–11 Jahre', symbol: '★' },
  all: { name: 'Alle gemeinsam', title: 'Das BibleBluff-Team', ages: 'Alle Kinder', symbol: '♥' },
} as const;
export const KIDS_CHAPTERS = ['Die erste Spur', 'Der Bluff schlägt zurück', 'Die letzte Chance'] as const;
const from = (sourceId: string) => KIDS_QUESTIONS.find((q) => q.sourceId === sourceId)!;
/** Feste Dramaturgie aus dem vorhandenen Fragenpool. Antwortfelder werden pro Show gemischt. */
export const KIDS_SHOW_QUESTIONS: readonly KidsShowQuestion[] = [
  { ...from('1petr-arche'), group: 'minis', prompt: 'Wer ist mit den Tieren auf dem großen Schiff?', answer: 'Noah', distractors: ['Maria und das Baby', 'Daniel bei den Löwen'], pictures: ['ark', 'manger', 'lion'], scene: 'ark', explanation: 'Noah und seine Familie waren mit den Tieren in der Arche. Gott brachte sie sicher durch das Wasser.', direction: 'Szene abspielen. Maxis machen Regen und Tierlaute, Eltern begleiten die Minis zu den Feldern. Keine Antworten vorsagen.', hint: 'Auf dem großen Schiff fahren viele Tiere mit.' },
  { ...from('lt-jona'), group: 'mittis', prompt: 'Wie viele Tage und Nächte war Jona im großen Fisch?', answer: '3', distractors: ['1', '40'], pictures: ['fish', 'fish', 'fish'], direction: 'Die drei Zahlen deutlich vorlesen. Die übrigen Gruppen dürfen lautlos mitdenken.', hint: 'Zähle: eins, zwei … und noch eins!' },
  { ...from('mt-muenze'), group: 'maxis', pictures: ['coin', 'bread', 'manger'], direction: 'Professor Bluff behauptet: „Eine Münze in einem Fisch? Das klingt doch erfunden!“ Die Maxis prüfen die Behauptung.', hint: 'Jesus schickt Petrus mit einer Angel los.' },
  { ...from('lt-krippe'), group: 'minis', prompt: 'Wo liegt das kleine Jesuskind?', answer: 'In der Krippe', distractors: ['Im großen Schiff', 'Unter einem Baum'], pictures: ['manger', 'ark', 'tree'], scene: 'manger', direction: 'Szene abspielen. Eltern wiegen ein unsichtbares Baby. Familienjoker: Eltern zeigen einen Futtertrog mit den Händen.', hint: 'Dort bekommen sonst die Tiere ihr Futter.' },
  { ...from('lt-taube'), group: 'mittis', prompt: 'Was brachte die Taube zu Noah zurück?', answer: 'Ein Olivenblatt', distractors: ['Eine Krone', 'Ein Brot'], pictures: ['leaf', 'crown', 'bread'], direction: 'Eltern dürfen mit ihren drei nummerierten Karten mitraten. Der Familienjoker kann vor dem Countdown freigeschaltet werden.', hint: 'Es wächst an einem Baum und ist grün.' },
  { ...from('2petr-eselin'), group: 'maxis', pictures: ['donkey', 'leaf', 'ark'], direction: 'Ein eingeweihter Elternhelfer behauptet auf Nachfrage: „Ein sprechender Kühlschrank!“ Professor Bluff staunt über diese absurde Idee.', hint: 'Das Tier hat lange Ohren und trägt oft Lasten.' },
  { ...from('lt-loewengrube'), group: 'minis', prompt: 'Welche Geschichte zeigen euch die Löwen?', answer: 'Daniel bei den Löwen', distractors: ['Noah auf der Arche', 'Jesus in der Krippe'], pictures: ['lion', 'ark', 'manger'], scene: 'lion', direction: 'Szene abspielen. Mittis machen freundliche Löwengeräusche. Gott schützt Daniel; keine gruselige Inszenierung.', hint: 'Daniel bleibt bei den Löwen unverletzt.' },
  { ...from('joh-junge'), group: 'mittis', prompt: 'Was brachte der Junge mit, als Jesus viele Menschen satt machte?', answer: '5 Brote und 2 Fische', distractors: ['3 Brote und Milch', '7 Feigen und Käse'], pictures: ['bread', 'bread', 'leaf'], direction: 'Antworten langsam vorlesen. Nach der Auflösung zeigen Eltern fünf Finger und danach zwei Finger.', hint: 'Eine Hand voll Brote und ein Paar Fische.' },
  { ...from('joh-thomas'), group: 'maxis', pictures: ['twins', 'boat', 'manger'], direction: 'Die letzte Maxi-Aufgabe. Nach der Wertung kurz den gemeinsamen Weg aller drei Gruppen würdigen.', hint: 'Zwei Geschwister mit demselben Geburtstag.' },
  { sourceId: 'mk-kissen', level: 1, group: 'all', prompt: 'Welche Geschichte spielen die Eltern?', answer: 'Jesus stillt den Sturm', distractors: ['Noah baut die Arche', 'Jesus wird geboren'], pictures: ['boat', 'ark', 'manger'], scene: 'boat', ref: 'Markus 4,35-41', explanation: 'Im Sturm schläft Jesus auf einem Kissen im Boot. Er steht auf, spricht zum Wind und zu den Wellen – und es wird still.', direction: 'Eltern spielen: Wellen, ein kleines Boot, Jesus schläft auf einem Kissen und macht den Sturm still. Minis erkennen das Boot, Mittis das Kissen, Maxis die beruhigten Wellen. Alle beraten gemeinsam. Helfer stellen eine gemeinsame Antwort fest.', hint: 'Ein Kissen, ein Boot und plötzlich ganz stilles Wasser.' },
];
