// Textvergleich für Bluffs: Normalisieren, Duplikate erkennen,
// versehentlich richtige Antworten abfangen.

const STOPWORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'und', 'oder', 'sowie', 'mit', 'von', 'vom', 'zu', 'zum', 'zur',
  'im', 'in', 'am', 'an', 'auf', 'aus', 'fuer', 'bei', 'beim', 'als', 'nach',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres',
  'es', 'er', 'sie', 'man', 'sich', 'so', 'ganz', 'etwas', 'noch', 'auch',
  'the', 'a', 'an', 'of',
]);

const NUMBER_WORDS: Record<string, string> = {
  null: '0', eins: '1', zwei: '2', drei: '3', vier: '4', fuenf: '5', sechs: '6', sieben: '7',
  acht: '8', neun: '9', zehn: '10', elf: '11', zwoelf: '12', dreizehn: '13', vierzehn: '14',
  fuenfzehn: '15', sechzehn: '16', siebzehn: '17', achtzehn: '18', neunzehn: '19', zwanzig: '20',
  dreissig: '30', vierzig: '40', fuenfzig: '50', sechzig: '60', siebzig: '70', achtzig: '80',
  neunzig: '90', hundert: '100', einhundert: '100', tausend: '1000', eintausend: '1000',
};

/** Zahlwort oder Ziffer → Ziffernfolge, sonst null. "dreimal" → "3". */
function numberValue(token: string): string | null {
  if (/^\d+$/.test(token)) return String(Number(token));
  const base = token.endsWith('mal') && token.length > 3 ? token.slice(0, -3) : token;
  if (/^\d+$/.test(base)) return String(Number(base));
  return NUMBER_WORDS[base] ?? null;
}

function numbersIn(input: string): string {
  return tokens(input)
    .map(numberValue)
    .filter((n): n is string => n !== null)
    .sort()
    .join(',');
}

/** Beide Texte nennen Zahlen, aber verschiedene → sicher nicht dieselbe Antwort. */
function differentNumbers(a: string, b: string): boolean {
  const na = numbersIn(a);
  const nb = numbersIn(b);
  return na !== '' && nb !== '' && na !== nb;
}

/** Kleinbuchstaben, Umlaute ausgeschrieben, Satzzeichen entfernt. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokens(input: string): string[] {
  const n = normalize(input);
  return n ? n.split(' ') : [];
}

/** Reihenfolge-unabhängige Kurzform ohne Füllwörter. */
export function canonical(input: string): string {
  const t = tokens(input)
    .filter((w) => !STOPWORDS.has(w))
    .map((w) => numberValue(w) ?? w);
  return [...new Set(t)].sort().join(' ');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array<number>(b.length + 1);
  let cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

/** 1 = identisch, 0 = völlig verschieden */
export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

/**
 * Schlüsselwort-Gruppen: Eine Gruppe trifft zu, wenn alle ihre Wörter vorkommen.
 *  "wort"  → ein Token beginnt mit "wort"
 *  "*wort" → ein Token enthält "wort"
 *  "=wort" → ein Token ist genau "wort"
 */
export function matchesKeywordGroups(input: string, groups: string[][]): boolean {
  const toks = tokens(input);
  if (!toks.length) return false;
  return groups.some((group) => group.length > 0 && group.every((kw) => keywordHit(toks, kw)));
}

function keywordHit(toks: string[], keyword: string): boolean {
  if (keyword.startsWith('=')) {
    const k = keyword.slice(1);
    return toks.includes(k);
  }
  if (keyword.startsWith('*')) {
    const k = keyword.slice(1);
    return toks.some((t) => t.includes(k));
  }
  return toks.some((t) => t.startsWith(keyword));
}

export interface TruthSpec {
  answer: string;
  variants?: string[];
  accept: string[][];
}

/** Liegt der Bluff zu nah an der richtigen Antwort (oder ist er ebenfalls wahr)? */
export function isTooCloseToTruth(input: string, q: TruthSpec): boolean {
  const n = normalize(input);
  if (!n) return false;
  const canon = canonical(input);
  for (const form of [q.answer, ...(q.variants ?? [])]) {
    if (canon && canon === canonical(form)) return true;
    if (!differentNumbers(input, form) && similarity(n, normalize(form)) >= 0.8) return true;
  }
  return matchesKeywordGroups(input, q.accept);
}

/** Sind zwei Bluffs praktisch dieselbe Antwort? */
export function isDuplicate(a: string, b: string): boolean {
  const ca = canonical(a);
  const cb = canonical(b);
  if (ca && ca === cb) return true;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (differentNumbers(a, b)) return false;
  if (Math.min(na.length, nb.length) < 6) return false;
  return similarity(na, nb) >= 0.86;
}
