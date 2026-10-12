// Wie viele Fragen und Lückentexte es je Kategorie gibt – für die Auswahl beim Eröffnen und in der Lobby.
// Die Zahlen ändern sich nur mit einer neuen Version, darum genügt ein Abruf je Sprache und Seitenaufruf.
import { useEffect, useState } from 'preact/hooks';
import { ALL_CATEGORIES, CATEGORIES } from '../../shared/rules';
import type { CategoryId, Lang, PoolResponse, RoundType, Settings } from '../../shared/types';
import { api } from './api';
import { t } from './i18n';

const cache: Partial<Record<Lang, PoolResponse>> = {};
const loading: Partial<Record<Lang, Promise<PoolResponse | null>>> = {};

/** Fragen je Kategorie im Pool dieser Sprache (der englische ist kleiner) */
export function usePool(lang: Lang): PoolResponse | null {
  const [pool, setPool] = useState<{ lang: Lang; res: PoolResponse } | null>(() => (cache[lang] ? { lang, res: cache[lang]! } : null));
  useEffect(() => {
    if (cache[lang]) {
      setPool({ lang, res: cache[lang]! });
      return;
    }
    let alive = true;
    const pending = (loading[lang] ??= api.pool(lang).then(
      (res) => (cache[lang] = res),
      () => null,
    ));
    pending.then((res) => {
      if (!res) delete loading[lang]; // beim nächsten Mal neu versuchen
      if (alive && res) setPool({ lang, res });
    });
    return () => {
      alive = false;
    };
  }, [lang]);
  return pool?.lang === lang ? pool.res : null;
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

/** „40 Fragen“, „12 Lückentexte“ oder beides – passend zur Rundenart */
export function poolAmount(n: number, roundType: RoundType): string {
  if (roundType === 'fragen') return t('{n} Fragen', { n });
  if (roundType === 'luecken') return t('{n} Lückentexte', { n });
  return t('{n} Fragen und Lückentexte', { n });
}

/** Dasselbe im Dativ: „von 40 Lückentexten“ */
export function poolAmountDative(n: number, roundType: RoundType): string {
  if (roundType === 'fragen') return t('{n} Fragen', { n });
  if (roundType === 'luecken') return t('{n} Lückentexten', { n });
  return t('{n} Fragen und Lückentexten', { n });
}

/** Kurzfassung für Lobby und Joseph-Seite: „8 Runden · Fragen & Lückentexte · alle Kategorien · mit Herzensrunde“ */
export function settingsSummary(s: Settings): string {
  const type = s.roundType === 'fragen' ? t('nur Fragen') : s.roundType === 'luecken' ? t('nur Lückentexte') : t('Fragen & Lückentexte');
  const categories =
    s.categories.length >= ALL_CATEGORIES.length
      ? t('alle Kategorien')
      : CATEGORIES.filter((c) => s.categories.includes(c.id))
          .map((c) => t(c.label))
          .join(', ');
  return `${t('{n} Runden', { n: s.rounds })} · ${type} · ${categories}${s.heartRound ? ` · ${t('mit Herzensrunde')}` : ''}`;
}
