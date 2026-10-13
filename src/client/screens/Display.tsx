import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { heartRoundAhead } from '../../shared/rules';
import type { PersonRef, RevealStepView, RoomView } from '../../shared/types';
import { Avatar, Button, QuestionText, formatSeconds, upperFirst } from '../components/ui';
import { useServerNow } from '../lib/hooks';
import { locale, t } from '../lib/i18n';

/** Zusätzliche Inhalte wechseln als ganze Ansichten. Anhalten betrifft nur die Anzeige. */
function usePages(count: number, paused: boolean, interval = 10_000) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (count < 2 || paused || held) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearInterval(timer);
  }, [count, paused, held, interval]);
  return { index: index % Math.max(1, count), held, select: (next: number) => setIndex(next), toggle: () => setHeld((v) => !v), move: (by: number) => setIndex((i) => (i + by + count) % count) };
}

function PageControls({ pages, count }: { pages: ReturnType<typeof usePages>; count: number }) {
  if (count < 2) return null;
  return (
    <nav class="display-controls" aria-label={t('Leinwand-Ansichten')}>
      <Button small variant="ghost" label={t('Vorherige Ansicht')} onClick={() => pages.move(-1)}>←</Button>
      <span>{t('Ansicht {n} von {total}', { n: pages.index + 1, total: count })}</span>
      <Button small variant="ghost" label={t('Nächste Ansicht')} onClick={() => pages.move(1)}>→</Button>
      <Button small variant="ghost" onClick={pages.toggle}>{pages.held ? t('Anzeige fortsetzen') : t('Anzeige anhalten')}</Button>
    </nav>
  );
}

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

function Ranking({ people }: { people: (PersonRef & { score: number; rank: number })[] }) {
  return (
    <ol class={`display-ranking${people.length > 6 ? ' has-many' : ''}`}>
      {people.map((p) => (
        <li class="score-row" key={p.id}>
          <span class="rank">{p.rank}.</span><Avatar person={p} size="sm" />
          <span class="score-name">{p.name}</span><strong class="score-total">{p.score}</strong>
        </li>
      ))}
    </ol>
  );
}

export function DisplayScores({ view }: { view: RoomView }) {
  const round = view.round!;
  const answer = round.answer!;
  const now = useServerNow(500);
  const last = round.index + 1 >= round.total;
  const next = !last ? t('Nächste Runde') : heartRoundAhead(view.settings, view.players) ? t('Herzensrunde') : t('Endstand');
  const ranked = view.players.filter((p) => p.plays).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, locale()));
  const people = ranked.map((p) => ({ ...p, rank: 1 + ranked.filter((other) => other.score > p.score).length }));
  const items = [...(round.favorites ?? [])].sort((a, b) => b.likes - a.likes);
  const groups = chunks(items, 2);
  const pages = usePages(groups.length + 1, Boolean(view.paused), 6000);
  const leaders = items.filter((item) => item.leading).map((item) => item.optionId).join(',');
  useEffect(() => { if (leaders) pages.select(1); }, [leaders]);
  return (
    <section class="phase scores is-display display-screen">
      <header class="display-heading">
        <p class="eyebrow">{t('Runde {n} von {total} · Auflösung', { n: round.index + 1, total: round.total })}</p>
        {round.deadline && <p class="muted small">{view.paused ? t('Pausiert.') : t('{next} automatisch in {time}.', { next, time: formatSeconds(round.deadline - now) })}</p>}
      </header>
      <div class="display-score-grid">
        <article class="discovery display-answer">
          <h2 class="discovery-question"><QuestionText prompt={round.question.prompt} fill={answer.text} /></h2>
          <p class="eyebrow answer-label">{t('Richtige Antwort')}</p>
          <p class="discovery-answer">✓ {upperFirst(answer.text)}</p>
          <p class="discovery-ref">{answer.ref}</p>
        </article>
        <section class="card scoreboard display-scoreboard">
          <h2 class="card-title">{t('Punktestand')}</h2>
          <Ranking people={people} />
          <p class="muted small">{t('Herzen für euren Lieblingsbluff vergebt ihr auf dem Handy.')}</p>
        </section>
          <section class="card favorites display-favorites">
            <h2 class="card-title">{pages.index === 0 ? t('Entdeckung') : t('Lieblingsbluff')}</h2>
            {pages.index === 0 ? <p class="display-extra-text">{answer.discovery}</p> : <>
            <p class="muted small">{t('Die meisten Herzen bringen +{n} Punkt.', { n: 1 })}</p>
            <ul class="fav-list">
              {groups[pages.index - 1].map((item) => (
                <li key={item.optionId} class={`fav${item.leading ? ' is-leading' : ''}`}>
                  <span class="fav-text">{t('„{text}“', { text: item.text })}</span>
                  <span class="fav-author">{item.authors.map((p) => p.name).join(' & ')}</span>
                  <strong class="fav-count">♥ {item.likes}</strong>
                </li>
              ))}
            </ul>
            </>}
            <PageControls pages={pages} count={groups.length + 1} />
          </section>
      </div>
    </section>
  );
}

export function DisplayFinal({ view, recap }: { view: RoomView; recap: ComponentChildren }) {
  const final = view.final!;
  const slides: { title: string; body: ComponentChildren }[] = [{
    title: t('Alle Platzierungen'), body: <Ranking people={final.ranking} />,
  }];
  for (const group of chunks(final.awards, 2)) slides.push({
    title: t('Weitere Auszeichnungen'), body: <div class="display-awards">{group.map((a) => (
      <article key={a.key} class={`award award-${a.key}`}>
        <h3 class="award-title">{a.title}</h3>
        {a.quote && <p class="award-quote">{t('„{text}“', { text: a.quote })}</p>}
        <p class="award-people">{a.players.map((p) => p.name).join(' & ')}</p>
        <p class="award-text">{a.quote ? a.value === 1 ? t('♥ 1 Herz in einer Runde') : t('♥ {n} Herzen in einer Runde', { n: a.value }) : `${upperFirst(a.text)} · ${a.value}×`}</p>
      </article>
    ))}</div>,
  });
  for (const group of chunks(final.discoveries, 2)) slides.push({
    title: t('Entdeckungen zum Nachlesen'), body: <div class="display-discoveries">{group.map((d) => (
      <article key={d.questionId}>
        <p class="d-ref">{d.ref}</p><p class="d-q"><QuestionText prompt={d.prompt} fill={d.answer} /></p>
        <p class="d-a">✓ {upperFirst(d.answer)}</p><p class="d-text">{d.discovery}</p>
      </article>
    ))}</div>,
  });
  const pages = usePages(slides.length, Boolean(view.paused));
  return (
    <section class="phase final is-display display-screen">
      <header class="final-head display-heading"><div><p class="eyebrow">{t('Partie beendet')}</p><h1>{t('Endstand')}</h1></div></header>
      <div class="display-final-grid">
        <section class="card display-slide"><h2 class="card-title">{slides[pages.index].title}</h2>{slides[pages.index].body}</section>
        <aside class="card display-takeaway"><p class="eyebrow">{t('Raumcode')}</p><p class="display-room-code">{view.code}</p>{recap}</aside>
      </div>
      <PageControls pages={pages} count={slides.length} />
    </section>
  );
}

export function DisplayHeart({ view, onNext }: { view: RoomView; onNext?: () => Promise<void> }) {
  const heart = view.heart!;
  const groups = chunks(heart.answers ?? [], 2);
  const pages = usePages(groups.length, Boolean(view.paused));
  return (
    <section class="phase heart heart-show is-display display-screen">
      <header class="heart-show-head"><p class="eyebrow">{t('Herzensrunde · ohne Namen')}</p><h1 class="phase-title">{heart.question}</h1></header>
      {groups.length ? <ul class="heart-answers display-heart-answers">{groups[pages.index].map((text, i) => <li key={`${pages.index}-${i}`} class="heart-answer">{text}</li>)}</ul>
        : <p class="notice center">{t('Diesmal hat niemand etwas aufgeschrieben – auch das ist in Ordnung.')}</p>}
      <p class="muted center">{t('Danke für eure Ehrlichkeit.')}</p>
      <PageControls pages={pages} count={groups.length} />
      {onNext && <Button variant="gold" onClick={onNext}>{t('Zum Endstand')}</Button>}
    </section>
  );
}

export function DisplayRest({ step, paused }: { step: Extract<RevealStepView, { kind: 'rest' }>; paused: boolean }) {
  const groups = chunks(step.items, 4);
  const pages = usePages(groups.length, paused, 1700);
  return <div class="reveal-rest"><p class="reveal-label">{t('Darauf ist niemand hereingefallen')}</p><ul>{groups[pages.index].map((item) => (
    <li class="rest-item" key={item.text}><span class="rest-text">{item.text}</span><span class="rest-by">{item.authors.length ? item.authors.map((a) => <span class="rest-author"><Avatar person={a} size="sm" />{a.name}</span>) : <em>{t('vom Spiel')}</em>}</span></li>
  ))}</ul></div>;
}
