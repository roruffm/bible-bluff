import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASE_THEME, DEFAULT_THEME, THEMES, THEME_IDS, isThemeId } from '../src/client/lib/theme';

const css = readFileSync(new URL('../src/client/styles.css', import.meta.url), 'utf8');
const index = readFileSync(new URL('../src/client/index.html', import.meta.url), 'utf8');

describe('Farbkonzepte', () => {
  it('beschreibt jede ID genau einmal, mit See Genezareth als Standard', () => {
    expect(THEMES.map((t) => t.id)).toEqual([...THEME_IDS]);
    expect(DEFAULT_THEME).toBe('see');
    expect(THEMES[0].id).toBe(DEFAULT_THEME);
    expect(BASE_THEME).toBe('lernblatt');
    expect(THEME_IDS).toHaveLength(6);
  });

  it('hat für jedes Konzept außer der Lernblatt-Basis einen Farbblock im Stylesheet', () => {
    for (const id of THEME_IDS.filter((t) => t !== BASE_THEME)) {
      expect(css, id).toContain(`:root[data-theme='${id}'] {`);
    }
  });

  it('setzt in jedem Block dieselben Grundfarben', () => {
    const required = ['--paper', '--card', '--ink', '--line', '--brown', '--cream', '--gold', '--olive', '--rust', '--g-nt', '--g-at', '--logo-ink', '--logo-b1', '--logo-f1', '--logo-cover'];
    for (const id of THEME_IDS.filter((t) => t !== BASE_THEME)) {
      const block = css.split(`:root[data-theme='${id}'] {`)[1].split('}')[0];
      for (const name of required) expect(block, `${id} ${name}`).toContain(`${name}:`);
    }
  });

  it('erkennt nur bekannte IDs', () => {
    expect(isThemeId('nacht')).toBe(true);
    expect(isThemeId('NACHT')).toBe(false);
    expect(isThemeId('')).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it('nutzt im Vorab-Skript denselben Speicherschlüssel, Link-Parameter und Standard', () => {
    expect(index).toContain("localStorage.getItem('bible-bluff:v1:theme')");
    expect(index).toContain(".get('farbe')");
    expect(index).toContain(`var t = '${DEFAULT_THEME}';`);
    expect(index).toContain(`t !== '${BASE_THEME}'`);
  });
});
