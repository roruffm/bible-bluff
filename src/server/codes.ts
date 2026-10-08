// Raumcodes wie LAMPE7: ein biblisches Alltagswort plus Ziffer – leicht vorzulesen und zu tippen.

const WORDS = [
  'LAMPE', 'BROT', 'FISCH', 'KRUG', 'SALZ', 'STERN', 'HIRTE', 'TAUBE', 'ZELT', 'MANTEL',
  'ANKER', 'BOOT', 'NETZ', 'FEIGE', 'OLIVE', 'SCHAF', 'LAMM', 'PALME', 'QUELLE', 'HARFE',
  'KRONE', 'FACKEL', 'TAFEL', 'ROLLE', 'SIEGEL', 'HONIG', 'ZEDER', 'PERLE', 'BERG', 'KORB',
  'RING', 'ESEL', 'KAMEL', 'ADLER', 'GARTEN', 'ACKER', 'SAAT', 'ERNTE', 'MEHL', 'TINTE',
  'FEDER', 'BRIEF', 'SEGEL', 'HAFEN', 'INSEL', 'WOLKE', 'REGEN', 'LICHT', 'FEUER', 'WEIN',
];

export function randomCode(rng: () => number, digits = 1): string {
  const word = WORDS[Math.floor(rng() * WORDS.length)];
  let num = '';
  for (let i = 0; i < digits; i++) num += String(2 + Math.floor(rng() * 8)); // 2–9, keine 0/1-Verwechslung
  return word + num;
}
