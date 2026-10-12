// Link-Vorschau für Einladungen: Wer einen Raumlink (/r/CODE) in WhatsApp & Co. teilt, soll
// „Du bist eingeladen – Raum CODE“ sehen statt der allgemeinen Vorschau von biblebluff.de.
// Die Seite bleibt dieselbe App; ausgetauscht werden nur Titel, Text und Bild der Vorschau
// (Open-Graph-Angaben in index.html). Das Bild entsteht mit scripts/render-og.mjs.

import { normalizeCode } from '../shared/rules';
import type { Lang } from '../shared/types';

/** Die Adresse, auf die das Vorschaubild in index.html zeigt */
export const HOME = 'https://biblebluff.de';

const INVITE_TEXT =
  'Spiel mit bei Bible Bluff: Alle erfinden Antworten auf eine Bibelfrage – wer findet die echte? Antippen und mitspielen, ohne Anmeldung.';
const INVITE_TEXT_EN =
  'Play Bible Bluff with us: everyone makes up answers to a Bible question – who can spot the real one? Tap to join, no sign-up needed.';

/** Englische Startseite (/?lang=en): eigene Texte und eigenes Vorschaubild */
const HOME_EN = {
  title: 'Bible Bluff – the Bible party game for your phone',
  description:
    'Everyone makes up answers to real Bible questions – who can find the true one? Free, with no sign-up, for youth groups, small groups and families.',
  alt: 'Bible Bluff: Make up bluffs. Find the truth. Discover the Bible.',
};

/** Englische Seiten: Sprache und Ländereinstellung der Vorschau */
function english(html: string): string {
  return setMeta(html.replace('<html lang="de">', '<html lang="en">'), 'property', 'og:locale', 'en_GB');
}

/** Raumcode aus einem Einladungslink wie /r/lampe7 – null für alle anderen Pfade */
export function inviteCode(pathname: string): string | null {
  const match = /^\/r\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  try {
    return normalizeCode(decodeURIComponent(match[1])) || null;
  } catch {
    return null; // kaputte Prozent-Kodierung
  }
}

/** Die App-Seite mit der Vorschau einer Einladung in den Raum `code` – auf Englisch bei Links mit ?lang=en */
export function invitePreview(html: string, code: string, origin: string, lang: Lang = 'de'): string {
  const en = lang === 'en';
  const text = en ? INVITE_TEXT_EN : INVITE_TEXT;
  const values: [attr: 'property' | 'name', key: string, value: string][] = [
    ['property', 'og:title', en ? `You’re invited – room ${code}` : `Du bist eingeladen – Raum ${code}`],
    ['property', 'og:description', text],
    ['property', 'og:image', `${origin}/${en ? 'og-invite-en.jpg' : 'og-invite.jpg'}`],
    ['property', 'og:image:alt', en ? 'You’re invited! Bible Bluff – tap to join' : 'Du bist eingeladen! Bible Bluff – antippen und mitspielen'],
    ['name', 'description', text],
  ];
  const out = values.reduce((html2, [attr, key, value]) => setMeta(html2, attr, key, value), html);
  return en ? english(out) : out;
}

/**
 * Die Startseite unter einer anderen Adresse (Vorschau je Pull-Request, workers.dev): Das Vorschaubild
 * kommt dann von derselben Adresse wie die Seite. Sonst zeigte es auf biblebluff.de, wo ein neues Bild
 * erst nach dem Veröffentlichen liegt – Messenger fielen dann auf ein gespeichertes App-Symbol zurück.
 */
export function homePreview(html: string, origin: string, lang: Lang = 'de'): string {
  if (lang === 'en') {
    const values: [attr: 'property' | 'name', key: string, value: string][] = [
      ['property', 'og:title', HOME_EN.title],
      ['property', 'og:description', HOME_EN.description],
      ['property', 'og:image', `${origin}/og-en.jpg`],
      ['property', 'og:image:alt', HOME_EN.alt],
      ['name', 'description', HOME_EN.description],
    ];
    return english(values.reduce((out, [attr, key, value]) => setMeta(out, attr, key, value), html));
  }
  const image = /<meta property="og:image" content="([^"]*)"/.exec(html)?.[1];
  if (!image?.startsWith(`${HOME}/`)) return html;
  return setMeta(html, 'property', 'og:image', origin + image.slice(HOME.length));
}

/** Sprache eines Links: ?lang=en für die englische Fassung, sonst Deutsch */
export function linkLang(url: URL): Lang {
  return url.searchParams.get('lang') === 'en' ? 'en' : 'de';
}

function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  return html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), (_, head, tail) => head + escapeAttr(value) + tail);
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
