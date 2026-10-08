// Farbkonzepte: Jede Person wählt ihres selbst; die Wahl gilt nur auf diesem Gerät.
// Die Farben stehen in styles.css (html[data-theme]); hier stehen Namen, Vorschaufarben und die Umschaltung.
import { useEffect, useState } from 'preact/hooks';

export const THEME_IDS = ['lernblatt', 'nacht', 'spieltisch', 'comic', 'see', 'klar'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = 'lernblatt';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  text: string;
  /** Vorschau: Leiste, Papier, zwei Akzente */
  preview: [string, string, string, string];
  /** Farbe der Browserleiste (meta theme-color) */
  bar: string;
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'lernblatt',
    name: 'Lernblatt',
    text: 'Warmes Papier, Dunkelbraun und Gold. Hell oder dunkel wie dein Gerät.',
    preview: ['#3d2e26', '#efe7dc', '#f2d9a0', '#b2492c'],
    bar: '#3d2e26',
  },
  {
    id: 'nacht',
    name: 'Nachtquiz',
    text: 'Dunkel mit Neonfarben wie in einer Quizshow. Stark auf dem Beamer.',
    preview: ['#0b0520', '#140a33', '#ff3ea5', '#29e3ef'],
    bar: '#0b0520',
  },
  {
    id: 'spieltisch',
    name: 'Spieltisch',
    text: 'Filzgrün, Kartenrot und Chipgold auf hellem Leinen.',
    preview: ['#1b5e40', '#ebe5d3', '#f1c24b', '#c8322b'],
    bar: '#1b5e40',
  },
  {
    id: 'comic',
    name: 'Comic',
    text: 'Sonnengelb, Schwarz und Pink mit harten Schatten.',
    preview: ['#161616', '#ffd93d', '#ff4f9a', '#3d7bff'],
    bar: '#161616',
  },
  {
    id: 'see',
    name: 'See Genezareth',
    text: 'Tiefes Blau, Türkis und Sand. Frisch und ruhig.',
    preview: ['#12324a', '#e8f0f3', '#f2c879', '#12857a'],
    bar: '#12324a',
  },
  {
    id: 'klar',
    name: 'Klar',
    text: 'Viel Weiß, Indigo und Koralle. Schlicht und gut lesbar.',
    preview: ['#4338ca', '#f4f5fa', '#ffd166', '#ef4f3c'],
    bar: '#4338ca',
  },
];

const KEY = 'bible-bluff:v1:theme';
/** Leinwand-Links tragen die Wahl der Spielleitung mit: /tv/CODE?farbe=nacht */
export const THEME_PARAM = 'farbe';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function themeInfo(id: ThemeId): ThemeInfo {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function storedTheme(): ThemeId {
  try {
    const value = storage()?.getItem(KEY);
    return isThemeId(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

let current: ThemeId = DEFAULT_THEME;
const listeners = new Set<(id: ThemeId) => void>();

function apply(id: ThemeId) {
  current = id;
  const root = document.documentElement;
  if (id === DEFAULT_THEME) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', id);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeInfo(id).bar);
}

export function setTheme(id: ThemeId) {
  try {
    storage()?.setItem(KEY, id);
  } catch {
    /* privater Modus – dann gilt die Wahl nur bis zum Neuladen */
  }
  apply(id);
  listeners.forEach((fn) => fn(id));
}

/** Beim Start: ?farbe=… aus dem Link gewinnt (und wird gemerkt), sonst die gespeicherte Wahl. */
export function initTheme() {
  const fromUrl = new URLSearchParams(window.location.search).get(THEME_PARAM);
  if (isThemeId(fromUrl)) setTheme(fromUrl);
  else apply(storedTheme());
}

export function currentTheme(): ThemeId {
  return current;
}

export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setLocal] = useState(current);
  useEffect(() => {
    listeners.add(setLocal);
    setLocal(current);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);
  return [theme, setTheme];
}
