// Abstrakte Hintergründe für das Sperrbildschirm-Bild zu „Mein Vers für die Woche“. Jedes Bild ist ein
// Zufallsmotiv aus einem von sechs Stilen und einer abgestimmten Farbpalette – mit derselben Zahl (seed)
// entsteht genau dasselbe Bild, darum zeigt die Vorschau, was gespeichert wird. Gemalt wird nur mit
// Verläufen, Pfaden und Mischmodi, die alle Handy-Browser kennen (kein ctx.filter).

export type Tone = 'dark' | 'light';

export interface Palette {
  name: string;
  /** Grundton und vier Akzente, vom dunkelsten zum hellsten gedacht */
  colors: [string, string, string, string, string];
  /** dunkle Paletten tragen helle Schrift auf getöntem Milchglas, helle Paletten dunkle */
  tone: Tone;
}

export const PALETTES: Palette[] = [
  { name: 'Abendrot', colors: ['#2b1055', '#5a2a82', '#c06c84', '#f67280', '#f8b195'], tone: 'dark' },
  { name: 'Polarlicht', colors: ['#0b0c2a', '#1b2a6b', '#7b5cff', '#ff5ca8', '#2de2a6'], tone: 'dark' },
  { name: 'Tiefsee', colors: ['#04151f', '#183a37', '#2a9d8f', '#8ab17d', '#e9c46a'], tone: 'dark' },
  { name: 'Glut', colors: ['#1a0b0b', '#5c1a1b', '#e85d04', '#faa307', '#ffd166'], tone: 'dark' },
  { name: 'Nachtblau', colors: ['#0d1b2a', '#1b263b', '#415a77', '#e0a458', '#cfe1f2'], tone: 'dark' },
  { name: 'Wald', colors: ['#0b2318', '#1d4b3a', '#3f7d58', '#a7c957', '#f2e8cf'], tone: 'dark' },
  { name: 'Pflaume', colors: ['#240b36', '#5b1a5b', '#c31432', '#f0a868', '#ffd6a5'], tone: 'dark' },
  { name: 'Ozean', colors: ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6'], tone: 'dark' },
  { name: 'Zuckerwatte', colors: ['#fbe7f0', '#ffd6e0', '#ffef9f', '#90f1ef', '#c1fba4'], tone: 'light' },
  { name: 'Morgenrot', colors: ['#fff1e6', '#ffcad4', '#f4acb7', '#f9c784', '#a2d2ff'], tone: 'light' },
  { name: 'Lavendel', colors: ['#f3e8ff', '#e0c3fc', '#c3b1e1', '#8ec5fc', '#b8f2e6'], tone: 'light' },
  { name: 'Zitrus', colors: ['#fffbe6', '#ffe066', '#f2c14e', '#f78154', '#7cc6a4'], tone: 'light' },
  { name: 'Himmel', colors: ['#eef6ff', '#bae6fd', '#7dd3fc', '#fbcfe8', '#fde68a'], tone: 'light' },
  { name: 'Salbei', colors: ['#f4f1de', '#e9edc9', '#ccd5ae', '#d4a373', '#81b29a'], tone: 'light' },
];

export const STYLES = ['aurora', 'wellen', 'glas', 'felder', 'kreise', 'strahlen'] as const;
export type Style = (typeof STYLES)[number];

export interface Design {
  seed: number;
  style: Style;
  palette: Palette;
}

/** Kleiner, schneller Zufallsgenerator mit Startwert (mulberry32) */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Stil und Palette eines Bildes – dieselbe Zahl ergibt immer dasselbe Motiv */
export function designFor(seed: number): Design {
  const rng = seededRandom(seed ^ 0x5bd1e995);
  return { seed, style: STYLES[Math.floor(rng() * STYLES.length)], palette: PALETTES[Math.floor(rng() * PALETTES.length)] };
}

// ───────── Farben ─────────

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgbCss([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** Relative Leuchtdichte nach WCAG */
export function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Tönung des Milchglases hinter dem Vers */
export const PANEL_TINT: Record<Tone, { rgb: RGB; alpha: number }> = {
  dark: { rgb: [10, 12, 26], alpha: 0.58 },
  light: { rgb: [255, 255, 255], alpha: 0.62 },
};

/** Farbe des Milchglases über einer Hintergrundfarbe */
export function panelOver(tone: Tone, background: RGB): RGB {
  const tint = PANEL_TINT[tone];
  return mixRgb(background, tint.rgb, tint.alpha);
}

/** Schwächster Kontrast einer Schriftfarbe auf dem Milchglas – über jeder Farbe der Palette */
export function worstContrast(color: RGB, palette: Palette): number {
  return Math.min(...palette.colors.map((c) => contrast(color, panelOver(palette.tone, hexToRgb(c)))));
}

/** Hellt (dunkle Paletten) bzw. dunkelt (helle Paletten) eine Farbe so weit nach, bis sie lesbar ist */
function readable(color: RGB, palette: Palette, min = 4.5): RGB {
  const target: RGB = palette.tone === 'dark' ? [255, 255, 255] : [0, 0, 0];
  let c = color;
  for (let i = 0; i < 20 && worstContrast(c, palette) < min; i++) c = mixRgb(c, target, 0.12);
  return c;
}

/** Schriftfarben: Vers, Akzent (Überschrift, Stelle) und leise Quellenangabe – auf jedem Motiv lesbar */
export function textColors(palette: Palette): { text: string; accent: string; muted: string } {
  const byLight = [...palette.colors].sort((a, b) => luminance(hexToRgb(b)) - luminance(hexToRgb(a)));
  if (palette.tone === 'dark') {
    // Akzent: die hellste Palettenfarbe
    return { text: '#fffaf2', accent: rgbCss(readable(hexToRgb(byLight[0]), palette)), muted: 'rgba(255, 250, 242, 0.66)' };
  }
  // Helle Paletten: die dunkelste Palettenfarbe, nachgedunkelt
  return { text: '#1d1b2c', accent: rgbCss(readable(hexToRgb(byLight[byLight.length - 1]), palette)), muted: 'rgba(29, 27, 44, 0.66)' };
}

// ───────── Malen ─────────

type Ctx = CanvasRenderingContext2D;

const pick = <T>(rng: () => number, list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const between = (rng: () => number, min: number, max: number) => min + rng() * (max - min);

function baseGradient(ctx: Ctx, w: number, h: number, rng: () => number, from: string, to: string) {
  const angle = between(rng, 0, Math.PI * 2);
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createLinearGradient(w / 2 - Math.cos(angle) * r, h / 2 - Math.sin(angle) * r, w / 2 + Math.cos(angle) * r, h / 2 + Math.sin(angle) * r);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Weicher Farbfleck: Ellipse mit radialem Verlauf ins Durchsichtige */
function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, angle: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.55, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Aurora: weiche, ineinanderfließende Farbflecken wie ein Polarlicht */
function aurora(ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) {
  const [c0, c1, ...accents] = p.colors;
  baseGradient(ctx, w, h, rng, c0, c1);
  ctx.globalCompositeOperation = p.tone === 'dark' ? 'screen' : 'source-over';
  const count = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const rx = between(rng, w * 0.45, w * 1.1);
    blob(ctx, between(rng, -0.15, 1.15) * w, between(rng, -0.05, 1.05) * h, rx, rx * between(rng, 0.6, 1.8), between(rng, 0, Math.PI), pick(rng, accents), between(rng, 0.55, 0.9));
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** Wellen: geschichtete, geschwungene Farbbänder von oben nach unten */
function wellen(ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) {
  const [c0, c1, ...accents] = p.colors;
  baseGradient(ctx, w, h, rng, c1, c0);
  const bands = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < bands; i++) {
    const y0 = h * (0.12 + (i / bands) * 0.8) + between(rng, -60, 60);
    const waves = [0, 1].map(() => ({ amp: between(rng, 40, 170), freq: between(rng, 0.6, 2.2), phase: between(rng, 0, Math.PI * 2) }));
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 10) {
      const y = y0 + waves.reduce((sum, wv) => sum + wv.amp * Math.sin((x / w) * Math.PI * 2 * wv.freq + wv.phase), 0);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y0 - 200, w, y0 + 400);
    g.addColorStop(0, rgba(pick(rng, accents), between(rng, 0.7, 0.95)));
    g.addColorStop(1, rgba(pick(rng, [c1, ...accents]), between(rng, 0.7, 0.95)));
    ctx.save();
    ctx.shadowColor = p.tone === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(60, 40, 80, 0.18)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = -12;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
}

/** Glasfenster: Mosaik aus Dreiecken mit Bleiruten, als fiele Licht hindurch */
function glas(ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) {
  const [c0, ...rest] = p.colors;
  ctx.fillStyle = c0;
  ctx.fillRect(0, 0, w, h);
  const cols = 7;
  const rows = 15;
  const cw = w / cols;
  const rh = h / rows;
  const pts: [number, number][][] = [];
  for (let r = 0; r <= rows; r++) {
    pts.push([]);
    for (let c = 0; c <= cols; c++) {
      const edgeX = c === 0 || c === cols;
      const edgeY = r === 0 || r === rows;
      pts[r].push([c * cw + (edgeX ? 0 : between(rng, -0.35, 0.35) * cw), r * rh + (edgeY ? 0 : between(rng, -0.35, 0.35) * rh)]);
    }
  }
  // Farbfeld: drei verschiedene Ankerfarben an zufälligen Stellen, dazwischen weich gemischt
  const shuffled = [...rest].sort(() => rng() - 0.5);
  const anchors = shuffled.slice(0, 3).map((color, i) => ({ x: rng() * w, y: ((i + rng()) / 3) * h, rgb: hexToRgb(color) }));
  const colorAt = (x: number, y: number): RGB => {
    let total = 0;
    let mix: RGB = [0, 0, 0];
    for (const a of anchors) {
      const weight = 1 / (Math.hypot(a.x - x, a.y - y) + 120) ** 2;
      total += weight;
      mix = [mix[0] + a.rgb[0] * weight, mix[1] + a.rgb[1] * weight, mix[2] + a.rgb[2] * weight];
    }
    return [mix[0] / total, mix[1] / total, mix[2] / total];
  };
  const lead = p.tone === 'dark' ? 'rgba(6, 6, 14, 0.85)' : 'rgba(255, 255, 255, 0.75)';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [a, b, d, e] = [pts[r][c], pts[r][c + 1], pts[r + 1][c], pts[r + 1][c + 1]];
      const tris = rng() < 0.5 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
      for (const tri of tris) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const shade = between(rng, -0.12, 0.12);
        const base = colorAt(cx, cy);
        const rgb = shade > 0 ? mixRgb(base, [255, 255, 255], shade) : mixRgb(base, [0, 0, 0], -shade);
        ctx.beginPath();
        ctx.moveTo(tri[0][0], tri[0][1]);
        ctx.lineTo(tri[1][0], tri[1][1]);
        ctx.lineTo(tri[2][0], tri[2][1]);
        ctx.closePath();
        ctx.fillStyle = rgbCss(rgb);
        ctx.fill();
        ctx.lineJoin = 'round';
        ctx.lineWidth = p.tone === 'dark' ? 7 : 5;
        ctx.strokeStyle = lead;
        ctx.stroke();
      }
    }
  }
  // Licht, das durch das Fenster fällt
  ctx.globalCompositeOperation = p.tone === 'dark' ? 'screen' : 'soft-light';
  blob(ctx, between(rng, 0.2, 0.8) * w, between(rng, 0.1, 0.4) * h, w * 0.9, w * 1.3, 0, '#ffffff', p.tone === 'dark' ? 0.22 : 0.5);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Weiche Fläche mit ausfransenden Rändern: Gemalt wird nur der Schatten einer Form weit außerhalb des
 * Bildes – so entsteht die Unschärfe ohne ctx.filter.
 */
function softRect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, blur: number, alpha: number) {
  const away = 20000;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = away;
  roundRect(ctx, x - away, y, w, h, Math.min(w, h) * 0.12);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Farbbänder: ruhige, weich ineinander übergehende Farbflächen über die ganze Breite, wie ein Abendhimmel */
function felder(ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) {
  const [c0, c1, ...accents] = p.colors;
  baseGradient(ctx, w, h, rng, c0, c1);
  const bands = 3 + Math.floor(rng() * 2);
  const heights = Array.from({ length: bands }, () => between(rng, 0.6, 1.4));
  const scale = (h * 1.1) / heights.reduce((a, b) => a + b, 0);
  let y = -h * 0.05;
  let last = '';
  for (const part of heights) {
    const bh = part * scale;
    const choices = accents.filter((c) => c !== last);
    const color = pick(rng, choices);
    last = color;
    softRect(ctx, -w * 0.2, y + bh * 0.08, w * 1.4, bh * 0.84, color, between(rng, 90, 160), between(rng, 0.8, 1));
    // Ein zweiter, kleinerer Schimmer in einer Nachbarfarbe gibt dem Band Tiefe
    softRect(ctx, between(rng, 0, 0.4) * w, y + bh * 0.3, w * between(rng, 0.5, 0.9), bh * 0.4, pick(rng, [c1, ...choices]), 160, between(rng, 0.35, 0.6));
    y += bh;
  }
}

/** Kreise: überlappende Scheiben, Ringe und Halbkreise mit Farbmischung */
function kreise(ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) {
  const [c0, c1, ...accents] = p.colors;
  baseGradient(ctx, w, h, rng, c0, c1);
  const count = 8 + Math.floor(rng() * 6);
  for (let i = 0; i < count; i++) {
    const x = between(rng, -0.1, 1.1) * w;
    const y = between(rng, -0.05, 1.05) * h;
    const r = between(rng, 120, 640);
    const color = pick(rng, accents);
    ctx.globalCompositeOperation = rng() < 0.45 ? (p.tone === 'dark' ? 'screen' : 'multiply') : 'source-over';
    ctx.globalAlpha = between(rng, 0.6, 0.92);
    const kind = rng();
    ctx.beginPath();
    if (kind < 0.55) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else if (kind < 0.8) {
      const start = between(rng, 0, Math.PI * 2);
      ctx.arc(x, y, r, start, start + Math.PI);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = between(rng, 24, 80);
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/** Strahlen: Lichtbündel aus einer Quelle, darüber ein warmer Schein */
function strahlen(ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) {
  const [c0, c1, ...accents] = p.colors;
  baseGradient(ctx, w, h, rng, c0, c1);
  const fromTop = rng() < 0.6;
  const ox = between(rng, 0.15, 0.85) * w;
  const oy = fromTop ? -h * 0.08 : h * 1.08;
  const rays = 16 + Math.floor(rng() * 10);
  const reach = Math.hypot(w, h) * 1.2;
  ctx.globalCompositeOperation = p.tone === 'dark' ? 'screen' : 'source-over';
  const angle = fromTop ? 0 : Math.PI;
  const step = Math.PI / rays;
  for (let i = 0; i < rays; i++) {
    const spread = step * between(rng, 0.35, 0.9);
    const a = angle + step * i + between(rng, -0.04, 0.04);
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, reach);
    const color = pick(rng, accents);
    g.addColorStop(0, rgba(color, between(rng, 0.35, 0.6)));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a) * reach, oy + Math.sin(a) * reach);
    ctx.lineTo(ox + Math.cos(a + spread) * reach, oy + Math.sin(a + spread) * reach);
    ctx.closePath();
    ctx.fill();
  }
  blob(ctx, ox, fromTop ? h * 0.05 : h * 0.95, w * 0.8, w * 0.8, 0, pick(rng, accents), 0.7);
  ctx.globalCompositeOperation = 'source-over';
}

const PAINTERS: Record<Style, (ctx: Ctx, w: number, h: number, rng: () => number, p: Palette) => void> = {
  aurora,
  wellen,
  glas,
  felder,
  kreise,
  strahlen,
};

/** Feine Körnung gegen Farbstufen in den Verläufen – als Kachel, das geht schnell */
function grain(ctx: Ctx, w: number, h: number, rng: () => number, tone: Tone) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 192;
  const t = tile.getContext('2d')!;
  const data = t.createImageData(192, 192);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  t.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalAlpha = tone === 'dark' ? 0.07 : 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')!;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Den ganzen Hintergrund malen */
export function paintBackground(ctx: Ctx, w: number, h: number, design: Design) {
  const rng = seededRandom(design.seed);
  PAINTERS[design.style](ctx, w, h, rng, design.palette);
  grain(ctx, w, h, rng, design.palette.tone);
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Milchglas: Der Hintergrund hinter der Fläche wird verwischt (stark verkleinert und wieder vergrößert)
 * und getönt – so bleibt der Vers auf jedem Motiv lesbar.
 */
export function frostedPanel(ctx: Ctx, canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, tone: Tone) {
  const steps = [6, 20];
  let source: HTMLCanvasElement = canvas;
  const sizes: HTMLCanvasElement[] = [];
  for (const factor of steps) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(canvas.width / factor));
    c.height = Math.max(1, Math.round(canvas.height / factor));
    const cx = c.getContext('2d')!;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(source, 0, 0, c.width, c.height);
    sizes.push(c);
    source = c;
  }
  // Wieder hochskalieren: erst auf die mittlere Größe, dann auf das ganze Bild
  const mid = document.createElement('canvas');
  mid.width = sizes[0].width;
  mid.height = sizes[0].height;
  const mx = mid.getContext('2d')!;
  mx.imageSmoothingEnabled = true;
  mx.imageSmoothingQuality = 'high';
  mx.drawImage(sizes[1], 0, 0, mid.width, mid.height);

  const radius = 64;
  const tint = PANEL_TINT[tone];
  // Schatten unter der Fläche (die Fläche selbst deckt das Milchglas gleich wieder zu)
  ctx.save();
  ctx.shadowColor = tone === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(40, 30, 70, 0.18)';
  ctx.shadowBlur = 80;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = `rgb(${tint.rgb.join(', ')})`;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(mid, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgba(${tint.rgb.join(', ')}, ${tint.alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, radius - 1.5);
  ctx.lineWidth = 3;
  ctx.strokeStyle = tone === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.7)';
  ctx.stroke();
  ctx.restore();
}
