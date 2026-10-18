import { KIDS_QUESTIONS, type KidsQuestion } from './kids-questions';
import type { KidsSceneMotif } from './kids-scenes';

export type KidsGroup = 'minis' | 'mittis' | 'maxis' | 'all';
export type StoryMotif = 'ark' | 'manger' | 'lion' | 'fish' | 'leaf' | 'bread' | 'coin' | 'donkey' | 'twins' | 'boat' | 'tree' | 'crown' | 'one-day' | 'three-days' | 'forty-days' | 'coin-bread' | 'coin-pillow' | 'raven' | 'camel' | 'five-breads-two-fish' | 'three-breads-milk' | 'seven-figs-cheese' | 'runner' | 'small';
export interface KidsShowQuestion extends KidsQuestion {
  group: KidsGroup;
  pictures: readonly [StoryMotif, StoryMotif, StoryMotif];
  scene?: KidsSceneMotif;
  direction: string;
  /** Passender Gedanke nach der Auflösung, unabhängig von der Wertung. */
  revealQuote: string;
  /** Professor Bluff tippt selbstbewusst auf eine falsche Antwort. Die Kinder entlarven ihn. */
  bluff: { answer: string; claim: string };
}
export const KIDS_GROUPS = {
  minis: { name: 'Glühwürmchen', ages: '3–5 Jahre', symbol: 'firefly' },
  mittis: { name: 'Leuchtsterne', ages: '6–8 Jahre', symbol: 'star' },
  maxis: { name: 'Fackelträger', ages: '9–11 Jahre', symbol: 'torch' },
  all: { name: 'Alle gemeinsam', ages: 'Alle Kinder', symbol: '♥' },
} as const;
/** Feste Mitmach-Geste je Gruppe, solange eine andere Gruppe ihr Feld wählt. Verrät keine Antwort. */
export const KIDS_CHEERS = {
  minis: { icon: '✨', verb: 'funkeln' },
  mittis: { icon: '🥁', verb: 'trommeln' },
  maxis: { icon: '🤞', verb: 'drücken die Daumen' },
} as const;
export const KIDS_CHAPTERS = ['Die erste Spur', 'Der Bluff schlägt zurück', 'Die letzte Chance'] as const;
const from = (sourceId: string) => KIDS_QUESTIONS.find((q) => q.sourceId === sourceId)!;
/** Feste Dramaturgie aus dem vorhandenen Fragenpool. Antworten bleiben pro Frage auf denselben nummerierten Feldern. */
export const KIDS_SHOW_QUESTIONS: readonly KidsShowQuestion[] = [
  { ...from('1petr-arche'), group: 'minis', prompt: 'Wer ist mit den Tieren auf dem großen Schiff?', answer: 'Noah', distractors: ['Maria und das Baby', 'Daniel bei den Löwen'], pictures: ['ark', 'manger', 'lion'], scene: 'ark', explanation: 'Noah und seine Familie waren mit den Tieren in der Arche. Gott brachte sie sicher durch das Wasser.', revealQuote: 'Große Tiere, kleine Tiere – alle an Bord! Auch in unserem Team gehört jeder dazu. Du auch!', direction: 'Szene abspielen. Fackelträger machen Regen und Tierlaute, Eltern begleiten die Glühwürmchen zu den Feldern. Keine Antworten vorsagen.' , bluff: { answer: 'Daniel bei den Löwen', claim: 'Daniel kennt sich doch mit Löwen aus – war er dann nicht der Mann mit den Tieren auf dem Schiff?' } },
  { ...from('lt-jona'), group: 'mittis', prompt: 'Wie viele Tage und Nächte war Jona im großen Fisch?', answer: '3', distractors: ['1', '40'], pictures: ['three-days', 'one-day', 'forty-days'], revealQuote: 'Sogar im Fischbauch hat Jona mit Gott geredet! Du kannst das auch überall: im Bett, beim Spielen oder auf dem Schulhof.', direction: 'Die drei Zahlen deutlich vorlesen. Die übrigen Gruppen dürfen lautlos mitdenken.' , bluff: { answer: '40', claim: '40 Tage – diese Zahl kommt in der Bibel doch öfter vor. War Jona nicht auch so lange im Fisch?' } },
  { ...from('mt-muenze'), group: 'maxis', pictures: ['coin', 'coin-bread', 'coin-pillow'], revealQuote: 'Geld in einem Fisch? Ich finde da immer nur Gräten! Jesus wusste, was Petrus brauchte. Du darfst Jesus auch sagen, was du brauchst.', direction: 'Professor Bluffs Behauptung vorlesen. Die Fackelträger prüfen seinen Tipp.' , bluff: { answer: 'Unter einem Kopfkissen', claim: 'Eine Münze will man doch sicher aufbewahren – hat Petrus sie nicht unter seinem Kopfkissen gefunden?' } },
  { ...from('lt-krippe'), group: 'minis', prompt: 'Wo liegt das kleine Jesuskind?', answer: 'In der Krippe', distractors: ['Im großen Schiff', 'Unter einem Baum'], pictures: ['manger', 'ark', 'tree'], scene: 'manger', revealQuote: 'Ein Baby im Futtertrog? Da gehört doch Heu rein! Jesus kam als kleines Kind zu uns. Bei Gott sind auch die Kleinsten wichtig.', direction: 'Szene abspielen. Eltern wiegen ein unsichtbares Baby.' , bluff: { answer: 'Unter einem Baum', claim: 'Ein Baby braucht doch ein schattiges Plätzchen – lag das Jesuskind nicht unter einem Baum?' } },
  { ...from('lt-taube'), group: 'mittis', prompt: 'Was brachte die Taube zu Noah zurück?', answer: 'Ein Olivenblatt', distractors: ['Eine Krone', 'Ein Brot'], pictures: ['leaf', 'crown', 'bread'], revealQuote: 'Ein kleines Blatt – und Noah bekam neuen Mut! Auch du kannst jemandem Mut machen. Zum Beispiel mit einem lieben Wort.', direction: 'Eltern dürfen mit ihren drei nummerierten Karten mitraten.' , bluff: { answer: 'Ein Brot', claim: 'Nach so langer Zeit auf dem Schiff hatten bestimmt alle Hunger – brachte die Taube Noah nicht ein Brot?' } },
  { ...from('2petr-eselin'), group: 'maxis', pictures: ['donkey', 'raven', 'camel'], revealQuote: 'Ein sprechender Esel? I-Aah! Gott hat durch eine Eselin gesprochen. Auch du bist nicht zu klein, damit Gott dich gebrauchen kann!', direction: 'Ein eingeweihter Elternhelfer behauptet auf Nachfrage: „Ein sprechender Kühlschrank!“ Professor Bluff staunt über diese absurde Idee.' , bluff: { answer: 'Ein Kamel', claim: 'Für eine lange Reise ist ein Kamel doch praktisch – war das sprechende Tier nicht ein Kamel?' } },
  { ...from('lt-loewengrube'), group: 'minis', prompt: 'Welche Geschichte zeigen euch die Löwen?', answer: 'Daniel bei den Löwen', distractors: ['Noah auf der Arche', 'Jesus in der Krippe'], pictures: ['lion', 'ark', 'manger'], scene: 'lion', revealQuote: 'Bei den Löwen hätte ich ganz schön gezittert! Gott war bei Daniel. Wenn du Angst hast, darfst du Gott das sagen.', direction: 'Szene abspielen. Leuchtsterne machen freundliche Löwengeräusche. Gott schützt Daniel; keine gruselige Inszenierung.' , bluff: { answer: 'Noah auf der Arche', claim: 'Löwen gehören doch zu den Tieren auf Noahs Schiff – ist das nicht Noah auf der Arche?' } },
  { ...from('joh-junge'), group: 'mittis', prompt: 'Was brachte der Junge mit, als Jesus viele Menschen satt machte?', answer: '5 Brote und 2 Fische', distractors: ['3 Brote und Milch', '7 Feigen und Käse'], pictures: ['five-breads-two-fish', 'three-breads-milk', 'seven-figs-cheese'], revealQuote: 'So wenig Essen für so viele Leute? Doch Jesus machte alle satt!', direction: 'Antworten langsam vorlesen. Nach der Auflösung zeigen Eltern fünf Finger und danach zwei Finger.' , bluff: { answer: '7 Feigen und Käse', claim: 'Brot und Fisch klingt eher nach Abendessen. Hatte der Junge für unterwegs nicht sieben Feigen und Käse dabei?' } },
  { ...from('joh-thomas'), group: 'maxis', pictures: ['twins', 'runner', 'small'], revealQuote: 'Thomas brauchte etwas länger, um zu glauben. Jesus gab ihn trotzdem nicht auf!', direction: 'Die letzte Fackelträger-Aufgabe. Nach der Wertung kurz den gemeinsamen Weg aller drei Gruppen würdigen.' , bluff: { answer: 'Der Schnellste', claim: 'Didymus … das klingt doch nach Dynamik und Tempo! Bedeutet das nicht ‚der Schnellste‘?' } },
  { sourceId: 'mk-kissen', level: 1, group: 'all', prompt: 'Welche Geschichte spielen die Eltern?', answer: 'Jesus stillt den Sturm', distractors: ['Noah baut die Arche', 'Jesus wird geboren'], pictures: ['boat', 'ark', 'manger'], scene: 'boat', ref: 'Markus 4,35-41', explanation: 'Im Sturm schläft Jesus auf einem Kissen im Boot. Er steht auf, spricht zum Wind und zu den Wellen – und es wird still.', revealQuote: 'Sogar Wind und Wellen gehorchten Jesus! Für ihn ist kein Problem zu groß.', direction: 'Eltern spielen: Wellen, ein kleines Boot, Jesus schläft auf einem Kissen und macht den Sturm still. Glühwürmchen erkennen das Boot, Leuchtsterne das Kissen, Fackelträger die beruhigten Wellen. Alle beraten gemeinsam und wählen ihre Felder. Helfer prüfen, ob die Mehrheit, mindestens ein Kind oder niemand richtig steht.' , bluff: { answer: 'Noah baut die Arche', claim: 'So viel Wasser und alle in einem Boot – muss das nicht Noah mit seiner Arche sein?' } },
];

/** Das Motiv gehört zur Antwort, unabhängig vom zufällig zugewiesenen Feld. */
export function kidsAnswerPicture(question: KidsShowQuestion, answer: string): StoryMotif {
  const index = [question.answer, ...question.distractors].indexOf(answer);
  if (index < 0) throw new Error('Unbekannte Kids-Antwort');
  return question.pictures[index];
}
