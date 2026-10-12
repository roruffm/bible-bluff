// Sperrbildschirm-Bild zu „Mein Vers für die Woche“ – entsteht ganz auf dem Handy (Canvas), nichts geht
// an den Server. Format etwa wie ein heutiges Handy (9 : 19,5). Der Vers steht unterhalb der Uhrzeit,
// die Bildschirmsperre oben anzeigt, und über den Knöpfen am unteren Rand.

import { quoted } from '../../shared/calendar';
import { translate } from '../../shared/i18n';
import type { Lang } from '../../shared/types';
import { type WeekVerse, verseSource } from '../../shared/verses';

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

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export interface VerseImage {
  /** zum Anzeigen (data:-Adresse, erlaubt die Seite) */
  url: string;
  /** zum Teilen oder Speichern */
  file: File;
}

export async function verseImage(verse: WeekVerse, lang: Lang): Promise<VerseImage> {
  try {
    await Promise.all([document.fonts.load(`600 80px ${FONT}`), document.fonts.load(`800 40px ${FONT}`)]);
  } catch {
    /* Ersatzschrift genügt */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b4565');
  bg.addColorStop(1, '#0c2536');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, H * 0.4, 760, 'rgba(242, 200, 121, 0.17)');
  glow(ctx, W * 0.92, H * 0.97, 900, 'rgba(18, 133, 122, 0.30)');

  // Vers so groß wie möglich, aber höchstens 40 % der Höhe
  const width = W - 2 * 140;
  let size = 88;
  let lines: string[] = [];
  for (; size >= 48; size -= 4) {
    ctx.font = `600 ${size}px ${FONT}`;
    lines = wrap(ctx, quoted(verse.text, lang), width);
    if (lines.length * size * 1.34 <= H * 0.4) break;
  }
  const lineHeight = size * 1.34;
  const blockHeight = 110 + lines.length * lineHeight + 150;
  const top = H * 0.57 - blockHeight / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f2c879';
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText(translate(lang, 'MEIN VERS FÜR DIE WOCHE'), W / 2, top + 32);

  ctx.fillStyle = '#f6efe0';
  ctx.font = `600 ${size}px ${FONT}`;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, top + 110 + i * lineHeight + size * 0.9));

  const after = top + 110 + lines.length * lineHeight;
  ctx.fillStyle = '#f2c879';
  ctx.fillRect(W / 2 - 40, after + 40, 80, 5);
  ctx.font = `800 50px ${FONT}`;
  ctx.fillText(verse.ref, W / 2, after + 130);

  ctx.fillStyle = 'rgba(246, 239, 224, 0.45)';
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(`${verseSource(lang)} · biblebluff.de`, W / 2, H - 200);

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
