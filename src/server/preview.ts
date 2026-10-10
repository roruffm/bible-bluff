// Link-Vorschau für Einladungen: Wer einen Raumlink (/r/CODE) in WhatsApp & Co. teilt, soll
// „Du bist eingeladen – Raum CODE“ sehen statt der allgemeinen Vorschau von biblebluff.de.
// Die Seite bleibt dieselbe App; ausgetauscht werden nur Titel, Text und Bild der Vorschau
// (Open-Graph-Angaben in index.html). Das Bild entsteht mit scripts/render-og.mjs.

import { normalizeCode } from '../shared/rules';

/** Die Adresse, auf die das Vorschaubild in index.html zeigt */
export const HOME = 'https://biblebluff.de';

const INVITE_TEXT =
  'Spiel mit bei Bible Bluff: Alle erfinden Antworten auf eine Bibelfrage – wer findet die echte? Antippen und mitspielen, ohne Anmeldung.';

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

/** Die App-Seite mit der Vorschau einer Einladung in den Raum `code` */
export function invitePreview(html: string, code: string, origin: string): string {
  const values: [attr: 'property' | 'name', key: string, value: string][] = [
    ['property', 'og:title', `Du bist eingeladen – Raum ${code}`],
    ['property', 'og:description', INVITE_TEXT],
    ['property', 'og:image', `${origin}/og-invite.jpg`],
    ['property', 'og:image:alt', 'Du bist eingeladen! Bible Bluff – antippen und mitspielen'],
    ['name', 'description', INVITE_TEXT],
  ];
  return values.reduce((out, [attr, key, value]) => setMeta(out, attr, key, value), html);
}

/**
 * Die Startseite unter einer anderen Adresse (Vorschau je Pull-Request, workers.dev): Das Vorschaubild
 * kommt dann von derselben Adresse wie die Seite. Sonst zeigte es auf biblebluff.de, wo ein neues Bild
 * erst nach dem Veröffentlichen liegt – Messenger fielen dann auf ein gespeichertes App-Symbol zurück.
 */
export function homePreview(html: string, origin: string): string {
  const image = /<meta property="og:image" content="([^"]*)"/.exec(html)?.[1];
  if (!image?.startsWith(`${HOME}/`)) return html;
  return setMeta(html, 'property', 'og:image', origin + image.slice(HOME.length));
}

function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  return html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), (_, head, tail) => head + escapeAttr(value) + tail);
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
