import { useEffect, useRef, useState } from 'preact/hooks';
import { BLUFF_MAX } from '../../shared/rules';
import type { RoomView } from '../../shared/types';
import { Button, Progress, QuestionCard, QuestionText, Timer } from '../components/ui';
import { type RoomConnection, useServerNow } from '../lib/hooks';
import { clearDraft, draftKey, loadDraft, saveDraft } from '../lib/draft';
import { t } from '../lib/i18n';

const LETTERS = 'ABCDEFGHIJKLMN';

export function WritePhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const round = view.round!;
  const me = view.me;
  const canWrite = Boolean(me?.plays) && !display;
  const quiet = canWrite && me?.quiet === 'now';
  const key = draftKey(view.code, me?.id ?? '');
  const roundId = `${round.writeStartedAt}:${round.index}:${round.question.id}`;
  const restored = canWrite ? loadDraft(key, roundId, round.myBluff) : null;
  const [text, setText] = useState(restored ?? round.myBluff ?? '');
  const [editing, setEditing] = useState(restored !== null || !round.myBluff);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoSent = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const now = useServerNow(500);

  // Neue Frage → Eingabe zurücksetzen
  useEffect(() => {
    const draft = canWrite ? loadDraft(key, roundId, round.myBluff) : null;
    setText(draft ?? round.myBluff ?? '');
    setEditing(draft !== null || !round.myBluff);
    setError(null);
    autoSent.current = false;
  }, [key, roundId]);

  const edit = (value: string) => {
    setText(value);
    saveDraft(key, roundId, value);
  };

  // Kurz vor Schluss: einen fertigen, aber noch nicht abgeschickten Entwurf retten
  useEffect(() => {
    if (!canWrite || quiet || busy || !editing || autoSent.current || view.paused || round.deadline === null) return;
    const draft = text.trim();
    if (!draft || draft === round.myBluff || round.deadline - now > 1500 || round.deadline <= now) return;
    autoSent.current = true;
    submit();
  }, [now]);

  const submit = async () => {
    if (busy) return;
    if (!text.trim()) return setError(t('Schreib zuerst einen Bluff.'));
    setBusy(true);
    setError(null);
    try {
      await conn.act({ type: 'bluff', text }, { inline: true });
      clearDraft(key);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Abgabe fehlgeschlagen.'));
    } finally {
      setBusy(false);
    }
  };

  const suggest = async () => {
    setError(null);
    try {
      const res = await conn.act({ type: 'suggest' }, { inline: true });
      if (res.suggestion) {
        edit(res.suggestion);
        setEditing(true);
        inputRef.current?.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Kein Vorschlag verfügbar.'));
    }
  };

  if (quiet) return <QuietScreen view={view} conn={conn} />;
  const gap = round.question.kind === 'gap';

  return (
    <section class="phase write stack">
      <PhaseHead view={view} title={gap ? t('Lücke füllen') : t('Bluff schreiben')} />
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
              <span>{gap ? t('Was gehört in die Lücke? Erfinde etwas!') : t('Deine erfundene Antwort')}</span>
              <textarea
                ref={inputRef}
                value={text}
                disabled={busy}
                maxLength={BLUFF_MAX}
                rows={2}
                placeholder={gap ? t('Nur der fehlende Teil – glaubwürdig, aber falsch …') : t('Glaubwürdig, aber falsch …')}
                autocapitalize={gap ? 'off' : 'sentences'}
                onInput={(e) => edit((e.currentTarget as HTMLTextAreaElement).value)}
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
                {round.myBluff ? t('Änderung abgeben') : t('Bluff abgeben')}
              </Button>
              {round.mySuggestion ? (
                <p class="muted small suggest-used">{t('Den Vorschlag für diese Runde hast du schon bekommen.')}</p>
              ) : (
                <Button variant="ghost" small onClick={suggest}>
                  {t('Keine Idee? Vorschlag nehmen')}
                </Button>
              )}
            </div>
            <p class="muted small">{t('Jede Person, die auf deinen Bluff hereinfällt, bringt dir einen Punkt.')}</p>
          </form>
        ) : (
          <div class="submitted pop">
            <p class="eyebrow">{t('Dein Bluff ist drin ✓')}</p>
            <p class="submitted-text">
              {gap ? <QuestionText prompt={round.question.prompt} fill={round.myBluff} /> : t('„{text}“', { text: round.myBluff ?? '' })}
            </p>
            <Button variant="ghost" small onClick={() => setEditing(true)}>
              {t('Noch ändern')}
            </Button>
          </div>
        ))}

      <Progress players={view.players} label={t('Bluffs abgegeben')} />
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
      await conn.act({ type: 'vote', optionId }, { inline: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Stimme nicht angekommen.'));
    } finally {
      setPending(null);
    }
  };

  return (
    <section class="phase vote stack">
      <PhaseHead view={view} title={round.question.kind === 'gap' ? t('Was gehört in die Lücke?') : t('Welche Antwort stimmt?')} />
      <QuestionCard question={round.question} big={display} />
      <ul class={`options${display ? ' is-display' : ''}${round.question.kind === 'gap' ? ' is-gap' : ''}`}>
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
                {o.mine && <span class="option-tag">{t('Dein Bluff')}</span>}
                {chosen && !o.mine && <span class="option-tag is-check">{t('Deine Wahl')}</span>}
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
          {round.myVote ? t('Du kannst bis zum Ende noch umentscheiden.') : t('Tippe auf die Antwort, die du für wahr hältst.')}
        </p>
      )}
      <Progress players={view.players} label={t('Stimmen abgegeben')} />
      {canVote && <QuietOffer conn={conn} />}
    </section>
  );
}

/** Gebetsimpulse für die ruhige Minute – je Runde ein anderer */
function prayerPrompts(): string[] {
  return [
    t('Danke Gott für etwas, das dich heute gefreut hat.'),
    t('Bring einen Menschen vor Gott, der dir gerade am Herzen liegt.'),
    t('Sag Gott ehrlich, was dich gerade beschäftigt.'),
    t('Bitte um Frieden für jemanden, mit dem es gerade schwierig ist.'),
    t('Danke für die Menschen hier im Raum – einzeln, mit Namen.'),
    t('Sei einfach still und lass Gott Gott sein.'),
  ];
}

/** „Ruhige Minute“: Diese Person setzt die Runde aus und nimmt sich Zeit zum Beten. */
export function QuietScreen({ view, conn }: { view: RoomView; conn: RoomConnection }) {
  const round = view.round!;
  const [error, setError] = useState<string | null>(null);
  const back = async () => {
    setError(null);
    try {
      await conn.act({ type: 'quiet', on: false }, { inline: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Das ging nicht.'));
    }
  };
  const prompts = prayerPrompts();
  return (
    <section class="phase quiet-screen stack" aria-live="polite">
      <div class="quiet-breath" aria-hidden="true" />
      <p class="eyebrow">{t('Runde {n} von {total} · Ruhige Minute', { n: round.index + 1, total: round.total })}</p>
      <h1 class="quiet-title">{t('Zeit für ein Gebet')}</h1>
      <blockquote class="quiet-verse">
        {t('„Seid stille und erkennet, dass ich Gott bin!“')}
        <cite>{t('Psalm 46,11')}</cite>
      </blockquote>
      <p class="quiet-prompt">{prompts[round.index % prompts.length]}</p>
      <p class="muted small">{t('Die anderen spielen diese Runde ohne dich weiter. Zur Auflösung bist du wieder dabei.')}</p>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <Button variant="secondary" onClick={back}>
        {t('Zurück ins Spiel')}
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
      await conn.act({ type: 'quiet', on: true }, { inline: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Das ging nicht.'));
    }
  };
  return (
    <div class="quiet-offer">
      <Button variant="ghost" small onClick={start}>
        {t('Ruhige Minute')}
      </Button>
      <span class="muted small">{next ? t('Die nächste Runde aussetzen, um zu beten.') : t('Diese Runde aussetzen, um zu beten.')}</span>
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
        <p class="eyebrow">{t('Runde {n} von {total}', { n: round.index + 1, total: round.total })}</p>
        <h1 class="phase-title">{title}</h1>
      </div>
      <Timer start={round.phaseStartedAt} deadline={round.deadline} pausedAt={view.paused?.at ?? null} />
    </header>
  );
}
