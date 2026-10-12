// Sperrbildschirm-Motive: Zufall mit Startwert, alle Stile und Paletten erreichbar, Schrift immer lesbar.

import { describe, expect, it } from 'vitest';
import { PALETTES, STYLES, designFor, hexToRgb, seededRandom, textColors, worstContrast } from '../src/client/lib/wallpaper';

const rgb = (css: string): [number, number, number] =>
  css.startsWith('#') ? hexToRgb(css) : (css.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as [number, number, number]);

describe('Sperrbildschirm-Motive', () => {
  it('ergeben mit derselben Zahl dasselbe Motiv', () => {
    expect(designFor(12345)).toEqual(designFor(12345));
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('kommen in allen Stilen und Paletten vor', () => {
    const styles = new Set<string>();
    const palettes = new Set<string>();
    for (let seed = 0; seed < 2000; seed++) {
      const d = designFor(seed);
      styles.add(d.style);
      palettes.add(d.palette.name);
    }
    expect([...styles].sort()).toEqual([...STYLES].sort());
    expect(palettes.size).toBe(PALETTES.length);
  });

  it('haben stimmige Paletten mit hellen und dunklen Varianten', () => {
    expect(new Set(PALETTES.map((p) => p.name)).size).toBe(PALETTES.length);
    expect(PALETTES.some((p) => p.tone === 'dark')).toBe(true);
    expect(PALETTES.some((p) => p.tone === 'light')).toBe(true);
    for (const p of PALETTES) for (const c of p.colors) expect(c, p.name).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('halten die Schrift auf dem Milchglas lesbar – über jeder Farbe der Palette (WCAG 4,5 : 1)', () => {
    for (const p of PALETTES) {
      const colors = textColors(p);
      expect(worstContrast(rgb(colors.text), p), `${p.name} Vers`).toBeGreaterThanOrEqual(4.5);
      expect(worstContrast(rgb(colors.accent), p), `${p.name} Akzent`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
