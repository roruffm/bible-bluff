// Raumcodes wie LAMPE7: ein biblisches Alltagswort plus Ziffer – leicht vorzulesen und zu tippen.
// Englische Räume bekommen englische Wörter (LAMP7), damit man den Code auch dort gut vorlesen kann.

import type { Lang } from '../shared/types';

const WORDS = [
  'LAMPE', 'BROT', 'FISCH', 'KRUG', 'SALZ', 'STERN', 'HIRTE', 'TAUBE', 'ZELT', 'MANTEL',
  'ANKER', 'BOOT', 'NETZ', 'FEIGE', 'OLIVE', 'SCHAF', 'LAMM', 'PALME', 'QUELLE', 'HARFE',
  'KRONE', 'FACKEL', 'TAFEL', 'ROLLE', 'SIEGEL', 'HONIG', 'ZEDER', 'PERLE', 'BERG', 'KORB',
  'RING', 'ESEL', 'KAMEL', 'ADLER', 'GARTEN', 'ACKER', 'SAAT', 'ERNTE', 'MEHL', 'TINTE',
  'FEDER', 'BRIEF', 'SEGEL', 'HAFEN', 'INSEL', 'WOLKE', 'REGEN', 'LICHT', 'FEUER', 'WEIN',
];

const EN_WORDS = [
  'LAMP', 'BREAD', 'FISH', 'JAR', 'SALT', 'STAR', 'DOVE', 'TENT', 'CLOAK', 'ANCHOR',
  'BOAT', 'NET', 'FIG', 'OLIVE', 'SHEEP', 'LAMB', 'PALM', 'WELL', 'HARP', 'CROWN',
  'TORCH', 'SCROLL', 'SEAL', 'HONEY', 'CEDAR', 'PEARL', 'HILL', 'BASKET', 'RING', 'DONKEY',
  'CAMEL', 'EAGLE', 'GARDEN', 'FIELD', 'SEED', 'FLOUR', 'INK', 'QUILL', 'LETTER', 'SAIL',
  'HARBOUR', 'ISLAND', 'CLOUD', 'RAIN', 'LIGHT', 'FIRE', 'WINE', 'STONE', 'RIVER', 'TOWER',
];

export function randomCode(rng: () => number, digits = 1, lang: Lang = 'de'): string {
  const words = lang === 'en' ? EN_WORDS : WORDS;
  const word = words[Math.floor(rng() * words.length)];
  let num = '';
  for (let i = 0; i < digits; i++) num += String(2 + Math.floor(rng() * 8)); // 2–9, keine 0/1-Verwechslung
  return word + num;
}
