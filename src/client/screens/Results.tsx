import type { RoomView } from '../../shared/types';
import { Avatar, Button, ConfirmButton, formatSeconds } from '../components/ui';
import { type RoomConnection, useServerNow } from '../lib/hooks';
import { navigate } from '../lib/router';

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
              <p class="award-people">{a.players.map((p) => p.name).join(' & ')}</p>
              <p class="award-text">
                {a.text.charAt(0).toUpperCase() + a.text.slice(1)} · {a.value}×
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
