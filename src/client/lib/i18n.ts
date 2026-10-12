// Sprache der App: Auf der Startseite wählt man sie per Flagge (gemerkt auf diesem Gerät). In einem Raum,
// auf der Leinwand und auf einer Entdeckungen-Seite gilt die Sprache der Partie – so sehen alle dieselben
// Texte wie die Fragen. Links mit ?lang=en (etwa Einladungen in englische Räume) stellen die Sprache um.

import { type ComponentChildren, Fragment, h } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { DEFAULT_LANG, LANG_PARAM, isLang, translate } from '../../shared/i18n';
import type { Lang } from '../../shared/types';

const KEY = 'bible-bluff:v1:lang';

let preferred: Lang = DEFAULT_LANG;
/** Sprache der Partie, solange ein Raum oder eine Entdeckungen-Seite offen ist */
let partyLang: Lang | null = null;
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function currentLang(): Lang {
  return partyLang ?? preferred;
}

/** Die vom Gerät gewählte Sprache – sie gilt für neue Räume */
export function preferredLang(): Lang {
  return preferred;
}

/** Übersetzt einen deutschen Text in die aktuelle Sprache; {platzhalter} werden ersetzt */
export function t(text: string, params?: Record<string, string | number>): string {
  return translate(currentLang(), text, params);
}

/** Wie t(), nur dürfen Platzhalter Elemente sein – etwa ein fett gesetzter Raumcode: { code: <b>…</b> } */
export function tj(text: string, parts: Record<string, ComponentChildren>): ComponentChildren {
  const out = translate(currentLang(), text);
  const children: ComponentChildren[] = [];
  let last = 0;
  for (const m of out.matchAll(/\{(\w+)\}/g)) {
    const at = m.index ?? 0;
    if (at > last) children.push(out.slice(last, at));
    children.push(m[1] in parts ? parts[m[1]] : m[0]);
    last = at + m[0].length;
  }
  if (last < out.length) children.push(out.slice(last));
  return h(Fragment, null, ...children);
}

/** Sprachabhängige Formate: Datum, Zahlen, Sortierung */
export function locale(): string {
  return currentLang() === 'en' ? 'en-GB' : 'de-DE';
}

function apply() {
  document.documentElement.lang = currentLang();
  listeners.forEach((fn) => fn());
}

export function setPreferredLang(lang: Lang) {
  preferred = lang;
  try {
    storage()?.setItem(KEY, lang);
  } catch {
    /* privater Modus – dann gilt die Wahl bis zum Neuladen */
  }
  apply();
}

/** Im Raum: die Sprache der Partie anzeigen (null = wieder die des Geräts) */
export function setPartyLang(lang: Lang | null) {
  if (partyLang === lang) return;
  partyLang = lang;
  apply();
}

/**
 * Beim Start: ?lang=en aus dem Link gewinnt (und wird gemerkt), sonst die gespeicherte Wahl. Der Zusatz
 * verschwindet danach aus der Adresse – sonst stellte Neuladen eine spätere Wahl per Flagge wieder zurück.
 */
export function initLang() {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get(LANG_PARAM);
  if (fromUrl !== null) {
    url.searchParams.delete(LANG_PARAM);
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
  if (isLang(fromUrl)) {
    setPreferredLang(fromUrl);
    return;
  }
  try {
    const stored = storage()?.getItem(KEY);
    if (isLang(stored)) preferred = stored;
  } catch {
    /* ohne Speicher: Deutsch */
  }
  apply();
}

/** Für die oberste Komponente: zeichnet die App neu, sobald sich die Sprache ändert */
export function useLang(): Lang {
  const [, setTick] = useState(0);
  useEffect(() => {
    const update = () => setTick((n) => n + 1);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return currentLang();
}

/**
 * Für Raum, Leinwand und Entdeckungen-Seite: Solange die Seite offen ist, gilt die Sprache der Partie.
 * Vor dem Zeichnen umgestellt, damit nichts kurz in der anderen Sprache aufblitzt.
 */
export function usePartyLang(lang: Lang | null | undefined) {
  useLayoutEffect(() => {
    if (lang) setPartyLang(lang);
  }, [lang]);
  useLayoutEffect(() => () => setPartyLang(null), []);
}

/** Link-Anhang für Seiten in der Sprache der Partie: '' auf Deutsch, '?lang=en' auf Englisch */
export function langQuery(lang: Lang = currentLang()): string {
  return lang === DEFAULT_LANG ? '' : `?${LANG_PARAM}=${lang}`;
}
