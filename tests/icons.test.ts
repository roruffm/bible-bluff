import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PUBLIC = new URL('../src/client/public/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path.replace(/^\//, ''), PUBLIC));
const exists = (path: string) => existsSync(new URL(path.replace(/^\//, ''), PUBLIC));
const index = readFileSync(new URL('../src/client/index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest.webmanifest').toString()) as { icons: { src: string; sizes: string }[] };
const redirects = read('_redirects')
  .toString()
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.trim().split(/\s+/));

/** Bis zum Logo-Wechsel zeigten diese Adressen das alte Logo – Messenger haben es dort gespeichert */
const OLD = ['/icon.svg', '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'];

function pngSize(buf: Buffer) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('App-Symbole', () => {
  it('sind alle vorhanden, auf die Seite und Manifest zeigen', () => {
    const links = [...index.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g)].map((m) => m[1]);
    expect(links).toContain('/favicon.ico');
    expect(links).toContain('/apple-touch-icon.png');
    for (const path of [...links, ...manifest.icons.map((i) => i.src)]) expect(exists(path), path).toBe(true);
  });

  it('nutzen keine Adresse mehr, unter der das alte Logo gespeichert sein kann', () => {
    for (const path of OLD) {
      expect(index, path).not.toContain(`"${path}"`);
      expect(manifest.icons.map((i) => i.src), path).not.toContain(path);
      expect(exists(path), path).toBe(false);
    }
  });

  it('leiten die alten Adressen dauerhaft auf die neuen Bilder um', () => {
    for (const path of OLD) {
      const rule = redirects.find(([from]) => from === path);
      expect(rule, path).toBeDefined();
      expect(rule![2]).toBe('301');
      expect(exists(rule![1]), rule![1]).toBe(true);
    }
  });

  it('liefern ein echtes favicon.ico mit 16, 32 und 48 Pixeln', () => {
    const ico = read('favicon.ico');
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + 16 * i));
    expect(sizes).toEqual([16, 32, 48]);
    for (let i = 0; i < count; i++) {
      const offset = ico.readUInt32LE(6 + 16 * i + 12);
      expect(ico.subarray(offset, offset + 4).toString('latin1')).toBe('\x89PNG');
    }
  });

  it('haben das Homescreen-Symbol in 180 × 180 und die Manifest-Bilder in ihrer Größe', () => {
    expect(pngSize(read('apple-touch-icon.png'))).toEqual({ width: 180, height: 180 });
    for (const icon of manifest.icons.filter((i) => i.src.endsWith('.png'))) {
      const [w, h] = icon.sizes.split('x').map(Number);
      expect(pngSize(read(icon.src)), icon.src).toEqual({ width: w, height: h });
    }
  });
});
