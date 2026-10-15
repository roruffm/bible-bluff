import { KIDS_QUESTIONS, type KidsQuestion } from './kids-questions';
import type { KidsSceneMotif } from './kids-scenes';

export type KidsGroup = 'minis' | 'mittis' | 'maxis' | 'all';
export type StoryMotif = 'ark' | 'manger' | 'lion' | 'fish' | 'leaf' | 'bread' | 'coin' | 'donkey' | 'twins' | 'boat' | 'tree' | 'crown' | 'one-day' | 'three-days' | 'forty-days' | 'coin-bread' | 'coin-pillow' | 'raven' | 'camel' | 'five-breads-two-fish' | 'three-breads-milk' | 'seven-figs-cheese' | 'runner' | 'small';
export interface KidsShowQuestion extends KidsQuestion {
  group: KidsGroup;
  pictures: readonly [StoryMotif, StoryMotif, StoryMotif];
  scene?: KidsSceneMotif;
  direction: string;
}
export const KIDS_GROUPS = {
  minis: { name: 'Glühwürmchen', title: 'Die Spürnasen', ages: '3–5 Jahre', symbol: 'firefly' },
  mittis: { name: 'Leuchtsterne', title: 'Die Rätselknacker', ages: '6–8 Jahre', symbol: 'star' },
  maxis: { name: 'Fackelträger', title: 'Die Bluffjäger', ages: '9–11 Jahre', symbol: 'torch' },
  all: { name: 'Alle gemeinsam', title: 'Das BibleBluff-Team', ages: 'Alle Kinder', symbol: '♥' },
} as const;
export const KIDS_CHAPTERS = ['Die erste Spur', 'Der Bluff schlägt zurück', 'Die letzte Chance'] as const;
const from = (sourceId: string) => KIDS_QUESTIONS.find((q) => q.sourceId === sourceId)!;
/** Feste Dramaturgie aus dem vorhandenen Fragenpool. Antwortfelder werden pro Show gemischt. */
export const KIDS_SHOW_QUESTIONS: readonly KidsShowQuestion[] = [
  { ...from('1petr-arche'), group: 'minis', prompt: 'Wer ist mit den Tieren auf dem großen Schiff?', answer: 'Noah', distractors: ['Maria und das Baby', 'Daniel bei den Löwen'], pictures: ['ark', 'manger', 'lion'], scene: 'ark', explanation: 'Noah und seine Familie waren mit den Tieren in der Arche. Gott brachte sie sicher durch das Wasser.', direction: 'Szene abspielen. Fackelträger machen Regen und Tierlaute, Eltern begleiten die Glühwürmchen zu den Feldern. Keine Antworten vorsagen.' },
  { ...from('lt-jona'), group: 'mittis', prompt: 'Wie viele Tage und Nächte war Jona im großen Fisch?', answer: '3', distractors: ['1', '40'], pictures: ['three-days', 'one-day', 'forty-days'], direction: 'Die drei Zahlen deutlich vorlesen. Die übrigen Gruppen dürfen lautlos mitdenken.' },
  { ...from('mt-muenze'), group: 'maxis', pictures: ['coin', 'coin-bread', 'coin-pillow'], direction: 'Professor Bluff behauptet: „Eine Münze in einem Fisch? Das klingt doch erfunden!“ Die Fackelträger prüfen die Behauptung.' },
  { ...from('lt-krippe'), group: 'minis', prompt: 'Wo liegt das kleine Jesuskind?', answer: 'In der Krippe', distractors: ['Im großen Schiff', 'Unter einem Baum'], pictures: ['manger', 'ark', 'tree'], scene: 'manger', direction: 'Szene abspielen. Eltern wiegen ein unsichtbares Baby.' },
  { ...from('lt-taube'), group: 'mittis', prompt: 'Was brachte die Taube zu Noah zurück?', answer: 'Ein Olivenblatt', distractors: ['Eine Krone', 'Ein Brot'], pictures: ['leaf', 'crown', 'bread'], direction: 'Eltern dürfen mit ihren drei nummerierten Karten mitraten.' },
  { ...from('2petr-eselin'), group: 'maxis', pictures: ['donkey', 'raven', 'camel'], direction: 'Ein eingeweihter Elternhelfer behauptet auf Nachfrage: „Ein sprechender Kühlschrank!“ Professor Bluff staunt über diese absurde Idee.' },
  { ...from('lt-loewengrube'), group: 'minis', prompt: 'Welche Geschichte zeigen euch die Löwen?', answer: 'Daniel bei den Löwen', distractors: ['Noah auf der Arche', 'Jesus in der Krippe'], pictures: ['lion', 'ark', 'manger'], scene: 'lion', direction: 'Szene abspielen. Leuchtsterne machen freundliche Löwengeräusche. Gott schützt Daniel; keine gruselige Inszenierung.' },
  { ...from('joh-junge'), group: 'mittis', prompt: 'Was brachte der Junge mit, als Jesus viele Menschen satt machte?', answer: '5 Brote und 2 Fische', distractors: ['3 Brote und Milch', '7 Feigen und Käse'], pictures: ['five-breads-two-fish', 'three-breads-milk', 'seven-figs-cheese'], direction: 'Antworten langsam vorlesen. Nach der Auflösung zeigen Eltern fünf Finger und danach zwei Finger.' },
  { ...from('joh-thomas'), group: 'maxis', pictures: ['twins', 'runner', 'small'], direction: 'Die letzte Fackelträger-Aufgabe. Nach der Wertung kurz den gemeinsamen Weg aller drei Gruppen würdigen.' },
  { sourceId: 'mk-kissen', level: 1, group: 'all', prompt: 'Welche Geschichte spielen die Eltern?', answer: 'Jesus stillt den Sturm', distractors: ['Noah baut die Arche', 'Jesus wird geboren'], pictures: ['boat', 'ark', 'manger'], scene: 'boat', ref: 'Markus 4,35-41', explanation: 'Im Sturm schläft Jesus auf einem Kissen im Boot. Er steht auf, spricht zum Wind und zu den Wellen – und es wird still.', direction: 'Eltern spielen: Wellen, ein kleines Boot, Jesus schläft auf einem Kissen und macht den Sturm still. Glühwürmchen erkennen das Boot, Leuchtsterne das Kissen, Fackelträger die beruhigten Wellen. Alle beraten gemeinsam und wählen ihre Felder. Helfer prüfen, ob die Mehrheit, mindestens ein Kind oder niemand richtig steht.' },
];

/** Das Motiv gehört zur Antwort, unabhängig vom zufällig zugewiesenen Feld. */
export function kidsAnswerPicture(question: KidsShowQuestion, answer: string): StoryMotif {
  const index = [question.answer, ...question.distractors].indexOf(answer);
  if (index < 0) throw new Error('Unbekannte Kids-Antwort');
  return question.pictures[index];
}
