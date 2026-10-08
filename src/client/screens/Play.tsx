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
  const [text, setText] = useState(round.myBluff ?? '');
  const [editing, setEditing] = useState(!round.myBluff);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const suggestCount = useRef(0);
  const autoSent = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const now = useServerNow(500);

  // Neue Frage → Eingabe zurücksetzen
  useEffect(() => {
    setText(round.myBluff ?? '');
    setEditing(!round.myBluff);
    setError(null);
    suggestCount.current = 0;
    autoSent.current = false;
  }, [round.index, round.question.id]);

  // Kurz vor Schluss: einen fertigen, aber noch nicht abgeschickten Entwurf retten
  useEffect(() => {
    if (!canWrite || !editing || autoSent.current || view.paused || round.deadline === null) return;
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
      const res = await conn.act({ type: 'suggest', n: suggestCount.current++ });
      if (res.suggestion) {
        setText(res.suggestion);
        setEditing(true);
        inputRef.current?.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kein Vorschlag verfügbar.');
    }
  };

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
              <Button variant="ghost" small onClick={suggest}>
                Keine Idee? Vorschlag nehmen
              </Button>
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
    </section>
  );
}

export function VotePhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const canVote = Boolean(view.me?.plays) && !display;
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    </section>
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
