import { useEffect, useRef, useState } from 'preact/hooks';
import { BLUFF_MAX } from '../../shared/rules';
import type { RoomView } from '../../shared/types';
import { Button, Progress, QuestionCard, Timer } from '../components/ui';
import { type RoomConnection, useServerNow } from '../lib/hooks';

const LETTERS = 'ABCDEFGHIJKLMN';

export function WritePhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const me = view.me;
  const canWrite = Boolean(me?.plays) && !display;
  const quiet = canWrite && me?.quiet === 'now';
  const [text, setText] = useState(round.myBluff ?? '');
  const [editing, setEditing] = useState(!round.myBluff);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoSent = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const now = useServerNow(500);

  // Neue Frage → Eingabe zurücksetzen
  useEffect(() => {
    setText(round.myBluff ?? '');
    setEditing(!round.myBluff);
    setError(null);
    autoSent.current = false;
  }, [round.index, round.question.id]);

  // Kurz vor Schluss: einen fertigen, aber noch nicht abgeschickten Entwurf retten
  useEffect(() => {
    if (!canWrite || quiet || !editing || autoSent.current || view.paused || round.deadline === null) return;
    const draft = text.trim();
    if (!draft || draft === round.myBluff || round.deadline - now > 1500) return;
    autoSent.current = true;
    conn
      .act({ type: 'bluff', text: draft })
      .then(() => setEditing(false))
      .catch(() => {});
  }, [now]);

  const submit = async () => {
    if (!text.trim()) return setError('Schreib zuerst einen Bluff.');
    setBusy(true);
    setError(null);
    try {
      await conn.act({ type: 'bluff', text });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abgabe fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const suggest = async () => {
    setError(null);
    try {
      const res = await conn.act({ type: 'suggest' });
      if (res.suggestion) {
        setText(res.suggestion);
        setEditing(true);
        inputRef.current?.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kein Vorschlag verfügbar.');
    }
  };

  if (quiet) return <QuietScreen view={view} conn={conn} />;

  return (
    <section class="phase write stack">
      <PhaseHead view={view} title="Bluff schreiben" />
      <QuestionCard question={round.question} big={display} />

      {canWrite &&
        (editing ? (
          <form
            class="bluff-form stack"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label class="field">
              <span>Deine erfundene Antwort</span>
              <textarea
                ref={inputRef}
                value={text}
                maxLength={BLUFF_MAX}
                rows={2}
                placeholder="Glaubwürdig, aber falsch …"
                onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                enterkeyhint="send"
                autocomplete="off"
              />
              <small class="counter">
                {text.length}/{BLUFF_MAX}
              </small>
            </label>
            {error && (
              <p class="error" role="alert">
                {error}
              </p>
            )}
            <div class="bluff-actions">
              <Button type="submit" block disabled={busy || !text.trim()}>
                {round.myBluff ? 'Änderung abgeben' : 'Bluff abgeben'}
              </Button>
              {round.mySuggestion ? (
                <p class="muted small suggest-used">Den Vorschlag für diese Runde hast du schon bekommen.</p>
              ) : (
                <Button variant="ghost" small onClick={suggest}>
                  Keine Idee? Vorschlag nehmen
                </Button>
              )}
            </div>
            <p class="muted small">Jede Person, die auf deinen Bluff hereinfällt, bringt dir einen Punkt.</p>
          </form>
        ) : (
          <div class="submitted pop">
            <p class="eyebrow">Dein Bluff ist drin ✓</p>
            <p class="submitted-text">„{round.myBluff}“</p>
            <Button variant="ghost" small onClick={() => setEditing(true)}>
              Noch ändern
            </Button>
          </div>
        ))}

      <Progress players={view.players} label="Bluffs abgegeben" />
      {canWrite && <QuietOffer conn={conn} />}
    </section>
  );
}

export function VotePhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const canVote = Boolean(view.me?.plays) && !display;
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (canVote && view.me?.quiet === 'now') return <QuietScreen view={view} conn={conn} />;

  const vote = async (optionId: string) => {
    setPending(optionId);
    setError(null);
    try {
      await conn.act({ type: 'vote', optionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stimme nicht angekommen.');
    } finally {
      setPending(null);
    }
  };

  return (
    <section class="phase vote stack">
      <PhaseHead view={view} title="Welche Antwort stimmt?" />
      <QuestionCard question={round.question} big={display} />
      <ul class={`options${display ? ' is-display' : ''}`}>
        {round.options!.map((o, i) => {
          const chosen = (pending ?? round.myVote) === o.id;
          return (
            <li>
              <button
                type="button"
                class={`option${o.mine ? ' is-mine' : ''}${chosen ? ' is-chosen' : ''}`}
                disabled={!canVote || o.mine}
                aria-pressed={chosen}
                onClick={() => vote(o.id)}
              >
                <span class="option-letter">{LETTERS[i]}</span>
                <span class="option-text">{o.text}</span>
                {o.mine && <span class="option-tag">Dein Bluff</span>}
                {chosen && !o.mine && <span class="option-tag is-check">Deine Wahl</span>}
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
      {canVote && (
        <p class="muted small center">
          {round.myVote ? 'Du kannst bis zum Ende noch umentscheiden.' : 'Tippe auf die Antwort, die du für wahr hältst.'}
        </p>
      )}
      <Progress players={view.players} label="Stimmen abgegeben" />
      {canVote && <QuietOffer conn={conn} />}
    </section>
  );
}

/** Gebetsimpulse für die ruhige Minute – je Runde ein anderer */
const PRAYER_PROMPTS = [
  'Danke Gott für etwas, das dich heute gefreut hat.',
  'Bring einen Menschen vor Gott, der dir gerade am Herzen liegt.',
  'Sag Gott ehrlich, was dich gerade beschäftigt.',
  'Bitte um Frieden für jemanden, mit dem es gerade schwierig ist.',
  'Danke für die Menschen hier im Raum – einzeln, mit Namen.',
  'Sei einfach still und lass Gott Gott sein.',
];

/** „Ruhige Minute“: Diese Person setzt die Runde aus und nimmt sich Zeit zum Beten. */
export function QuietScreen({ view, conn }: { view: RoomView; conn: RoomConnection }) {
  const round = view.round!;
  const [error, setError] = useState<string | null>(null);
  const back = async () => {
    setError(null);
    try {
      await conn.act({ type: 'quiet', on: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };
  return (
    <section class="phase quiet-screen stack" aria-live="polite">
      <div class="quiet-breath" aria-hidden="true" />
      <p class="eyebrow">
        Runde {round.index + 1} von {round.total} · Ruhige Minute
      </p>
      <h1 class="quiet-title">Zeit für ein Gebet</h1>
      <blockquote class="quiet-verse">
        „Seid stille und erkennet, dass ich Gott bin!“
        <cite>Psalm 46,11</cite>
      </blockquote>
      <p class="quiet-prompt">{PRAYER_PROMPTS[round.index % PRAYER_PROMPTS.length]}</p>
      <p class="muted small">Die anderen spielen diese Runde ohne dich weiter. Zur Auflösung bist du wieder dabei.</p>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <Button variant="secondary" onClick={back}>
        Zurück ins Spiel
      </Button>
    </section>
  );
}

/** Dezentes Angebot am Ende der Spielphasen: eine Runde aussetzen, um zu beten */
export function QuietOffer({ conn, next = false }: { conn: RoomConnection; next?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setError(null);
    try {
      await conn.act({ type: 'quiet', on: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };
  return (
    <div class="quiet-offer">
      <Button variant="ghost" small onClick={start}>
        Ruhige Minute
      </Button>
      <span class="muted small">{next ? 'Die nächste Runde aussetzen, um zu beten.' : 'Diese Runde aussetzen, um zu beten.'}</span>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function PhaseHead({ view, title }: { view: RoomView; title: string }) {
  const round = view.round!;
  return (
    <header class="phase-head">
      <div>
        <p class="eyebrow">
          Runde {round.index + 1} von {round.total}
        </p>
        <h1 class="phase-title">{title}</h1>
      </div>
      <Timer start={round.phaseStartedAt} deadline={round.deadline} pausedAt={view.paused?.at ?? null} />
    </header>
  );
}
