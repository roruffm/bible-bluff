// Zwei Sprachen: Deutsch (Standard) und britisches Englisch. Der deutsche Text ist zugleich der
// Schlüssel für die Übersetzung (src/shared/i18n-en.ts). Fehlt eine englische Fassung, bleibt der
// deutsche Text stehen – ein Test prüft, dass alle verwendeten Texte übersetzt sind.
// Platzhalter in geschweiften Klammern: translate('en', 'Runde {n}', { n: 2 }) → 'Round 2'.

import type { Lang } from './types';
import { EN } from './i18n-en';

export const LANGS: Lang[] = ['de', 'en'];
export const DEFAULT_LANG: Lang = 'de';
/** Link-Parameter für die Sprache: /?lang=en, Einladungen /r/CODE?lang=en */
export const LANG_PARAM = 'lang';

export function isLang(value: unknown): value is Lang {
  return value === 'de' || value === 'en';
}

export function translate(lang: Lang, text: string, params?: Record<string, string | number>): string {
  const out = lang === 'en' ? (EN[text] ?? text) : text;
  return params ? out.replace(/\{(\w+)\}/g, (all, key: string) => (key in params ? String(params[key]) : all)) : out;
}

/** Hat dieser deutsche Text eine englische Fassung? */
export function hasTranslation(text: string): boolean {
  return text in EN;
}
