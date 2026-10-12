import { useEffect, useState } from 'preact/hooks';
import { GROUP_LABELS } from '../../shared/rules';
import type { RecapView } from '../../shared/types';
import { Button, Logo, QuestionText, Toast, upperFirst } from '../components/ui';
import { WeekVerseCard } from '../components/WeekVerse';
import { ApiError, api } from '../lib/api';
import { locale, t, usePartyLang } from '../lib/i18n';
import { navigate, recapUrl } from '../lib/router';
import { shareLink } from '../lib/share';
import { CuriousCard } from './Jesus';
import { LegalLinks } from './Legal';

export function recapDate(recap: Pick<RecapView, 'playedAt'>): string {
  return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(recap.playedAt));
}

/** Entdeckungen zum Mitnehmen: dauerhafte Seite einer Partie, ohne Namen, zum Teilen und Nachlesen. */
export function RecapPage({ id }: { id: string }) {
  const [recap, setRecap] = useState<RecapView | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Die Seite erscheint in der Sprache der Partie (ältere Seiten: Deutsch)
  usePartyLang(recap ? recap.lang ?? 'de' : null);

  useEffect(() => {
    let cancelled = false;
    api
      .recap(id)
      .then((res) => !cancelled && setRecap(res.recap))
      .catch((err: unknown) => !cancelled && setError(err instanceof ApiError ? err : new ApiError('http', t('Die Seite lädt gerade nicht.'), 0)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!recap) return;
    const before = document.title;
    document.title = t('Entdeckungen vom {date} – Bible Bluff', { date: recapDate(recap) });
    return () => {
      document.title = before;
    };
  }, [recap]);

  if (error) {
    return (
      <main class="page center-page">
        <div class="card gone">
          <Logo small />
          <h1>{error.status === 404 ? t('Nicht gefunden') : t('Ups')}</h1>
          <p>{error.message}</p>
          <Button block onClick={() => navigate('/')}>
            {t('Zur Startseite')}
          </Button>
        </div>
      </main>
    );
  }
  if (!recap) {
    return (
      <main class="page center-page">
        <div class="loader" aria-label={t('Lädt')} />
      </main>
    );
  }

  const share = async () =>
    setToast(
      await shareLink({
        title: t('Bible Bluff – unsere Entdeckungen'),
        text: t('{n} Entdeckungen aus der Bibel, die wir beim Bible Bluff gemacht haben:', { n: recap.items.length }),
        url: recapUrl(recap.id, recap.lang ?? 'de'),
      }),
    );

  return (
    <main class="page recap">
      <header class="hero recap-hero">
        <Logo />
        <p class="eyebrow recap-eyebrow">{t('Partie vom {date}', { date: recapDate(recap) })}</p>
        <h1>{t('Unsere Entdeckungen')}</h1>
        <p class="tagline">
          {t('{n} Fragen, {players} Mitspielende – alle Antworten mit Bibelstelle zum Nachlesen.', {
            n: recap.items.length,
            players: recap.players,
          })}
        </p>
      </header>

      <ol class="recap-list">
        {recap.items.map((item, i) => (
          <li class="recap-item" style={{ '--g': `var(--g-${item.group})` }}>
            <header class="question-meta">
              <span class="book-chip">{item.book}</span>
              <span class="group-label">{t(GROUP_LABELS[item.group])}</span>
              <span class="recap-num">
                {i + 1}/{recap.items.length}
              </span>
            </header>
            <p class="recap-q">
              <QuestionText prompt={item.prompt} fill={item.answer} />
            </p>
            <p class="recap-a">✓ {upperFirst(item.answer)}</p>
            <p class="recap-ref">{item.ref}</p>
            <p class="recap-d">{item.discovery}</p>
            {item.favorites.length > 0 && (
              <p class="recap-fav">
                <span aria-hidden="true">♥</span> {t('Lieblingsbluff der Runde:')}{' '}
                {item.favorites.map((f) => t('„{text}“', { text: f })).join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ol>

      <WeekVerseCard items={recap.items.map((item, i) => ({ book: item.book, group: item.group, key: `${recap.id}-${i}` }))} />

      <section class="stack">
        <Button variant="gold" block onClick={share}>
          {t('Seite teilen')}
        </Button>
        <Button variant="ghost" block onClick={() => navigate('/')}>
          {t('Selbst eine Partie spielen')}
        </Button>
      </section>
      <CuriousCard />
      <p class="footnote">{t('Diese Seite bleibt erhalten, auch wenn der Spielraum längst geschlossen ist.')}</p>
      <LegalLinks />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
