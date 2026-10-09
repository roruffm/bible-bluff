import { useEffect, useState } from 'preact/hooks';
import { GROUP_LABELS } from '../../shared/rules';
import type { RecapView } from '../../shared/types';
import { Button, Logo, Toast } from '../components/ui';
import { ApiError, api } from '../lib/api';
import { navigate, recapUrl } from '../lib/router';
import { shareLink } from '../lib/share';
import { LegalLinks } from './Legal';

const DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

export function recapDate(recap: Pick<RecapView, 'playedAt'>): string {
  return DATE.format(new Date(recap.playedAt));
}

/** Entdeckungen zum Mitnehmen: dauerhafte Seite einer Partie, ohne Namen, zum Teilen und Nachlesen. */
export function RecapPage({ id }: { id: string }) {
  const [recap, setRecap] = useState<RecapView | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .recap(id)
      .then((res) => !cancelled && setRecap(res.recap))
      .catch((err: unknown) => !cancelled && setError(err instanceof ApiError ? err : new ApiError('http', 'Die Seite lädt gerade nicht.', 0)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!recap) return;
    const before = document.title;
    document.title = `Entdeckungen vom ${recapDate(recap)} – Bible Bluff`;
    return () => {
      document.title = before;
    };
  }, [recap]);

  if (error) {
    return (
      <main class="page center-page">
        <div class="card gone">
          <Logo small />
          <h1>{error.status === 404 ? 'Nicht gefunden' : 'Ups'}</h1>
          <p>{error.message}</p>
          <Button block onClick={() => navigate('/')}>
            Zur Startseite
          </Button>
        </div>
      </main>
    );
  }
  if (!recap) {
    return (
      <main class="page center-page">
        <div class="loader" aria-label="Lädt" />
      </main>
    );
  }

  const share = async () =>
    setToast(
      await shareLink({
        title: 'Bible Bluff – unsere Entdeckungen',
        text: `${recap.items.length} Entdeckungen aus der Bibel, die wir beim Bible Bluff gemacht haben:`,
        url: recapUrl(recap.id),
      }),
    );

  return (
    <main class="page recap">
      <header class="hero recap-hero">
        <Logo />
        <p class="eyebrow recap-eyebrow">Partie vom {recapDate(recap)}</p>
        <h1>Unsere Entdeckungen</h1>
        <p class="tagline">
          {recap.items.length} Fragen, {recap.players} Mitspielende – alle Antworten mit Bibelstelle zum Nachlesen.
        </p>
      </header>

      <ol class="recap-list">
        {recap.items.map((item, i) => (
          <li class="recap-item" style={{ '--g': `var(--g-${item.group})` }}>
            <header class="question-meta">
              <span class="book-chip">{item.book}</span>
              <span class="group-label">{GROUP_LABELS[item.group]}</span>
              <span class="recap-num">
                {i + 1}/{recap.items.length}
              </span>
            </header>
            <p class="recap-q">{item.prompt}</p>
            <p class="recap-a">✓ {item.answer}</p>
            <p class="recap-ref">{item.ref}</p>
            <p class="recap-d">{item.discovery}</p>
            {item.favorites.length > 0 && (
              <p class="recap-fav">
                <span aria-hidden="true">♥</span> Lieblingsbluff der Runde:{' '}
                {item.favorites.map((f, k) => (
                  <>
                    {k > 0 && ' · '}„{f}“
                  </>
                ))}
              </p>
            )}
          </li>
        ))}
      </ol>

      <section class="stack">
        <Button variant="gold" block onClick={share}>
          Seite teilen
        </Button>
        <Button variant="ghost" block onClick={() => navigate('/')}>
          Selbst eine Partie spielen
        </Button>
      </section>
      <p class="footnote">Diese Seite bleibt erhalten, auch wenn der Spielraum längst geschlossen ist.</p>
      <LegalLinks />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
