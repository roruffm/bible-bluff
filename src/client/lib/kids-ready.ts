import { useEffect, useState } from 'preact/hooks';
import { PROFESSOR_VOICE_KEYS, professorVoiceUrl } from '../../shared/professor-voice';
import { preloadProfessorVoices } from './kids-sound';
import { KIDS_INTRO_URL } from '../../shared/kids-intro';

/** Muss zum Namen in public/kids-sw.js passen. */
export const KIDS_OFFLINE_CACHE = 'bb-kids-show';
export type KidsOfflineState = 'idle' | 'preparing' | 'ready' | 'unsupported' | 'failed';
export interface KidsReadiness {
  voices: { loaded: number; total: number; done: boolean };
  offline: KidsOfflineState;
  internet: 'unknown' | 'checking' | 'online' | 'offline';
}

let state: KidsReadiness = { voices: { loaded: 0, total: PROFESSOR_VOICE_KEYS.length, done: false }, offline: 'idle', internet: 'unknown' };
const listeners = new Set<(next: KidsReadiness) => void>();
function update(patch: Partial<KidsReadiness>) { state = { ...state, ...patch }; for (const listener of listeners) listener(state); }

export function useKidsReadiness(): KidsReadiness {
  const [current, setCurrent] = useState(state);
  useEffect(() => { listeners.add(setCurrent); setCurrent(state); return () => { listeners.delete(setCurrent); }; }, []);
  return current;
}

let voices: Promise<void> | null = null;
let offline: Promise<void> | null = null;
/** Lädt alle Professor-Aufnahmen und legt die Offline-Kopie an. Mehrfache Aufrufe laden nichts doppelt, nur Fehlendes erneut. */
export function prepareKidsShow(): void {
  voices ??= preloadProfessorVoices((loaded, total) => update({ voices: { loaded, total, done: false } })).then((loaded) => {
    update({ voices: { loaded, total: PROFESSOR_VOICE_KEYS.length, done: true } });
    if (loaded < PROFESSOR_VOICE_KEYS.length) voices = null;
  });
  offline ??= copyShowForOffline().then((result) => { update({ offline: result }); if (result === 'failed') offline = null; });
}

const within = <T,>(promise: Promise<T>, ms: number, fallback: T) => Promise.race([promise, new Promise<T>((resolve) => setTimeout(resolve, ms, fallback))]);
/** Seite, Skripte, Schriften und Aufnahmen für ein Neuladen ohne Internet. Ohne sicheren Kontext (z. B. WLAN-Server über http) gibt es keine Kopie. */
async function copyShowForOffline(): Promise<KidsOfflineState> {
  if (!import.meta.env.PROD || !isSecureContext || !('serviceWorker' in navigator) || typeof caches === 'undefined') return 'unsupported';
  update({ offline: 'preparing' });
  // Erst ein aktiver Helfer kann beim Neuladen ohne Netz einspringen; manche Browser melden an, starten ihn aber nie.
  const registered = within(navigator.serviceWorker.register('/kids-sw.js', { scope: '/kids' }).then(() => navigator.serviceWorker.ready).then(() => true, () => false), 10_000, false);
  const copied = copyShow().then(() => true, () => false);
  return (await registered) && (await copied) ? 'ready' : 'failed';
}

/** Die Kopie folgt der frisch geladenen Seite, nicht der laufenden: Wurde inzwischen eine neue Fassung
 * veröffentlicht, passen Seite, Skripte und Schriften trotzdem zusammen. */
async function copyShow() {
  const page = await fetch('/kids', { cache: 'no-store' });
  if (!page.ok) throw new Error('Seite nicht erreichbar');
  const html = new DOMParser().parseFromString(await page.clone().text(), 'text/html');
  const assets = new Set<string>();
  const add = (href: string | null, base: string) => {
    const url = href ? new URL(href, base) : null;
    if (url && url.origin === location.origin && url.pathname.startsWith('/assets/')) assets.add(url.pathname);
  };
  for (const element of html.querySelectorAll('script[src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]')) add(element.getAttribute('src') ?? element.getAttribute('href'), page.url);
  // Alle Schriftschnitte, auch die erst am Endbildschirm gebrauchten. woff2 genügt jedem Browser mit Offline-Kopie.
  for (const sheet of [...assets].filter((path) => path.endsWith('.css'))) {
    const css = await fetch(sheet).then((response) => response.ok ? response.text() : '');
    for (const [, href] of css.matchAll(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/g)) add(href, new URL(sheet, location.origin).href);
  }
  const cache = await caches.open(KIDS_OFFLINE_CACHE);
  const files = [...assets, KIDS_INTRO_URL, ...PROFESSOR_VOICE_KEYS.map(professorVoiceUrl)];
  await cache.addAll(files);
  await cache.put('/kids', page);
  // Alte Fassungen früherer Veröffentlichungen fliegen raus.
  const keep = new Set(['/kids', ...files].map((path) => new URL(path, location.origin).href));
  await Promise.all((await cache.keys()).filter((request) => !keep.has(request.url)).map((request) => cache.delete(request)));
}

/** Die Smartphone-Fernbedienung braucht den Server, die Show selbst nicht. */
export async function checkKidsInternet(): Promise<void> {
  update({ internet: 'checking' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch('/api/health', { cache: 'no-store', signal: controller.signal });
    update({ internet: response.ok ? 'online' : 'offline' });
  } catch { update({ internet: 'offline' }); } finally { clearTimeout(timer); }
}
