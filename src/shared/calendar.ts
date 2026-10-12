// Kalender-Erinnerungen zu „Mein Vers für die Woche“: sieben Termine ab dem gewählten Tag zur gewählten
// Uhrzeit, jeweils mit dem Vers und einem Gedanken für den Tag. Die Zeiten stehen ohne Zeitzone in der
// Datei („floating“): Der Kalender erinnert um 7:30 Uhr dort, wo das Handy gerade ist. Gleiche Termine
// tragen beim erneuten Hinzufügen dieselbe UID und verdoppeln sich so nicht.

import { translate } from './i18n';
import type { Lang } from './types';
import { VERSE_IMPULSES, type WeekVerse, verseSource } from './verses';

export const REMINDER_TIMES = [
  { value: '0730', label: 'Morgens · 7:30' },
  { value: '1230', label: 'Mittags · 12:30' },
  { value: '2000', label: 'Abends · 20:00' },
] as const;
export type ReminderTime = (typeof REMINDER_TIMES)[number]['value'];

export function isReminderTime(value: string): value is ReminderTime {
  return REMINDER_TIMES.some((t) => t.value === value);
}

/** Kalendertag als JJJJMMTT – nur echte Tage zwischen 2020 und 2100 */
export function isCalendarDay(value: string): boolean {
  if (!/^\d{8}$/.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(4, 6));
  const d = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 2020 && y <= 2100 && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function addDays(day: string, days: number): string {
  const date = new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(4, 6)) - 1, Number(day.slice(6, 8)) + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** Text für Kalenderfelder: Backslash, Semikolon, Komma und Zeilenumbruch maskieren */
function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Zeilen auf höchstens 75 Byte falten; Folgezeilen beginnen mit einem Leerzeichen */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** Vers in Anführungszeichen der jeweiligen Sprache */
export function quoted(text: string, lang: Lang): string {
  return lang === 'en' ? `“${text}”` : `„${text}“`;
}

/** Kalenderdatei (iCalendar) mit sieben Erinnerungen an den Vers, ab `startDay` (JJJJMMTT) */
export function verseCalendar(verse: WeekVerse, startDay: string, time: ReminderTime, stamp: Date, lang: Lang = 'de'): string {
  const hour = time.slice(0, 2);
  const minute = Number(time.slice(2));
  const pad = (n: number) => String(n).padStart(2, '0');
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    lang === 'en' ? 'PRODID:-//Bible Bluff//My verse for the week//EN' : 'PRODID:-//Bible Bluff//Mein Vers fuer die Woche//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  VERSE_IMPULSES.forEach((impulse, i) => {
    const day = addDays(startDay, i);
    lines.push(
      'BEGIN:VEVENT',
      `UID:vers-${verse.id}-${startDay}-${time}-${i + 1}@biblebluff.de`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${day}T${hour}${pad(minute)}00`,
      `DTEND:${day}T${hour}${pad(minute + 10)}00`,
      `SUMMARY:${escapeText(translate(lang, 'Mein Vers: {ref}', { ref: verse.ref }))}`,
      `DESCRIPTION:${escapeText(
        `${quoted(verse.text, lang)}\n${verse.ref} (${verseSource(lang)})\n\n${translate(lang, 'Tag {n}: {impulse}', { n: i + 1, impulse: translate(lang, impulse) })}\n\nbiblebluff.de`,
      )}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`${verse.ref}: ${verse.text}`)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
