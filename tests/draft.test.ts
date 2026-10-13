import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, draftKey, loadDraft, saveDraft } from '../src/client/lib/draft';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('Ungesendete Bluff-Entwürfe', () => {
  it('stellt den Entwurf nur in derselben Runde, demselben Raum und für dieselbe Person wieder her', () => {
    const key = draftKey('LAMPE7', 'anna');
    saveDraft(key, 'partie1:runde1', 'Zwischen zwei Sandalen');
    expect(loadDraft(key, 'partie1:runde1')).toBe('Zwischen zwei Sandalen');
    expect(loadDraft(key, 'partie2:runde1')).toBeNull();
    expect(loadDraft(draftKey('LAMPE7', 'ben'), 'partie1:runde1')).toBeNull();
    expect(loadDraft(draftKey('NETZ9', 'anna'), 'partie1:runde1')).toBeNull();
    clearDraft(key);
    expect(loadDraft(key, 'partie1:runde1')).toBeNull();
  });
  it('bleibt bei gesperrtem oder beschädigtem Browser-Speicher benutzbar', () => {
    const key = draftKey('LAMPE7', 'anna');
    sessionStorage.setItem(key, '{kaputt');
    expect(loadDraft(key, 'runde')).toBeNull();
    vi.stubGlobal('sessionStorage', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } });
    expect(() => saveDraft(key, 'runde', 'Ein Entwurf')).not.toThrow();
    expect(() => clearDraft(key)).not.toThrow();
    expect(loadDraft(key, 'runde')).toBeNull();
  });
  it('zeigt eine trotz verlorener HTTP-Antwort bereits bestätigte Abgabe als abgeschickt', () => {
    const key = draftKey('LAMPE7', 'anna');
    saveDraft(key, 'runde', ' Eine  Harfe aus Zedernholz ');
    expect(loadDraft(key, 'runde', 'Eine Harfe aus Zedernholz')).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
    saveDraft(key, 'runde', 'Ein neuer Entwurf');
    expect(loadDraft(key, 'runde', 'Eine Harfe aus Zedernholz')).toBe('Ein neuer Entwurf');
  });
});
