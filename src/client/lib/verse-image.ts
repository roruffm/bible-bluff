// Sperrbildschirm-Bild zu „Mein Vers für die Woche“ – entsteht ganz auf dem Handy (Canvas), nichts geht
// an den Server. Format etwa wie ein heutiges Handy (9 : 19,5). Der Hintergrund ist jedes Mal ein anderes
// abstraktes Motiv (lib/wallpaper.ts); der Vers steht auf Milchglas unterhalb der Uhrzeit, die die
// Bildschirmsperre oben anzeigt, und über den Knöpfen am unteren Rand.

import { quoted } from '../../shared/calendar';
import { translate } from '../../shared/i18n';
import type { Lang } from '../../shared/types';
import { type WeekVerse, verseSource } from '../../shared/verses';
import { designFor, frostedPanel, paintBackground, textColors } from './wallpaper';

const W = 1170;
const H = 2532;
const FONT = 'Figtree, system-ui, sans-serif';

/** Zeilenumbruch nach Wörtern für die gegebene Breite */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Sperrabstand für die kleine Überschrift, wo der Browser ihn kennt */
function spacing(ctx: CanvasRenderingContext2D, value: string) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in c) c.letterSpacing = value;
}

export interface VerseImage {
  /** zum Anzeigen (data:-Adresse, erlaubt die Seite) */
  url: string;
  /** zum Teilen oder Speichern */
  file: File;
}

/** Das Bild zum Vers – `seed` bestimmt das Motiv, dieselbe Zahl ergibt dasselbe Bild */
export async function verseImage(verse: WeekVerse, lang: Lang, seed: number): Promise<VerseImage> {
  try {
    await Promise.all([document.fonts.load(`600 80px ${FONT}`), document.fonts.load(`800 40px ${FONT}`)]);
  } catch {
    /* Ersatzschrift genügt */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const design = designFor(seed);
  paintBackground(ctx, W, H, design);
  const colors = textColors(design.palette);

  // Vers so groß wie möglich, aber höchstens 36 % der Höhe
  const panelW = W - 2 * 80;
  const pad = 76;
  const textW = panelW - 2 * pad;
  let size = 84;
  let lines: string[] = [];
  for (; size >= 44; size -= 4) {
    ctx.font = `600 ${size}px ${FONT}`;
    lines = wrap(ctx, quoted(verse.text, lang), textW);
    if (lines.length * size * 1.32 <= H * 0.36) break;
  }
  const lineHeight = size * 1.32;
  const panelH = pad + 30 + 56 + lines.length * lineHeight + 30 + 6 + 72 + 16 + 46 + pad - 8;
  const x = (W - panelW) / 2;
  const top = Math.round(H * 0.58 - panelH / 2);
  frostedPanel(ctx, canvas, x, top, panelW, panelH, design.palette.tone);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = top + pad + 30;
  ctx.fillStyle = colors.accent;
  ctx.font = `800 30px ${FONT}`;
  spacing(ctx, '5px');
  ctx.fillText(translate(lang, 'MEIN VERS FÜR DIE WOCHE'), W / 2, y);
  spacing(ctx, '0px');

  y += 56;
  ctx.fillStyle = colors.text;
  ctx.font = `600 ${size}px ${FONT}`;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * lineHeight + size * 0.9));
  y += lines.length * lineHeight + 30;

  ctx.fillStyle = colors.accent;
  ctx.fillRect(W / 2 - 44, y, 88, 6);
  y += 6 + 72;
  ctx.font = `800 50px ${FONT}`;
  ctx.fillText(verse.ref, W / 2, y);

  y += 16 + 46;
  ctx.fillStyle = colors.muted;
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText(`${verseSource(lang)} · biblebluff.de`, W / 2, y);

  const url = canvas.toDataURL('image/jpeg', 0.9);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kein Bild'))), 'image/jpeg', 0.9),
  );
  return { url, file: new File([blob], `${lang === 'en' ? 'verse' : 'vers'}-${verse.id}.jpg`, { type: 'image/jpeg' }) };
}

/** Morgen als JJJJMMTT nach der Uhr dieses Handys – ab dann erinnert der Kalender */
export function tomorrow(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
