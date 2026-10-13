import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { BOT_NAME, POINTS_FAVORITE, POINTS_GIFT, TALK_STEPS, heartRoundAhead } from '../../shared/rules';
import type { AwardView, RoomView, TalkNotes, TalkView } from '../../shared/types';
import { BluffStory } from '../components/BluffStory';
import { WeekVerseCard } from '../components/WeekVerse';
import { QRCode } from '../components/QR';
import { Avatar, Button, ConfirmButton, QuestionText, Toast, formatSeconds, upperFirst } from '../components/ui';
import { api } from '../lib/api';
import { type RoomConnection, useServerNow } from '../lib/hooks';
import { currentLang, langQuery, locale, t, tj } from '../lib/i18n';
import { navigate, recapUrl } from '../lib/router';
import { shareLink } from '../lib/share';
import { QuietOffer } from './Play';

export function ScoresPhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const answer = round.answer!;
  const now = useServerNow(500);
  const isHost = Boolean(view.me?.isHost) && !display;
  const last = round.index + 1 >= round.total;
  // Nach der letzten Runde kommt – wenn eingeschaltet – erst die Herzensrunde, dann der Endstand
  const heartNext = last && heartRoundAhead(view.settings, view.players);
  const upcoming = !last ? t('Nächste Runde') : heartNext ? t('Herzensrunde') : t('Endstand');
  const left = round.deadline ? round.deadline - (view.paused?.at ?? now) : 0;
  const results = new Map((round.results ?? []).map((r) => [r.playerId, r]));
  const ranked = view.players
    .filter((p) => p.plays)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, locale()));
  const me = display ? null : view.me;
  const mine = me?.plays ? results.get(me.id) : null;
  const gain = mine ? mine.truth + mine.bluff + mine.favorite + mine.giftsIn.length * POINTS_GIFT - (mine.giftOut ? POINTS_GIFT : 0) : 0;
  const [toast, setToast] = useState<string | null>(null);

  // „Liebe deinen Nächsten“: Beschenkte bekommen einen Hinweis
  const giftsForMe = (me && results.get(me.id)?.giftsIn) || [];
  const announced = useRef(new Set<string>());
  useEffect(() => {
    const fresh = giftsForMe.filter((p) => !announced.current.has(`${round.index}:${p.id}`));
    if (!fresh.length) return;
    fresh.forEach((p) => announced.current.add(`${round.index}:${p.id}`));
    const names = fresh.map((p) => p.name).join(' & ');
    setToast(fresh.length === 1 ? t('{names} hat dir einen Punkt geschenkt ♥', { names }) : t('{names} haben dir einen Punkt geschenkt ♥', { names }));
  }, [giftsForMe.map((p) => p.id).join(','), round.index]);

  return (
    <section class={`phase scores stack${display ? ' is-display' : ''}`}>
      <article class="discovery pop">
        <p class="eyebrow">{t('Runde {n} von {total} · Auflösung', { n: round.index + 1, total: round.total })}</p>
        <h2 class="discovery-question">
          <QuestionText prompt={round.question.prompt} fill={answer.text} />
        </h2>
        <p class="eyebrow answer-label">{t('Richtige Antwort')}</p>
        <p class="discovery-answer">
          <span aria-hidden="true">✓</span> {upperFirst(answer.text)}
        </p>
        <p class="discovery-ref">{answer.ref}</p>
      </article>

      {mine && (
        <section class="round-gain" aria-live="polite">
          <div><p class="eyebrow">{t('Dein Punktegewinn')}</p><strong>{gain >= 0 ? '+' : ''}{gain} <span>{Math.abs(gain) === 1 ? t('Punkt') : t('Punkte')}</span></strong></div>
          <div class="round-gain-total">{t('Insgesamt {n} Punkte', { n: view.players.find((p) => p.id === me?.id)?.score ?? 0 })}</div>
          {mine.favorite > 0 && <p class="muted small">{t('Mit +{n} für deinen Lieblingsbluff – noch vorläufig.', { n: mine.favorite })}</p>}
          {mine.quiet && <p class="muted small">{t('Ruhige Minute')}</p>}
        </section>
      )}

      <footer class="next-bar">
        {isHost ? (
          <Button variant="gold" block onClick={() => conn.act({ type: 'next' })}>
            {!last ? t('Nächste Runde') : heartNext ? t('Zur Herzensrunde') : t('Zum Endstand')}
          </Button>
        ) : null}
        {round.deadline && (
          <p class="muted small center">
            {view.paused
              ? t('Pausiert.')
              : isHost
                ? t('{next} automatisch in {time}.', { next: upcoming, time: formatSeconds(left) })
                : t('{next} automatisch in {time} – oder wenn die Spielleitung weitertippt.', { next: upcoming, time: formatSeconds(left) })}
          </p>
        )}
      </footer>

      <details class="card result-fold" open={display}>
        <summary>{t('Entdeckung')}</summary>
        <div class="merksatz">
          <span class="merksatz-label">{t('Entdeckung')}</span>
          <p>{answer.discovery}</p>
        </div>
      </details>

      {round.talk && isHost && <TalkNotesCard notes={round.talk} open={false} />}

      <details class="card scoreboard result-fold" open={display}>
        <summary>{t('Punktestand')}</summary>
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
                      <span class="delta is-truth" title={t('Wahrheit erkannt')}>
                        ✓ +{r.truth}
                      </span>
                    )}
                    {r && r.bluff > 0 && (
                      <span class="delta is-bluff" title={t('Mitspielende reingelegt')}>
                        Bluff +{r.bluff}
                      </span>
                    )}
                    {r && r.favorite > 0 && (
                      <span class="delta is-favorite" title={t('Lieblingsbluff mit den meisten Herzen')}>
                        ♥ +{r.favorite}
                      </span>
                    )}
                    {r?.giftsIn.map((from) => (
                      <span class="delta is-gift" title={t('Liebe deinen Nächsten')}>
                        {t('+{n} von {name}', { n: POINTS_GIFT, name: from.name })}
                      </span>
                    ))}
                    {r?.giftOut && (
                      <span class="delta is-given" title={t('Liebe deinen Nächsten')}>
                        {t('−{n} an {name}', { n: POINTS_GIFT, name: r.giftOut.name })}
                      </span>
                    )}
                    {r?.quiet && (
                      <span class="delta is-quiet" title={t('Hat diese Runde ausgesetzt, um zu beten')}>
                        ☾ {t('Ruhige Minute')}
                      </span>
                    )}
                  </span>
                </span>
                <span class="score-total">{p.score}</span>
              </li>
            );
          })}
        </ol>
      </details>

      <details class="card result-fold round-extras" open={display}>
        <summary>{t('Bluffs und Extras')}</summary>
        <FavoritesCard view={view} conn={conn} display={display} />

        {me?.plays && <GiftCard view={view} conn={conn} />}

      {me?.plays &&
        !last &&
        (me.quiet === 'next' ? (
          <div class="quiet-offer is-set">
            <span>☾ {t('Du setzt die nächste Runde aus, um zu beten.')}</span>
            <Button variant="ghost" small onClick={() => conn.act({ type: 'quiet', on: false }).catch(() => {})}>
              {t('Doch mitspielen')}
            </Button>
          </div>
        ) : (
          <QuietOffer conn={conn} next />
        ))}

      </details>
      <Toast message={toast} onDone={() => setToast(null)} />
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
          <span aria-hidden="true">♥</span> {tj('Du hast {name} einen Punkt geschenkt.', { name: <b>{given.name}</b> })}
        </p>
        <p class="muted small">{t('„Liebe deinen Nächsten wie dich selbst.“ Markus 12,31')}</p>
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
      setError(err instanceof Error ? err.message : t('Das Geschenk kam nicht an.'));
    }
  };

  return (
    <section class="gift">
      {choosing ? (
        <>
          <p class="gift-ask">{t('Wem schenkst du einen Punkt?')}</p>
          <div class="gift-people">
            {others.map((p) => (
              <button type="button" class="gift-person" onClick={() => give(p.id)}>
                <Avatar person={p} size="sm" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" small onClick={() => setChoosing(false)}>
            {t('Doch nicht')}
          </Button>
        </>
      ) : (
        <>
          <Button variant="secondary" block disabled={own < POINTS_GIFT} onClick={() => setChoosing(true)}>
            ♥ {t('Liebe deinen Nächsten')}
          </Button>
          <p class="muted small center">
            {own < POINTS_GIFT
              ? t('Sobald du einen Punkt hast, kannst du ihn verschenken.')
              : t('Schenke einen deiner Punkte – einmal pro Runde.')}
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
        <span class="talk-notes-title">{t('Spickzettel für die Leitung')}</span>
        <span class="muted small">{t('nur auf deinem Gerät')}</span>
      </summary>
      <dl>
        <dt>{t('Hintergrund')}</dt>
        <dd>{notes.background}</dd>
        <dt>{t('Fragt doch mal')}</dt>
        <dd>{notes.question}</dd>
        <dt>{t('Querverweis')}</dt>
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
      setError(err instanceof Error ? err.message : t('Herz nicht angekommen.'));
    } finally {
      setPending(undefined);
    }
  };

  return (
    <section class="card favorites">
      <h2 class="card-title">{t('Lieblingsbluff')}</h2>
      <p class="muted small favorites-hint">
        {canLike
          ? t('Welcher Bluff hat euch am besten gefallen? Die meisten Herzen bringen +{n} Punkt.', { n: POINTS_FAVORITE })
          : t('Die meisten Herzen bringen +{n} Punkt.', { n: POINTS_FAVORITE })}
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
                <span class="fav-text">{t('„{text}“', { text: item.text })}</span>
                <span class="fav-by">
                  {item.authors.map((a) => (
                    <Avatar person={a} size="sm" />
                  ))}
                  {item.mine ? t('Dein Bluff') : item.authors.map((a) => a.name).join(' & ')}
                  {item.leading && <span class="badge">{t('Vorn')}</span>}
                </span>
                <span class="fav-heart" aria-label={count === 1 ? t('1 Herz') : t('{n} Herzen', { n: count })}>
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
  const mine = !display ? final.ranking.find((p) => p.id === view.me?.id) : null;
  const favourite = final.awards.find((a) => a.key === 'favorite');
  const otherAwards = final.awards.filter((a) => a.key !== 'favorite');
  if (final.talk) return <TalkScreen view={view} conn={conn} talk={final.talk} display={display} />;

  return (
    <section class={`phase final stack${display ? ' is-display' : ''}`}>
      <section class="card final-overview stack">
        <header class="final-head">
          <div class="final-heading">
            <p class="eyebrow">{t('Partie beendet')}</p>
            <h1>{t('Endstand')}</h1>
          </div>
          {display && <RecapShare view={view} display />}
        </header>

        <div class="podium" aria-label={t('Siegertreppchen')}>
          {order.map((p) => (
            <div class={`podium-place place-${p.rank}${p.id === mine?.id ? ' is-me' : ''}`}>
              <Avatar person={p} size="lg" />
              <span class="podium-name">{p.name}</span>
              <span class="podium-score">{p.score === 1 ? t('1 Punkt') : t('{n} Punkte', { n: p.score })}</span>
              <span class="podium-block">{p.rank}</span>
            </div>
          ))}
        </div>

        {mine && (
          <div class="final-personal">
            <div><p class="eyebrow">{t('Dein Ergebnis')}</p><strong>{t('Platz {n}', { n: mine.rank })}</strong></div>
            <span>{mine.score === 1 ? t('1 Punkt') : t('{n} Punkte', { n: mine.score })}</span>
          </div>
        )}

        {!display && (
          <div class="final-actions stack">
            {isHost ? (
              <>
                {withBot && <><h2 class="card-title">{t('Jetzt mit Freunden spielen')}</h2><Button variant="gold" block onClick={() => navigate('/neu')}>{t('Raum für Freunde eröffnen')}</Button></>}
                <Button variant={withBot ? 'secondary' : 'gold'} block onClick={() => conn.act({ type: 'playAgain' })}>
                  {withBot ? t('Nochmal gegen {bot}', { bot: BOT_NAME }) : t('Neue Partie mit allen')}
                </Button>
              </>
            ) : (
              <>
                <p class="muted small center">{t('Vielleicht startet die Spielleitung gleich eine neue Partie …')}</p>
                <Button variant="gold" block onClick={() => navigate('/neu')}>{t('Eigenen Raum eröffnen')}</Button>
              </>
            )}
          </div>
        )}
      </section>

      {favourite && <FinalAward award={favourite} display={display} />}

      <section class="card final-sections">
        {final.ranking.length > 3 && (
          <FinalFold title={t('Alle Platzierungen')} meta={String(final.ranking.length)} className="final-ranking" open={display}>
            <ol class="ranking">
              {final.ranking.map((p) => (
                <li class={p.id === view.me?.id ? 'is-me' : ''}>
                  <span class="rank">{p.rank}.</span><Avatar person={p} size="sm" />
                  <span class="score-name">{p.name}</span><span class="score-total">{p.score}</span>
                </li>
              ))}
            </ol>
          </FinalFold>
        )}

        {otherAwards.length > 0 && (
          <FinalFold title={t('Weitere Auszeichnungen')} meta={String(otherAwards.length)} className="final-awards" open={display}>
            <div class="awards">{otherAwards.map((a) => <FinalAward award={a} display={display} />)}</div>
          </FinalFold>
        )}

        {final.discoveries.length > 0 && (
          <FinalFold title={t('Entdeckungen zum Nachlesen')} meta={String(final.discoveries.length)} className="final-discoveries" open={display}>
            <div class="discoveries">
              <ol>
                {final.discoveries.map((d) => (
                  <li>
                    <p class="d-ref">{d.ref}</p>
                    <p class="d-q"><QuestionText prompt={d.prompt} fill={d.answer} /></p>
                    <p class="d-a">✓ {upperFirst(d.answer)}</p>
                    <p class="d-text">{d.discovery}</p>
                  </li>
                ))}
              </ol>
              {!display && <RecapShare view={view} display={false} />}
            </div>
          </FinalFold>
        )}

        {isHost && final.discoveries.length > 0 && (
          <FinalFold title={t('Vom Spiel ins Gespräch')} className="final-talk">
            <p class="muted small">{t('Die Frage, bei der die meisten danebenlagen, in vier Schritten vertiefen: Lesen, Entdecken, Nachfragen, Mitnehmen. Alle Handys und die Leinwand gehen mit.')}</p>
            <Button block onClick={() => conn.act({ type: 'talk' })}>{t('Weiter ins Gespräch')}</Button>
          </FinalFold>
        )}

        {!display && final.discoveries.length > 0 && (
          <FinalFold title={t('Mein Vers für die Woche')} className="final-verse">
            <WeekVerseCard items={final.discoveries.map((d) => ({ book: d.book, group: d.group, key: d.questionId }))} />
          </FinalFold>
        )}

        {!display && (
          <div class="final-curious">
            <a class="btn btn-ghost btn-block" href={`/jesus${langQuery()}`} target="_blank" rel="noopener">
              {t('Neugierig auf Jesus?')} <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
      </section>

      {!display && (
        <footer class="final-footer">
          <Button variant="ghost" small onClick={() => navigate('/')}>{t('Zur Startseite')}</Button>
          {!isHost && <ShareGameButton />}
          {isHost && <ConfirmButton variant="ghost" small confirm={t('Wirklich schließen? Nochmal tippen')} onConfirm={() => conn.act({ type: 'close' })}>{t('Raum schließen')}</ConfirmButton>}
        </footer>
      )}
    </section>
  );
}

/** Ein Lachmoment bleibt sichtbar; alle weiteren Auszeichnungen stehen im aufklappbaren Bereich. */
function FinalAward({ award: a, display }: { award: AwardView; display: boolean }) {
  return (
    <article class={`award award-${a.key}`}>
      <p class="award-title">{a.title}</p>
      {a.quote && <p class="award-quote">{t('„{text}“', { text: a.quote })}</p>}
      <p class="award-people">{a.players.map((p) => p.name).join(' & ')}</p>
      <p class="award-text">{a.quote ? a.value === 1 ? t('♥ 1 Herz in einer Runde') : t('♥ {n} Herzen in einer Runde', { n: a.value }) : `${upperFirst(a.text)} · ${a.value}×`}</p>
      {a.key === 'favorite' && !display && <BluffStory award={a} />}
    </article>
  );
}

function FinalFold({ title, meta, className, open = false, children }: {
  title: string; meta?: string; className: string; open?: boolean; children: ComponentChildren;
}) {
  return (
    <details class={`final-section ${className}`} open={open}>
      <summary><span>{title}</span>{meta && <small class="final-count">{meta}</small>}<span class="final-fold-mark" aria-hidden="true" /></summary>
      <div class="final-section-content stack">{children}</div>
    </details>
  );
}

/** Den Spiellink weitergeben, ohne die Jesus-Infoseite hinter zusätzlichen Aktionen zu verstecken. */
function ShareGameButton() {
  const [toast, setToast] = useState<string | null>(null);
  const share = async () =>
    setToast(
      await shareLink({
        title: 'Bible Bluff',
        text: t('Kennt ihr Bible Bluff? Alle erfinden Antworten auf eine Bibelfrage – wer findet die echte? Lasst uns das mal zusammen spielen!'),
        // Auf Englisch mit ?lang=en – dann zeigen Vorschau und Startseite gleich Englisch
        url: `${location.origin}/${langQuery()}`,
      }),
    );
  return (
    <>
      <Button variant="ghost" small onClick={share}>{t('Link an deine Gruppe schicken')}</Button>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
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
  const url = id ? recapUrl(id, currentLang()) : null;

  if (display) {
    return url ? (
      <div class="recap-share is-display">
        <QRCode value={url} label={t('QR-Code zur Entdeckungen-Seite')} />
        <p>
          <b>{t('Entdeckungen zum Mitnehmen')}</b>
          <span>{t('Scannen: alle Fragen, Antworten und Bibelstellen auf einer eigenen Seite.')}</span>
        </p>
      </div>
    ) : null;
  }

  const share = async () => {
    if (!url) return;
    setToast(
      await shareLink({
        title: t('Bible Bluff – unsere Entdeckungen'),
        text: t('{n} Entdeckungen aus der Bibel, die wir beim Bible Bluff gemacht haben:', { n: view.final!.discoveries.length }),
        url,
      }),
    );
  };
  return (
    <div class="recap-share">
      <p class="muted small">{t('Alle Fragen, Antworten und Bibelstellen auf einer eigenen Seite – sie bleibt, auch wenn der Raum geschlossen ist.')}</p>
      <div class="row">
        <Button variant="gold" onClick={share} disabled={!url}>
          {url ? t('Entdeckungen teilen') : t('Seite wird vorbereitet …')}
        </Button>
        {url && (
          <Button variant="secondary" onClick={() => navigate(`/e/${id}`)}>
            {t('Ansehen')}
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
        <p>{tj('Schlagt {ref} auf. Eine Person liest den Abschnitt laut vor.', { ref: <b>{talk.ref}</b> })}</p>
      );
    case 1:
      return (
        <>
          <p>{t(TALK_STEPS[1].prompt)}</p>
          {notes && (
            <p class="talk-extra">
              <span>{t('Zum Hintergrund')}</span>
              {notes.background}
            </p>
          )}
        </>
      );
    case 2:
      return <p class="talk-big">{notes?.question ?? t(TALK_STEPS[2].prompt)}</p>;
    default:
      return (
        <>
          <p>{t(TALK_STEPS[3].prompt)}</p>
          {notes && (
            <p class="talk-extra">
              <span>{t('Zum Weiterlesen')}</span>
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
      setError(err instanceof Error ? err.message : t('Das ging nicht.'));
    }
  };

  return (
    <section class={`phase talk stack-lg${display ? ' is-display' : ''}`}>
      <header class="talk-head">
        <p class="eyebrow">{t('Vom Spiel ins Gespräch · Schritt {n} von {total}', { n: talk.step + 1, total: TALK_STEPS.length })}</p>
        <h1>{t(TALK_STEPS[talk.step].title)}</h1>
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
          <p class="muted small">{t('{missed} von {voted} lagen beim Raten daneben.', { missed: talk.missed, voted: talk.voted })}</p>
        )}
      </article>

      <ol class="talk-steps">
        {TALK_STEPS.map((s, i) => (
          <li class={`talk-step${i === talk.step ? ' is-current' : ''}${i < talk.step ? ' is-done' : ''}`}>
            <span class="talk-step-num" aria-hidden="true">
              {i < talk.step ? '✓' : i + 1}
            </span>
            <div class="talk-step-main">
              <p class="talk-step-title">{t(s.title)}</p>
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
              {t('Zurück')}
            </Button>
            {talk.step < lastStep ? (
              <Button variant="gold" onClick={() => act({ type: 'talkStep', step: talk.step + 1 })}>
                {t('Weiter')}
              </Button>
            ) : (
              <Button variant="gold" onClick={() => act({ type: 'talkEnd' })}>
                {t('Gespräch beenden')}
              </Button>
            )}
          </div>
          <Button variant="ghost" small onClick={() => setChoosing((c) => !c)}>
            {choosing ? t('Bei dieser Frage bleiben') : t('Andere Frage besprechen')}
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
                      {d.voted > 0 ? ` · ${t('{missed} von {voted} daneben', { missed: d.missed, voted: d.voted })}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {talk.step < lastStep && (
            <Button variant="ghost" small onClick={() => act({ type: 'talkEnd' })}>
              {t('Zurück zum Endstand')}
            </Button>
          )}
        </footer>
      ) : (
        !display && <p class="muted small center">{t('Die Spielleitung führt durch das Gespräch.')}</p>
      )}
    </section>
  );
}
