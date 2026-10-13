import type { TopicPackId } from '../shared/types';
import type { Question } from './questions';

/** Bewusste Auswahl nach Inhalt, keine zufälligen Treffer auf Wörter in Bluffs. */
export const PACK_QUESTIONS: Record<Exclude<TopicPackId, 'neulinge'>, readonly string[]> = {
  kaum: ['mt-muenze', 'mt-kamele', 'mt-traum', 'mk-wasserkrug', 'lk-zachaeus', 'joh-speichel', 'joh-obergewand', 'joh-haare', 'apg-eutychus', 'apg-rhode', 'apg-tuecher', '2tim-mantel', 'hebr-engel', 'at-axt', 'at-wahnsinn', 'at-loewenhonig', 'at-ziegenfelle', 'at-wurm', 'lt-simson', 'lt-malta', 'lt-loewengrube', 'lt-petrus-wind', 'lt-jericho', 'lt-kana'],
  tiere: ['mt-schlangen', 'mt-muenze', 'mt-kamele', 'mk-kruemel', 'lk-verloren', 'lk-fischzug', 'joh-junge', '1kor-ochse', '2petr-eselin', 'at-raben', 'at-loewenhonig', 'at-wurm', 'lt-simson', 'lt-taube', 'lt-jona', 'lt-loewengrube', 'lt-senfkorn', 'lt-nadeloehr', 'lt-malta'],
  essen: ['mt-muenze', 'mk-wasserkrug', 'mk-kruemel', 'lk-emmaus', 'lk-fischzug', 'joh-junge', '1tim-wein', '2thess-essen', 'at-raben', 'at-loewenhonig', 'lt-brot-allein', 'lt-lebensbrot', 'lt-kana', 'lt-petrus-wind', 'lt-aussaetzige'],
};

export function inTopicPack(q: Question, id?: TopicPackId | null): boolean {
  if (!id) return true;
  if (id === 'neulinge') return q.difficulty === 1;
  return PACK_QUESTIONS[id].includes(q.id);
}
