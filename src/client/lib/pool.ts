// Wie viele Fragen und Lückentexte es je Kategorie gibt – für die Auswahl beim Eröffnen und in der Lobby.
// Die Zahlen ändern sich nur mit einer neuen Version, darum genügt ein Abruf pro Seitenaufruf.
import { useEffect, useState } from 'preact/hooks';
import { ALL_CATEGORIES, CATEGORIES } from '../../shared/rules';
import type { CategoryId, PoolResponse, RoundType, Settings } from '../../shared/types';
import { api } from './api';

let cache: PoolResponse | null = null;
let loading: Promise<PoolResponse | null> | null = null;

export function usePool(): PoolResponse | null {
  const [pool, setPool] = useState(cache);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    loading ??= api.pool().then(
      (res) => (cache = res),
      () => null,
    );
    loading.then((res) => {
      if (!res) loading = null; // beim nächsten Mal neu versuchen
      if (alive && res) setPool(res);
    });
    return () => {
      alive = false;
    };
  }, []);
  return pool;
}

export function categoryCount(pool: PoolResponse, id: CategoryId, roundType: RoundType): number {
  const c = pool.categories.find((x) => x.id === id);
  if (!c) return 0;
  if (roundType === 'fragen') return c.questions;
  if (roundType === 'luecken') return c.gaps;
  return c.questions + c.gaps;
}

/** Wie viele Fragen zur Auswahl passen */
export function poolCount(pool: PoolResponse, settings: Settings): number {
  return settings.categories.reduce((n, id) => n + categoryCount(pool, id, settings.roundType), 0);
}

/** „Fragen“, „Lückentexte“ oder beides – passend zur Rundenart */
export function poolNoun(roundType: RoundType): string {
  if (roundType === 'fragen') return 'Fragen';
  if (roundType === 'luecken') return 'Lückentexte';
  return 'Fragen und Lückentexte';
}

/** Dasselbe im Dativ: „von 40 Lückentexten“ */
export function poolNounDative(roundType: RoundType): string {
  if (roundType === 'fragen') return 'Fragen';
  if (roundType === 'luecken') return 'Lückentexten';
  return 'Fragen und Lückentexten';
}

/** Kurzfassung für Lobby und Joseph-Seite: „8 Runden · Fragen & Lückentexte · alle Kategorien“ */
export function settingsSummary(s: Settings): string {
  const type = s.roundType === 'fragen' ? 'nur Fragen' : s.roundType === 'luecken' ? 'nur Lückentexte' : 'Fragen & Lückentexte';
  const categories =
    s.categories.length >= ALL_CATEGORIES.length
      ? 'alle Kategorien'
      : CATEGORIES.filter((c) => s.categories.includes(c.id))
          .map((c) => c.label)
          .join(', ');
  return `${s.rounds} Runden · ${type} · ${categories}`;
}
