import { useEffect, useState } from 'preact/hooks';
import { POINTS_FAVORITE } from '../../shared/rules';
import type { RoomView } from '../../shared/types';
import { QRCode } from '../components/QR';
import { Avatar, Button, ConfirmButton, Toast, formatSeconds } from '../components/ui';
import { api } from '../lib/api';
import { type RoomConnection, useServerNow } from '../lib/hooks';
import { navigate, recapUrl } from '../lib/router';
import { shareLink } from '../lib/share';

export function ScoresPhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const answer = round.answer!;
  const now = useServerNow(500);
  const isHost = Boolean(view.me?.isHost) && !display;
  const last = round.index + 1 >= round.total;
  const left = round.deadline ? round.deadline - (view.paused?.at ?? now) : 0;
  const results = new Map((round.results ?? []).map((r) => [r.playerId, r]));
  const ranked = view.players
    .filter((p) => p.plays)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'de'));

  return (
    <section class={`phase scores stack${display ? ' is-display' : ''}`}>
      <article class="discovery pop">
        <p class="eyebrow">
          Runde {round.index + 1} von {round.total} · Auflösung
        </p>
        <h2 class="discovery-question">{round.question.prompt}</h2>
        <p class="discovery-answer">
          <span aria-hidden="true">✓</span> {answer.text}
        </p>
        <p class="discovery-ref">{answer.ref}</p>
        <div class="merksatz">
          <span class="merksatz-label">Entdeckung</span>
          <p>{answer.discovery}</p>
        </div>
      </article>

      <FavoritesCard view={view} conn={conn} display={display} />

      <section class="card scoreboard">
        <h2 class="card-title">Punktestand</h2>
        <ol>
          {ranked.map((p, i) => {
            const r = results.get(p.id);
            return (
              <li class={`score-row pop${p.id === view.me?.id ? ' is-me' : ''}`} style={{ animationDelay: `${120 + i * 90}ms` }}>
                <span class="rank">{1 + ranked.filter((o) => o.score > p.score).length}.</span>
                <Avatar person={p} />
                <span class="score-name">{p.name}</span>
                <span class="deltas">
                  {r && r.truth > 0 && (
                    <span class="delta is-truth" title="Wahrheit erkannt">
                      ✓ +{r.truth}
                    </span>
                  )}
                  {r && r.bluff > 0 && (
                    <span class="delta is-bluff" title="Mitspielende reingelegt">
                      Bluff +{r.bluff}
                    </span>
                  )}
                  {r && r.favorite > 0 && (
                    <span class="delta is-favorite" title="Lieblingsbluff mit den meisten Herzen">
                      ♥ +{r.favorite}
                    </span>
                  )}
                </span>
                <span class="score-total">{p.score}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <footer class="next-bar">
        {isHost ? (
          <Button variant="gold" block onClick={() => conn.act({ type: 'next' })}>
            {last ? 'Zum Endstand' : 'Nächste Runde'}
          </Button>
        ) : null}
        {round.deadline && (
          <p class="muted small center">
            {view.paused
              ? 'Pausiert.'
              : `${last ? 'Endstand' : 'Nächste Runde'} automatisch in ${formatSeconds(left)}${isHost ? '' : ' – oder wenn die Spielleitung weitertippt'}.`}
          </p>
        )}
      </footer>
    </section>
  );
}

/** Lieblingsbluff der Runde: Herzen vergeben, die meisten Herzen bringen einen Extrapunkt. */
function FavoritesCard({ view, conn, display }: { view: RoomView; conn: RoomConnection; display: boolean }) {
  const round = view.round!;
  const items = round.favorites ?? [];
  const canLike = Boolean(view.me) && !display;
  // undefined: nichts unterwegs · null: Herz wird zurückgenommen · string: Herz für diesen Bluff
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  if (!items.length) return null;

  const myLike = pending !== undefined ? pending : round.myLike;
  const like = async (optionId: string) => {
    setPending(myLike === optionId ? null : optionId);
    setError(null);
    try {
      await conn.act({ type: 'like', optionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Herz nicht angekommen.');
    } finally {
      setPending(undefined);
    }
  };

  return (
    <section class="card favorites">
      <h2 class="card-title">Lieblingsbluff</h2>
      <p class="muted small favorites-hint">
        {canLike ? 'Welcher Bluff hat euch am besten gefallen? ' : ''}Die meisten Herzen bringen +{POINTS_FAVORITE} Punkt.
      </p>
      <ul class="fav-list">
        {items.map((item) => {
          const liked = myLike === item.optionId;
          const count = item.likes - (round.myLike === item.optionId ? 1 : 0) + (liked ? 1 : 0);
          return (
            <li>
              <button
                type="button"
                class={`fav${liked ? ' is-liked' : ''}${item.leading ? ' is-leading' : ''}${item.mine ? ' is-mine' : ''}`}
                disabled={!canLike || item.mine}
                aria-pressed={liked}
                onClick={() => like(item.optionId)}
              >
                <span class="fav-text">„{item.text}“</span>
                <span class="fav-by">
                  {item.authors.map((a) => (
                    <Avatar person={a} size="sm" />
                  ))}
                  {item.mine ? 'Dein Bluff' : item.authors.map((a) => a.name).join(' & ')}
                  {item.leading && <span class="badge">Vorn</span>}
                </span>
                <span class="fav-heart" aria-label={`${count} ${count === 1 ? 'Herz' : 'Herzen'}`}>
                  <span aria-hidden="true">{liked ? '♥' : '♡'}</span> {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export function FinalScreen({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const final = view.final!;
  const isHost = Boolean(view.me?.isHost) && !display;
  const podium = final.ranking.slice(0, 3);
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <section class={`phase final stack-lg${display ? ' is-display' : ''}`}>
      <header class="final-head">
        <p class="eyebrow">Partie beendet</p>
        <h1>Endstand</h1>
        {/* Auf der Leinwand gleich oben sichtbar – dort scrollt niemand */}
        {display && <RecapShare view={view} display />}
      </header>

      <div class="podium" aria-label="Siegertreppchen">
        {order.map((p) => (
          <div class={`podium-place place-${p.rank}`}>
            <Avatar person={p} size="lg" />
            <span class="podium-name">{p.name}</span>
            <span class="podium-score">{p.score} Punkte</span>
            <span class="podium-block">{p.rank}</span>
          </div>
        ))}
      </div>

      {final.ranking.length > 3 && (
        <ol class="ranking card" start={4}>
          {final.ranking.slice(3).map((p) => (
            <li class={p.id === view.me?.id ? 'is-me' : ''}>
              <span class="rank">{p.rank}.</span>
              <Avatar person={p} size="sm" />
              <span class="score-name">{p.name}</span>
              <span class="score-total">{p.score}</span>
            </li>
          ))}
        </ol>
      )}

      {final.awards.length > 0 && (
        <section class="awards">
          {final.awards.map((a) => (
            <article class={`award award-${a.key}`}>
              <p class="award-title">{a.title}</p>
              {a.quote && <p class="award-quote">„{a.quote}“</p>}
              <p class="award-people">{a.players.map((p) => p.name).join(' & ')}</p>
              <p class="award-text">
                {a.quote
                  ? `♥ ${a.value} ${a.value === 1 ? 'Herz' : 'Herzen'} in einer Runde`
                  : `${a.text.charAt(0).toUpperCase() + a.text.slice(1)} · ${a.value}×`}
              </p>
            </article>
          ))}
        </section>
      )}

      <section class="card discoveries">
        <h2 class="card-title">Eure Entdeckungen zum Nachlesen</h2>
        <ol>
          {final.discoveries.map((d) => (
            <li>
              <p class="d-ref">{d.ref}</p>
              <p class="d-q">{d.prompt}</p>
              <p class="d-a">✓ {d.answer}</p>
              <p class="d-text">{d.discovery}</p>
            </li>
          ))}
        </ol>
        {!display && <RecapShare view={view} display={false} />}
      </section>

      {!display && (
        <footer class="stack">
          {isHost ? (
            <>
              <Button variant="gold" block onClick={() => conn.act({ type: 'playAgain' })}>
                Neue Partie mit allen
              </Button>
              <ConfirmButton block confirm="Wirklich schließen? Nochmal tippen" onConfirm={() => conn.act({ type: 'close' })}>
                Raum schließen
              </ConfirmButton>
            </>
          ) : (
            <p class="waiting">
              <span class="pulse" aria-hidden="true" />
              Vielleicht startet die Spielleitung gleich eine neue Partie …
            </p>
          )}
          <Button variant="ghost" block onClick={() => navigate('/')}>
            Zur Startseite
          </Button>
        </footer>
      )}
    </section>
  );
}

/**
 * Die dauerhafte Entdeckungen-Seite steht bereit, sobald ein Gerät sie angelegt hat. Jedes Gerät fragt
 * nach kurzer, zufälliger Wartezeit selbst an – meist ist die ID bis dahin schon über den Spielstand da.
 * So ist der Link fertig, bevor jemand auf „Teilen“ tippt (iOS teilt nur direkt nach dem Tippen).
 */
function useRecapId(view: RoomView): string | null {
  const known = view.final?.recapId ?? null;
  const [created, setCreated] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (known || created) return;
    let cancelled = false;
    const timer = window.setTimeout(
      () => {
        api
          .createRecap(view.code)
          .then((res) => !cancelled && setCreated(res.id))
          .catch(() => !cancelled && setAttempt((a) => a + 1));
      },
      attempt === 0 ? 400 + Math.random() * 1600 : Math.min(30_000, 2000 * 2 ** attempt),
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [known, created, attempt, view.code]);
  return known ?? created;
}

function RecapShare({ view, display }: { view: RoomView; display: boolean }) {
  const id = useRecapId(view);
  const [toast, setToast] = useState<string | null>(null);
  const url = id ? recapUrl(id) : null;

  if (display) {
    return url ? (
      <div class="recap-share is-display">
        <QRCode value={url} label="QR-Code zur Entdeckungen-Seite" />
        <p>
          <b>Entdeckungen zum Mitnehmen</b>
          <span>Scannen: alle Fragen, Antworten und Bibelstellen auf einer eigenen Seite.</span>
        </p>
      </div>
    ) : null;
  }

  const share = async () => {
    if (!url) return;
    setToast(
      await shareLink({
        title: 'Bible Bluff – unsere Entdeckungen',
        text: `${view.final!.discoveries.length} Entdeckungen aus der Bibel, die wir beim Bible Bluff gemacht haben:`,
        url,
      }),
    );
  };
  return (
    <div class="recap-share">
      <p class="muted small">Alle Fragen, Antworten und Bibelstellen auf einer eigenen Seite – sie bleibt, auch wenn der Raum geschlossen ist.</p>
      <div class="row">
        <Button variant="gold" onClick={share} disabled={!url}>
          {url ? 'Entdeckungen teilen' : 'Seite wird vorbereitet …'}
        </Button>
        {url && (
          <Button variant="secondary" onClick={() => navigate(`/e/${id}`)}>
            Ansehen
          </Button>
        )}
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
