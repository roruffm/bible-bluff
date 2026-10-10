import { useEffect, useRef, useState } from 'preact/hooks';
import { BOT_NAME, POINTS_FAVORITE, POINTS_GIFT, TALK_STEPS } from '../../shared/rules';
import type { RoomView, TalkNotes, TalkView } from '../../shared/types';
import { FriendsIcon } from '../components/Icons';
import { QRCode } from '../components/QR';
import { Avatar, Button, ConfirmButton, QuestionText, Toast, formatSeconds, upperFirst } from '../components/ui';
import { api } from '../lib/api';
import { type RoomConnection, useServerNow } from '../lib/hooks';
import { navigate, recapUrl } from '../lib/router';
import { shareLink } from '../lib/share';
import { QuietOffer } from './Play';

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
  const me = display ? null : view.me;
  // Wer nur leitet, zeigt die Punkte-Phase oft am Beamer – dann bleibt der Spickzettel erst zugeklappt
  const presenter = Boolean(view.me && !view.me.plays);
  const [toast, setToast] = useState<string | null>(null);

  // „Liebe deinen Nächsten“: Beschenkte bekommen einen Hinweis
  const giftsForMe = (me && results.get(me.id)?.giftsIn) || [];
  const announced = useRef(new Set<string>());
  useEffect(() => {
    const fresh = giftsForMe.filter((p) => !announced.current.has(`${round.index}:${p.id}`));
    if (!fresh.length) return;
    fresh.forEach((p) => announced.current.add(`${round.index}:${p.id}`));
    setToast(`${fresh.map((p) => p.name).join(' & ')} ${fresh.length === 1 ? 'hat' : 'haben'} dir einen Punkt geschenkt ♥`);
  }, [giftsForMe.map((p) => p.id).join(','), round.index]);

  return (
    <section class={`phase scores stack${display ? ' is-display' : ''}`}>
      <article class="discovery pop">
        <p class="eyebrow">
          Runde {round.index + 1} von {round.total} · Auflösung
        </p>
        <h2 class="discovery-question">
          <QuestionText prompt={round.question.prompt} fill={answer.text} />
        </h2>
        <p class="discovery-answer">
          <span aria-hidden="true">✓</span> {upperFirst(answer.text)}
        </p>
        <p class="discovery-ref">{answer.ref}</p>
        <div class="merksatz">
          <span class="merksatz-label">Entdeckung</span>
          <p>{answer.discovery}</p>
        </div>
      </article>

      {round.talk && isHost && <TalkNotesCard notes={round.talk} open={!presenter} />}

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
                <span class="score-main">
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
                    {r?.giftsIn.map((from) => (
                      <span class="delta is-gift" title="Liebe deinen Nächsten">
                        +{POINTS_GIFT} von {from.name}
                      </span>
                    ))}
                    {r?.giftOut && (
                      <span class="delta is-given" title="Liebe deinen Nächsten">
                        −{POINTS_GIFT} an {r.giftOut.name}
                      </span>
                    )}
                    {r?.quiet && (
                      <span class="delta is-quiet" title="Hat diese Runde ausgesetzt, um zu beten">
                        ☾ Ruhige Minute
                      </span>
                    )}
                  </span>
                </span>
                <span class="score-total">{p.score}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {me?.plays && <GiftCard view={view} conn={conn} />}

      {me?.plays &&
        !last &&
        (me.quiet === 'next' ? (
          <div class="quiet-offer is-set">
            <span>☾ Du setzt die nächste Runde aus, um zu beten.</span>
            <Button variant="ghost" small onClick={() => conn.act({ type: 'quiet', on: false }).catch(() => {})}>
              Doch mitspielen
            </Button>
          </div>
        ) : (
          <QuietOffer conn={conn} next />
        ))}

      <Toast message={toast} onDone={() => setToast(null)} />

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

/** „Liebe deinen Nächsten“: einmal pro Runde einen eigenen Punkt verschenken */
function GiftCard({ view, conn }: { view: RoomView; conn: RoomConnection }) {
  const round = view.round!;
  const me = view.me!;
  const others = view.players.filter((p) => p.plays && p.id !== me.id);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!others.length) return null;

  const given = round.myGift ? view.players.find((p) => p.id === round.myGift) : null;
  if (given) {
    return (
      <section class="gift is-done pop">
        <p>
          <span aria-hidden="true">♥</span> Du hast <b>{given.name}</b> einen Punkt geschenkt.
        </p>
        <p class="muted small">„Liebe deinen Nächsten wie dich selbst.“ Markus 12,31</p>
      </section>
    );
  }

  // Der vorläufige Lieblingsbluff-Punkt steht noch nicht fest und lässt sich nicht verschenken
  const mine = round.results?.find((r) => r.playerId === me.id);
  const own = (view.players.find((p) => p.id === me.id)?.score ?? 0) - (mine?.favorite ?? 0);
  const give = async (playerId: string) => {
    setError(null);
    try {
      await conn.act({ type: 'gift', playerId });
      setChoosing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das Geschenk kam nicht an.');
    }
  };

  return (
    <section class="gift">
      {choosing ? (
        <>
          <p class="gift-ask">Wem schenkst du einen Punkt?</p>
          <div class="gift-people">
            {others.map((p) => (
              <button type="button" class="gift-person" onClick={() => give(p.id)}>
                <Avatar person={p} size="sm" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" small onClick={() => setChoosing(false)}>
            Doch nicht
          </Button>
        </>
      ) : (
        <>
          <Button variant="secondary" block disabled={own < POINTS_GIFT} onClick={() => setChoosing(true)}>
            ♥ Liebe deinen Nächsten
          </Button>
          <p class="muted small center">
            {own < POINTS_GIFT
              ? 'Sobald du einen Punkt hast, kannst du ihn verschenken.'
              : 'Schenke einen deiner Punkte – einmal pro Runde.'}
          </p>
        </>
      )}
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** Spickzettel nur für die Spielleitung: Hintergrund, eine Frage für die Gruppe, ein Querverweis */
function TalkNotesCard({ notes, open }: { notes: TalkNotes; open: boolean }) {
  return (
    <details class="card talk-notes" open={open}>
      <summary>
        <span class="talk-notes-title">Spickzettel für die Leitung</span>
        <span class="muted small">nur auf deinem Gerät</span>
      </summary>
      <dl>
        <dt>Hintergrund</dt>
        <dd>{notes.background}</dd>
        <dt>Fragt doch mal</dt>
        <dd>{notes.question}</dd>
        <dt>Querverweis</dt>
        <dd>
          <b>{notes.crossRef.ref}</b> – {notes.crossRef.note}
        </dd>
      </dl>
    </details>
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
  const withBot = view.players.some((p) => p.bot);
  const podium = final.ranking.slice(0, 3);
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);
  if (final.talk) return <TalkScreen view={view} conn={conn} talk={final.talk} display={display} />;

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
              <p class="d-q">
                <QuestionText prompt={d.prompt} fill={d.answer} />
              </p>
              <p class="d-a">✓ {upperFirst(d.answer)}</p>
              <p class="d-text">{d.discovery}</p>
            </li>
          ))}
        </ol>
        {!display && <RecapShare view={view} display={false} />}
      </section>

      {!display && (
        <footer class="stack">
          {isHost && withBot && <SpreadCard friends />}
          {isHost && final.discoveries.length > 0 && (
            <section class="card talk-invite">
              <h2 class="card-title">Vom Spiel ins Gespräch</h2>
              <p class="muted small">
                Die Frage, bei der die meisten danebenlagen, in vier Schritten vertiefen: Lesen, Entdecken, Nachfragen,
                Mitnehmen. Alle Handys und die Leinwand gehen mit.
              </p>
              <Button block onClick={() => conn.act({ type: 'talk' })}>
                Weiter ins Gespräch
              </Button>
            </section>
          )}
          {isHost ? (
            <>
              {/* Mit Joseph ist „mit Freunden spielen“ der nächste Schritt – nochmal gegen ihn geht trotzdem */}
              <Button variant={withBot ? 'secondary' : 'gold'} block onClick={() => conn.act({ type: 'playAgain' })}>
                {withBot ? `Nochmal gegen ${BOT_NAME}` : 'Neue Partie mit allen'}
              </Button>
              <ConfirmButton block confirm="Wirklich schließen? Nochmal tippen" onConfirm={() => conn.act({ type: 'close' })}>
                Raum schließen
              </ConfirmButton>
            </>
          ) : (
            <>
              <p class="waiting">
                <span class="pulse" aria-hidden="true" />
                Vielleicht startet die Spielleitung gleich eine neue Partie …
              </p>
              <SpreadCard />
            </>
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
 * Am Spielende zum Weitersagen einladen – so kommt das Spiel in weitere Gruppen: Wer mitgespielt hat,
 * kann selbst eine Runde leiten; wer gegen Joseph gespielt hat (`friends`), als Nächstes mit Freunden.
 */
function SpreadCard({ friends = false }: { friends?: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const share = async () =>
    setToast(
      await shareLink({
        title: 'Bible Bluff',
        text: 'Kennt ihr Bible Bluff? Alle erfinden Antworten auf eine Bibelfrage – wer findet die echte? Lasst uns das mal zusammen spielen!',
        url: `${location.origin}/`,
      }),
    );
  return (
    <section class="card choice spread-card" aria-labelledby="spread-title">
      <div class="choice-head">
        <span class="choice-icon is-create">
          <FriendsIcon />
        </span>
        <div>
          <h2 id="spread-title">{friends ? 'Jetzt mit Freunden spielen' : 'Leite selbst eine Runde'}</h2>
          <p class="muted small">
            {friends
              ? `Gegen ${BOT_NAME} geübt – mit echten Menschen wird es erst richtig lustig. Eröffne einen Raum und lade Freunde, Familie oder deine Jugendgruppe ein.`
              : 'Hat’s dir gefallen? Spiel es mit deiner Jugendgruppe, deiner Familie oder im Hauskreis – kostenlos und ohne Anmeldung.'}
          </p>
        </div>
      </div>
      <Button variant="gold" block onClick={() => navigate('/neu')}>
        {friends ? 'Raum für Freunde eröffnen' : 'Eigenen Raum eröffnen'}
      </Button>
      {!friends && (
        <Button variant="ghost" block onClick={share}>
          Link an deine Gruppe schicken
        </Button>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
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

/** Inhalt der vier Gesprächsschritte – mit dem Spickzettel der Frage, falls vorhanden */
function TalkStepBody({ index, talk }: { index: number; talk: TalkView }) {
  const notes = talk.notes;
  switch (index) {
    case 0:
      return (
        <p>
          Schlagt <b>{talk.ref}</b> auf. Eine Person liest den Abschnitt laut vor.
        </p>
      );
    case 1:
      return (
        <>
          <p>{TALK_STEPS[1].prompt}</p>
          {notes && (
            <p class="talk-extra">
              <span>Zum Hintergrund</span>
              {notes.background}
            </p>
          )}
        </>
      );
    case 2:
      return <p class="talk-big">{notes?.question ?? TALK_STEPS[2].prompt}</p>;
    default:
      return (
        <>
          <p>{TALK_STEPS[3].prompt}</p>
          {notes && (
            <p class="talk-extra">
              <span>Zum Weiterlesen</span>
              <b>{notes.crossRef.ref}</b> – {notes.crossRef.note}
            </p>
          )}
        </>
      );
  }
}

/** Gespräch nach dem Spiel: Die Leitung führt, alle Handys und die Leinwand zeigen denselben Schritt. */
function TalkScreen({ view, conn, talk, display }: { view: RoomView; conn: RoomConnection; talk: TalkView; display: boolean }) {
  const isHost = Boolean(view.me?.isHost) && !display;
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastStep = TALK_STEPS.length - 1;
  const act = async (action: Parameters<RoomConnection['act']>[0]) => {
    setError(null);
    try {
      await conn.act(action);
      setChoosing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };

  return (
    <section class={`phase talk stack-lg${display ? ' is-display' : ''}`}>
      <header class="talk-head">
        <p class="eyebrow">
          Vom Spiel ins Gespräch · Schritt {talk.step + 1} von {TALK_STEPS.length}
        </p>
        <h1>{TALK_STEPS[talk.step].title}</h1>
      </header>

      <article class="talk-question" style={{ '--g': `var(--g-${talk.group})` }}>
        <span class="book-chip">{talk.book}</span>
        <p class="talk-prompt">
          <QuestionText prompt={talk.prompt} fill={talk.answer} />
        </p>
        <p class="talk-answer">
          <span aria-hidden="true">✓</span> {upperFirst(talk.answer)}
        </p>
        <p class="talk-ref">{talk.ref}</p>
        {talk.voted > 0 && (
          <p class="muted small">
            {talk.missed} von {talk.voted} lagen beim Raten daneben.
          </p>
        )}
      </article>

      <ol class="talk-steps">
        {TALK_STEPS.map((s, i) => (
          <li class={`talk-step${i === talk.step ? ' is-current' : ''}${i < talk.step ? ' is-done' : ''}`}>
            <span class="talk-step-num" aria-hidden="true">
              {i < talk.step ? '✓' : i + 1}
            </span>
            <div class="talk-step-main">
              <p class="talk-step-title">{s.title}</p>
              {i === talk.step && (
                <div class="talk-step-body">
                  <TalkStepBody index={i} talk={talk} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}

      {isHost ? (
        <footer class="talk-controls stack">
          <div class="row">
            <Button variant="secondary" disabled={talk.step === 0} onClick={() => act({ type: 'talkStep', step: talk.step - 1 })}>
              Zurück
            </Button>
            {talk.step < lastStep ? (
              <Button variant="gold" onClick={() => act({ type: 'talkStep', step: talk.step + 1 })}>
                Weiter
              </Button>
            ) : (
              <Button variant="gold" onClick={() => act({ type: 'talkEnd' })}>
                Gespräch beenden
              </Button>
            )}
          </div>
          <Button variant="ghost" small onClick={() => setChoosing((c) => !c)}>
            {choosing ? 'Bei dieser Frage bleiben' : 'Andere Frage besprechen'}
          </Button>
          {choosing && (
            <ul class="talk-choices">
              {view.final!.discoveries.map((d) => (
                <li>
                  <button
                    type="button"
                    class={`talk-choice${d.questionId === talk.questionId ? ' is-on' : ''}`}
                    onClick={() => act({ type: 'talk', questionId: d.questionId })}
                  >
                    <span class="talk-choice-q">
                      <QuestionText prompt={d.prompt} />
                    </span>
                    <span class="muted small">
                      {d.ref}
                      {d.voted > 0 ? ` · ${d.missed} von ${d.voted} daneben` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {talk.step < lastStep && (
            <Button variant="ghost" small onClick={() => act({ type: 'talkEnd' })}>
              Zurück zum Endstand
            </Button>
          )}
        </footer>
      ) : (
        !display && <p class="muted small center">Die Spielleitung führt durch das Gespräch.</p>
      )}
    </section>
  );
}
