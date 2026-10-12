// „Mein Vers für die Woche“: Verse, die von Jesus und Gottes Nähe sprechen – passend zu den Büchern,
// aus denen die Fragen einer Partie stammen. Wortlaut: Lutherbibel 1912 (gemeinfrei) mit heutiger
// Rechtschreibung (dass statt daß …), sonst unverändert; Teilverse beginnen beim Kern des Satzes.
// Stellenangaben in der heute üblichen Zählung. Quellen: ebible.org (deu1912), abgeglichen mit bolls.life (LUT).

import type { BookGroup, Lang } from './types';
import { EN_VERSE_SOURCE, EN_WEEK_VERSES } from './verses-en';

export interface WeekVerse {
  id: string;
  /** Buch wie in den Fragen („Johannes“, „1. Mose“) – darüber passt der Vers zur Partie */
  book: string;
  group: BookGroup;
  ref: string;
  text: string;
}

export const VERSE_SOURCE = 'Lutherbibel 1912';

/** Übersetzung, aus der die Verse stammen – für Bild, Kalender und Hinweise */
export function verseSource(lang: Lang): string {
  return lang === 'en' ? EN_VERSE_SOURCE : VERSE_SOURCE;
}

/** Die Verse in der Sprache des Raums – auf Englisch dieselben IDs, Bücher auf Englisch */
export function versesFor(lang: Lang): WeekVerse[] {
  return lang === 'en' ? EN_WEEK_VERSES : WEEK_VERSES;
}

export const WEEK_VERSES: WeekVerse[] = [
  // Evangelien
  { id: 'mt-11-28', book: 'Matthäus', group: 'evangelien', ref: 'Matthäus 11,28', text: 'Kommet her zu mir alle, die ihr mühselig und beladen seid; ich will euch erquicken.' },
  { id: 'mt-28-20', book: 'Matthäus', group: 'evangelien', ref: 'Matthäus 28,20', text: 'Und siehe, ich bin bei euch alle Tage bis an der Welt Ende.' },
  { id: 'mt-6-33', book: 'Matthäus', group: 'evangelien', ref: 'Matthäus 6,33', text: 'Trachtet am ersten nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch solches alles zufallen.' },
  { id: 'mk-9-24', book: 'Markus', group: 'evangelien', ref: 'Markus 9,24', text: 'Ich glaube, lieber HERR, hilf meinem Unglauben!' },
  { id: 'mk-10-27', book: 'Markus', group: 'evangelien', ref: 'Markus 10,27', text: 'Bei den Menschen ist’s unmöglich, aber nicht bei Gott; denn alle Dinge sind möglich bei Gott.' },
  { id: 'mk-10-45', book: 'Markus', group: 'evangelien', ref: 'Markus 10,45', text: 'Denn auch des Menschen Sohn ist nicht gekommen, dass er sich dienen lasse, sondern dass er diene und gebe sein Leben zur Bezahlung für viele.' },
  { id: 'lk-19-10', book: 'Lukas', group: 'evangelien', ref: 'Lukas 19,10', text: 'Denn des Menschen Sohn ist gekommen, zu suchen und selig zu machen, das verloren ist.' },
  { id: 'lk-12-7', book: 'Lukas', group: 'evangelien', ref: 'Lukas 12,7', text: 'Aber auch die Haare auf eurem Haupt sind alle gezählt. Darum fürchtet euch nicht; ihr seid besser denn viele Sperlinge.' },
  { id: 'lk-1-37', book: 'Lukas', group: 'evangelien', ref: 'Lukas 1,37', text: 'Denn bei Gott ist kein Ding unmöglich.' },
  { id: 'joh-15-15', book: 'Johannes', group: 'evangelien', ref: 'Johannes 15,15', text: 'Ich sage hinfort nicht, dass ihr Knechte seid; denn ein Knecht weiß nicht, was sein Herr tut. Euch aber habe ich gesagt, dass ihr Freunde seid.' },
  { id: 'joh-3-16', book: 'Johannes', group: 'evangelien', ref: 'Johannes 3,16', text: 'Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.' },
  { id: 'joh-8-12', book: 'Johannes', group: 'evangelien', ref: 'Johannes 8,12', text: 'Ich bin das Licht der Welt; wer mir nachfolgt, der wird nicht wandeln in der Finsternis, sondern wird das Licht des Lebens haben.' },
  { id: 'joh-14-27', book: 'Johannes', group: 'evangelien', ref: 'Johannes 14,27', text: 'Den Frieden lasse ich euch, meinen Frieden gebe ich euch. Nicht gebe ich euch, wie die Welt gibt. Euer Herz erschrecke nicht und fürchte sich nicht.' },
  { id: 'joh-6-35', book: 'Johannes', group: 'evangelien', ref: 'Johannes 6,35', text: 'Ich bin das Brot des Lebens. Wer zu mir kommt, den wird nicht hungern; und wer an mich glaubt, den wird nimmermehr dürsten.' },
  { id: 'joh-15-5', book: 'Johannes', group: 'evangelien', ref: 'Johannes 15,5', text: 'Ich bin der Weinstock, ihr seid die Reben. Wer in mir bleibt und ich in ihm, der bringt viele Frucht, denn ohne mich könnt ihr nichts tun.' },
  { id: 'joh-10-10', book: 'Johannes', group: 'evangelien', ref: 'Johannes 10,10', text: 'Ich bin gekommen, dass sie das Leben und volle Genüge haben sollen.' },
  { id: 'joh-14-6', book: 'Johannes', group: 'evangelien', ref: 'Johannes 14,6', text: 'Ich bin der Weg und die Wahrheit und das Leben; niemand kommt zum Vater denn durch mich.' },

  // Apostelgeschichte
  { id: 'apg-17-27', book: 'Apostelgeschichte', group: 'geschichte', ref: 'Apostelgeschichte 17,27–28', text: 'Fürwahr, er ist nicht ferne von einem jeglichen unter uns. Denn in ihm leben, weben und sind wir.' },
  { id: 'apg-1-8', book: 'Apostelgeschichte', group: 'geschichte', ref: 'Apostelgeschichte 1,8', text: 'Ihr werdet die Kraft des Heiligen Geistes empfangen, welcher auf euch kommen wird, und werdet meine Zeugen sein.' },
  { id: 'apg-16-31', book: 'Apostelgeschichte', group: 'geschichte', ref: 'Apostelgeschichte 16,31', text: 'Glaube an den HERRN Jesus Christus, so wirst du und dein Haus selig!' },

  // Paulusbriefe
  { id: 'roem-5-8', book: 'Römer', group: 'paulus', ref: 'Römer 5,8', text: 'Darum preiset Gott seine Liebe gegen uns, dass Christus für uns gestorben ist, da wir noch Sünder waren.' },
  { id: 'roem-8-28', book: 'Römer', group: 'paulus', ref: 'Römer 8,28', text: 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Besten dienen.' },
  { id: 'roem-15-13', book: 'Römer', group: 'paulus', ref: 'Römer 15,13', text: 'Der Gott aber der Hoffnung erfülle euch mit aller Freude und Frieden im Glauben.' },
  { id: '1kor-13-13', book: '1. Korinther', group: 'paulus', ref: '1. Korinther 13,13', text: 'Nun aber bleibt Glaube, Hoffnung, Liebe, diese drei; aber die Liebe ist die größte unter ihnen.' },
  { id: '1kor-16-14', book: '1. Korinther', group: 'paulus', ref: '1. Korinther 16,14', text: 'Alle eure Dinge lasset in der Liebe geschehen!' },
  { id: '2kor-5-17', book: '2. Korinther', group: 'paulus', ref: '2. Korinther 5,17', text: 'Ist jemand in Christo, so ist er eine neue Kreatur; das Alte ist vergangen, siehe, es ist alles neu geworden!' },
  { id: '2kor-12-9', book: '2. Korinther', group: 'paulus', ref: '2. Korinther 12,9', text: 'Lass dir an meiner Gnade genügen; denn meine Kraft ist in den Schwachen mächtig.' },
  { id: 'gal-2-20', book: 'Galater', group: 'paulus', ref: 'Galater 2,20', text: 'Ich lebe aber; doch nun nicht ich, sondern Christus lebt in mir.' },
  { id: 'gal-6-2', book: 'Galater', group: 'paulus', ref: 'Galater 6,2', text: 'Einer trage des andern Last, so werdet ihr das Gesetz Christi erfüllen.' },
  { id: 'eph-2-8', book: 'Epheser', group: 'paulus', ref: 'Epheser 2,8', text: 'Denn aus Gnade seid ihr selig geworden durch den Glauben, und das nicht aus euch: Gottes Gabe ist es.' },
  { id: 'phil-4-13', book: 'Philipper', group: 'paulus', ref: 'Philipper 4,13', text: 'Ich vermag alles durch den, der mich mächtig macht, Christus.' },
  { id: 'phil-4-4', book: 'Philipper', group: 'paulus', ref: 'Philipper 4,4', text: 'Freuet euch in dem HERRN allewege! Und abermals sage ich: Freuet euch!' },
  { id: 'phil-4-6', book: 'Philipper', group: 'paulus', ref: 'Philipper 4,6', text: 'Sorget nichts! sondern in allen Dingen lasset eure Bitten im Gebet und Flehen mit Danksagung vor Gott kund werden.' },
  { id: 'kol-3-15', book: 'Kolosser', group: 'paulus', ref: 'Kolosser 3,15', text: 'Und der Friede Gottes regiere in euren Herzen, zu welchem ihr auch berufen seid in einem Leibe; und seid dankbar!' },
  { id: '1thess-5-16', book: '1. Thessalonicher', group: 'paulus', ref: '1. Thessalonicher 5,16–18', text: 'Seid allezeit fröhlich, betet ohne Unterlass, seid dankbar in allen Dingen; denn das ist der Wille Gottes in Christo Jesu an euch.' },
  { id: '2thess-3-3', book: '2. Thessalonicher', group: 'paulus', ref: '2. Thessalonicher 3,3', text: 'Aber der HERR ist treu; der wird euch stärken und bewahren vor dem Argen.' },
  { id: '1tim-4-12', book: '1. Timotheus', group: 'pastoral', ref: '1. Timotheus 4,12', text: 'Niemand verachte deine Jugend; sondern sei ein Vorbild den Gläubigen im Wort, im Wandel, in der Liebe, im Geist, im Glauben, in der Keuschheit.' },
  { id: '1tim-1-15', book: '1. Timotheus', group: 'pastoral', ref: '1. Timotheus 1,15', text: 'Das ist gewisslich wahr und ein teuer wertes Wort, dass Christus Jesus gekommen ist in die Welt, die Sünder selig zu machen.' },
  { id: '2tim-1-7', book: '2. Timotheus', group: 'pastoral', ref: '2. Timotheus 1,7', text: 'Denn Gott hat uns nicht gegeben den Geist der Furcht, sondern der Kraft und der Liebe und der Zucht.' },

  // Weitere Briefe
  { id: 'hebr-13-8', book: 'Hebräer', group: 'allgemein', ref: 'Hebräer 13,8', text: 'Jesus Christus gestern und heute und derselbe auch in Ewigkeit.' },
  { id: 'hebr-13-5', book: 'Hebräer', group: 'allgemein', ref: 'Hebräer 13,5', text: 'Denn er hat gesagt: „Ich will dich nicht verlassen noch versäumen.“' },
  { id: 'hebr-4-16', book: 'Hebräer', group: 'allgemein', ref: 'Hebräer 4,16', text: 'Darum lasst uns hinzutreten mit Freudigkeit zu dem Gnadenstuhl, auf dass wir Barmherzigkeit empfangen und Gnade finden.' },
  { id: 'jak-4-8', book: 'Jakobus', group: 'allgemein', ref: 'Jakobus 4,8', text: 'Nahet euch zu Gott, so naht er sich zu euch.' },
  { id: 'jak-1-5', book: 'Jakobus', group: 'allgemein', ref: 'Jakobus 1,5', text: 'So aber jemand unter euch Weisheit mangelt, der bitte Gott, der da gibt einfältig jedermann und rücket’s niemand auf, so wird sie ihm gegeben werden.' },
  { id: '1petr-5-7', book: '1. Petrus', group: 'allgemein', ref: '1. Petrus 5,7', text: 'Alle Sorge werfet auf ihn; denn er sorgt für euch.' },
  { id: '2petr-3-18', book: '2. Petrus', group: 'allgemein', ref: '2. Petrus 3,18', text: 'Wachset aber in der Gnade und Erkenntnis unsers HERRN und Heilandes Jesu Christi.' },
  { id: '1joh-4-19', book: '1. Johannes', group: 'allgemein', ref: '1. Johannes 4,19', text: 'Lasset uns ihn lieben; denn er hat uns zuerst geliebt.' },
  { id: '1joh-3-1', book: '1. Johannes', group: 'allgemein', ref: '1. Johannes 3,1', text: 'Sehet, welch eine Liebe hat uns der Vater erzeigt, dass wir Gottes Kinder sollen heißen!' },
  { id: '1joh-4-16', book: '1. Johannes', group: 'allgemein', ref: '1. Johannes 4,16', text: 'Gott ist die Liebe; und wer in der Liebe bleibt, der bleibt in Gott und Gott in ihm.' },
  { id: '1joh-1-9', book: '1. Johannes', group: 'allgemein', ref: '1. Johannes 1,9', text: 'So wir aber unsre Sünden bekennen, so ist er treu und gerecht, dass er uns die Sünden vergibt und reinigt uns von aller Untugend.' },

  // Offenbarung
  { id: 'offb-3-20', book: 'Offenbarung', group: 'prophetie', ref: 'Offenbarung 3,20', text: 'Siehe, ich stehe vor der Tür und klopfe an. So jemand meine Stimme hören wird und die Tür auftun, zu dem werde ich eingehen und das Abendmahl mit ihm halten und er mit mir.' },
  { id: 'offb-21-5', book: 'Offenbarung', group: 'prophetie', ref: 'Offenbarung 21,5', text: 'Siehe, ich mache alles neu!' },
  { id: 'offb-21-4', book: 'Offenbarung', group: 'prophetie', ref: 'Offenbarung 21,4', text: 'Und Gott wird abwischen alle Tränen von ihren Augen, und der Tod wird nicht mehr sein, noch Leid noch Geschrei noch Schmerz wird mehr sein.' },

  // Altes Testament
  { id: '1mo-16-13', book: '1. Mose', group: 'at', ref: '1. Mose 16,13', text: 'Du Gott siehst mich.' },
  { id: '1mo-28-15', book: '1. Mose', group: 'at', ref: '1. Mose 28,15', text: 'Und siehe, ich bin mit dir und will dich behüten, wo du hin ziehst.' },
  { id: '2mo-14-14', book: '2. Mose', group: 'at', ref: '2. Mose 14,14', text: 'Der HERR wird für euch streiten, und ihr werdet still sein.' },
  { id: 'jos-1-9', book: 'Josua', group: 'at', ref: 'Josua 1,9', text: 'Lass dir nicht grauen und entsetze dich nicht; denn der HERR, dein Gott, ist mit dir in allem, was du tun wirst.' },
  { id: 'ri-6-12', book: 'Richter', group: 'at', ref: 'Richter 6,12', text: 'Der HERR mit dir, du streitbarer Held!' },
  { id: '1sam-16-7', book: '1. Samuel', group: 'at', ref: '1. Samuel 16,7', text: 'Ein Mensch sieht, was vor Augen ist; der HERR aber sieht das Herz an.' },
  { id: '1koe-19-7', book: '1. Könige', group: 'at', ref: '1. Könige 19,7', text: 'Steh auf und iss! denn du hast einen großen Weg vor dir.' },
  { id: '2koe-6-16', book: '2. Könige', group: 'at', ref: '2. Könige 6,16', text: 'Fürchte dich nicht! denn derer ist mehr, die bei uns sind, als derer, die bei ihnen sind.' },
  { id: 'neh-8-10', book: 'Nehemia', group: 'at', ref: 'Nehemia 8,10', text: 'Die Freude am HERRN ist eure Stärke.' },
  { id: 'jer-29-11', book: 'Jeremia', group: 'at', ref: 'Jeremia 29,11', text: 'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leidens.' },
  { id: 'hes-36-26', book: 'Hesekiel', group: 'at', ref: 'Hesekiel 36,26', text: 'Und ich will euch ein neues Herz und einen neuen Geist in euch geben.' },
  { id: 'jona-2-3', book: 'Jona', group: 'at', ref: 'Jona 2,3', text: 'Ich rief zu dem HERRN in meiner Angst, und er antwortete mir.' },
  { id: 'ps-23-1', book: 'Psalm', group: 'at', ref: 'Psalm 23,1', text: 'Der HERR ist mein Hirte; mir wird nichts mangeln.' },
  { id: 'jes-43-1', book: 'Jesaja', group: 'at', ref: 'Jesaja 43,1', text: 'Fürchte dich nicht, denn ich habe dich erlöst; ich habe dich bei deinem Namen gerufen; du bist mein!' },
  { id: 'klgl-3-22', book: 'Klagelieder', group: 'at', ref: 'Klagelieder 3,22–23', text: 'Die Güte des HERRN ist’s, dass wir nicht gar aus sind; seine Barmherzigkeit hat noch kein Ende, sondern sie ist alle Morgen neu, und deine Treue ist groß.' },
];

/** Wenn die Partie kaum passende Verse hergibt: Worte, in denen Jesus selbst einlädt */
const CORE = ['joh-15-15', 'mt-11-28', 'offb-3-20', 'joh-14-27', 'mt-28-20'];

/** Fester, gut verteilter Zahlenwert je Frage – so bekommen Fragen aus demselben Buch verschiedene Verse */
function spread(key: string): number {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Bis zu `max` Verse passend zur Partie: zuerst aus denselben Büchern wie die Fragen (in deren
 * Reihenfolge), dann aus derselben Buchgruppe – zuerst für Fragen, deren Buch keinen eigenen Vers hat –,
 * zuletzt Kernverse, in denen Jesus selbst einlädt.
 */
export function suggestVerses(items: { book: string; group: BookGroup; key?: string }[], max = 4, lang: Lang = 'de'): WeekVerse[] {
  const verses = versesFor(lang);
  const picked: WeekVerse[] = [];
  const take = (pool: WeekVerse[], key: string): boolean => {
    const free = pool.filter((v) => !picked.includes(v));
    if (free.length) picked.push(free[spread(key) % free.length]);
    return free.length > 0;
  };
  const keyOf = (it: (typeof items)[number], i: number) => it.key ?? `${it.book}-${i}`;
  const unmatched = items.filter((it, i) => !take(verses.filter((v) => v.book === it.book), keyOf(it, i)));
  for (const it of [...unmatched, ...items.filter((it) => !unmatched.includes(it))]) {
    take(verses.filter((v) => v.group === it.group), `${keyOf(it, items.indexOf(it))}-gruppe`);
  }
  for (const id of CORE) take(verses.filter((v) => v.id === id), id);
  return picked.slice(0, max);
}
