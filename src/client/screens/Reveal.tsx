// Die Aufdeckung – der gemeinsame Lach- und Überraschungsmoment.
// Alle Geräte rechnen den aktuellen Schritt aus der Server-Zeit aus und zeigen ihn gleichzeitig.

import { useEffect, useMemo } from 'preact/hooks';
import { POINTS_TRUTH, REVEAL_AUTHOR_AT_MS } from '../../shared/rules';
import type { RevealStepView, RoomView } from '../../shared/types';
import { Avatar, Button, PersonChip } from '../components/ui';
import { buzz, type RoomConnection, useServerNow } from '../lib/hooks';

export function RevealPhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const reveal = round.reveal!;
  const now = useServerNow(100);
  const reference = view.paused ? view.paused.at : now;
  const elapsed = Math.max(0, reference - reveal.startedAt);

  let index = 0;
  reveal.steps.forEach((s, i) => {
    if (s.at <= elapsed) index = i;
  });
  const step = reveal.steps[index];
  const local = elapsed - step.at;
  const meId = view.me?.id ?? null;
  const isHost = Boolean(view.me?.isHost) && !display;

  return (
    <section class={`phase reveal${display ? ' is-display' : ''}`} aria-live="polite">
      <header class="reveal-head">
        <p class="eyebrow">
          Runde {round.index + 1} von {round.total} · Aufdeckung
        </p>
        <p class="reveal-question">{round.question.prompt}</p>
      </header>

      <div class="reveal-stage" key={`${round.index}-${index}`}>
        {step.kind === 'intro' && <Intro />}
        {step.kind === 'bluff' && <BluffStep step={step} local={local} meId={meId} />}
        {step.kind === 'truth' && <TruthStep step={step} local={local} meId={meId} />}
        {step.kind === 'rest' && <RestStep step={step} meId={meId} />}
      </div>

      <footer class="reveal-foot">
        <div class="reveal-dots" aria-label={`Schritt ${index + 1} von ${reveal.steps.length}`}>
          {reveal.steps.map((s, i) => (
            <i class={`${i < index ? 'is-done' : ''}${i === index ? ' is-now' : ''}${s.kind === 'truth' ? ' is-truth' : ''}`} />
          ))}
        </div>
        {isHost && (
          <Button variant="ghost" small onClick={() => conn.act({ type: 'revealNext' }).catch(() => {})}>
            Weiter ›
          </Button>
        )}
      </footer>
    </section>
  );
}

function Intro() {
  return (
    <div class="reveal-intro">
      <p class="intro-kicker">Aufdeckung</p>
      <p class="intro-line">Wer ist worauf hereingefallen?</p>
      <div class="intro-cards" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function BluffStep({ step, local, meId }: { step: Extract<RevealStepView, { kind: 'bluff' }>; local: number; meId: string | null }) {
  const exposed = local >= REVEAL_AUTHOR_AT_MS;
  const house = step.authors.length === 0;
  const fell = Boolean(meId && step.voters.some((v) => v.id === meId));
  const mine = Boolean(meId && step.authors.some((a) => a.id === meId));

  useEffect(() => {
    if (exposed && mine) buzz([70, 50, 70]);
  }, [exposed, mine]);

  return (
    <div class={`reveal-card is-bluff${exposed ? ' is-exposed' : ''}`}>
      <div class="paper">
        <blockquote class="reveal-text">{step.text}</blockquote>
        {exposed && <div class={`stamp ${house ? 'stamp-house' : 'stamp-bluff'}`}>{house ? 'Hausbluff' : 'Geblufft!'}</div>}
      </div>

      <p class="reveal-label">Gewählt von</p>
      <div class="chips">
        {step.voters.map((v, i) => (
          <PersonChip person={v} delay={350 + i * 220} />
        ))}
      </div>

      {exposed && (
        <div class="reveal-author slide-up">
          {house ? (
            <p class="author-line">Vom Spiel erfunden – niemand von euch!</p>
          ) : (
            <>
              <p class="author-line">{step.authors.length > 1 ? 'Erfunden von gleich mehreren' : 'Erfunden von'}</p>
              <div class="chips">
                {step.authors.map((a, i) => (
                  <span class="author">
                    <PersonChip person={a} delay={i * 150} />
                    {step.pointsPerAuthor > 0 && <span class="plus float">+{step.pointsPerAuthor}</span>}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {exposed && fell && <p class="personal is-fooled">Du bist darauf hereingefallen 🙈</p>}
      {exposed && mine && (
        <p class="personal is-proud">
          Dein Bluff! {step.voters.length === 1 ? 'Eine Person' : `${step.voters.length} Personen`} reingelegt.
        </p>
      )}
    </div>
  );
}

function TruthStep({ step, local, meId }: { step: Extract<RevealStepView, { kind: 'truth' }>; local: number; meId: string | null }) {
  const exposed = local >= REVEAL_AUTHOR_AT_MS;
  const found = Boolean(meId && step.voters.some((v) => v.id === meId));
  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        angle: (i / 18) * 360 + (i % 3) * 7,
        dist: 70 + (i % 5) * 18,
        delay: (i % 6) * 40,
        hue: i % 3,
      })),
    [],
  );

  useEffect(() => {
    if (exposed && found) buzz(40);
  }, [exposed, found]);

  return (
    <div class={`reveal-card is-truth${exposed ? ' is-exposed' : ''}`}>
      <div class="paper">
        <blockquote class="reveal-text">{step.text}</blockquote>
        {exposed && <div class="stamp stamp-truth">Wahr!</div>}
        {exposed && (
          <div class="sparks" aria-hidden="true">
            {sparks.map((s) => (
              <i
                class={`spark h${s.hue}`}
                style={{ '--a': `${s.angle}deg`, '--d': `${s.dist}px`, animationDelay: `${s.delay}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <p class="reveal-label">{step.voters.length ? 'Richtig erkannt von' : 'Gewählt von'}</p>
      <div class="chips">
        {step.voters.length ? (
          step.voters.map((v, i) => <PersonChip person={v} delay={350 + i * 200} note={exposed ? `+${POINTS_TRUTH}` : undefined} />)
        ) : (
          <p class="nobody pop" style={{ animationDelay: '400ms' }}>
            Niemand hat die Wahrheit gefunden!
          </p>
        )}
      </div>

      {exposed && (
        <div class="reveal-author slide-up">
          <p class="ref-line">
            <span class="ref-icon" aria-hidden="true">
              ✦
            </span>
            {step.ref}
          </p>
        </div>
      )}
      {exposed && found && <p class="personal is-proud">Richtig! +{POINTS_TRUTH} für dich.</p>}
    </div>
  );
}

function RestStep({ step, meId }: { step: Extract<RevealStepView, { kind: 'rest' }>; meId: string | null }) {
  return (
    <div class="reveal-rest">
      <p class="reveal-label">Darauf ist niemand hereingefallen</p>
      <ul>
        {step.items.map((item, i) => (
          <li class="rest-item pop" style={{ animationDelay: `${i * 260}ms` }}>
            <span class="rest-text">{item.text}</span>
            <span class="rest-by">
              {item.authors.length ? (
                item.authors.map((a) => (
                  <span class="rest-author">
                    <Avatar person={a} size="sm" />
                    {a.id === meId ? 'du' : a.name}
                  </span>
                ))
              ) : (
                <em>vom Spiel</em>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
