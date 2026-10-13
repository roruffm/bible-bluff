import { translate } from '../../shared/i18n';
import type { AwardView, Lang } from '../../shared/types';

const FONT = 'Figtree, system-ui, sans-serif';

/** Auch lange Wörter umbrechen; Nutzereingaben werden ausschließlich als Text gezeichnet. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width) { line = next; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const char of word) {
      if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function fitted(ctx: CanvasRenderingContext2D, text: string, y: number, height: number, size: number, color: string) {
  let lines: string[] = [];
  for (; size >= 18; size -= 2) {
    ctx.font = `800 ${size}px ${FONT}`;
    lines = wrap(ctx, text, 800);
    if (lines.length * size * 1.25 <= height) break;
  }
  ctx.fillStyle = color;
  lines.forEach((line, i) => ctx.fillText(line, 540, y + i * size * 1.25));
}

export async function bluffStory(award: AwardView, lang: Lang, withNames = false): Promise<{ url: string; file: File }> {
  if (!award.story || !award.quote) throw new Error('Missing story');
  await document.fonts.ready;
  const logo = new Image();
  logo.src = '/logo.svg';
  await logo.decode();
  const style = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const dark = color('--brown', '#12324a');
  const light = color('--cream', '#fbf3e4');
  const paper = color('--card', '#fffaf2');
  const ink = color('--ink', '#2b211c');
  const gold = color('--gold', '#f2c879');
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = dark; ctx.fillRect(0, 0, 1080, 1920);
  ctx.strokeStyle = gold; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(1000, 180, 230, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(40, 1770, 180, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.roundRect(224, 170, 632, 298, 40); ctx.fill();
  ctx.drawImage(logo, 264, 180, 552, 259);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  fitted(ctx, translate(lang, 'Bester Bluff des Abends'), 505, 120, 58, gold);
  ctx.fillStyle = paper; ctx.beginPath(); ctx.roundRect(64, 660, 952, 700, 42); ctx.fill();
  ctx.font = `800 28px ${FONT}`; ctx.fillStyle = ink;
  ctx.fillText(translate(lang, 'DIE FRAGE'), 540, 710);
  fitted(ctx, award.story.prompt, 768, 200, 48, ink);
  ctx.strokeStyle = gold; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(420, 994); ctx.lineTo(660, 994); ctx.stroke();
  ctx.font = `800 28px ${FONT}`; ctx.fillStyle = ink;
  ctx.fillText(translate(lang, 'DER BLUFF'), 540, 1034);
  fitted(ctx, translate(lang, '„{text}“', { text: award.quote }), 1090, 220, 68, ink);
  const n = award.story.fooled;
  const statistic = n === null
    ? award.value === 1 ? translate(lang, '♥ 1 Herz in einer Runde') : translate(lang, '♥ {n} Herzen in einer Runde', { n: award.value })
    : n === 0 ? translate(lang, 'Darauf ist niemand hereingefallen.')
    : n === 1 ? translate(lang, 'Darauf ist eine Person hereingefallen.')
    : translate(lang, 'Darauf sind {n} Personen hereingefallen.', { n });
  fitted(ctx, statistic, 1410, 160, 62, gold);
  if (withNames) fitted(ctx, translate(lang, 'Erfunden von {names}', { names: award.players.map((p) => p.name).join(' & ') }), 1600, 125, 30, light);
  ctx.fillStyle = light; ctx.font = `800 48px ${FONT}`;
  ctx.fillText('biblebluff.de', 540, 1780);
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(translate(lang, 'Bibelwissen hilft. Bluffen auch.'), 540, 1848);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Image unavailable')), 'image/png'));
  return { url: canvas.toDataURL('image/png'), file: new File([blob], 'bible-bluff-story.png', { type: 'image/png' }) };
}
