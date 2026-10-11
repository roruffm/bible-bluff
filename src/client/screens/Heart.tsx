// Herzensrunde: Zum Schluss eine Runde ohne Punkte und ohne Bluffen. Alle schreiben ehrlich eine
// Antwort – oder setzen aus. Danach erscheinen die Antworten nacheinander, gemischt und ohne Namen.

import { useEffect, useState } from 'preact/hooks';
import { HEART_MAX } from '../../shared/rules';
import type { RoomView } from '../../shared/types';
import { Button, Progress, Timer } from '../components/ui';
import type { RoomConnection } from '../lib/hooks';

export function HeartPhase({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  return view.heart!.phase === 'write' ? (
    <HeartWrite view={view} conn={conn} display={display} />
  ) : (
    <HeartShow view={view} conn={conn} display={display} />
  );
}

function HeartWrite({ view, conn, display }: { view: RoomView; conn: RoomConnection; display: boolean }) {
  const heart = view.heart!;
  const canWrite = Boolean(view.me?.plays) && !display;
  // Auch wer nur leitet (gemeinsame Ansicht), darf die Frage wechseln
  const isHost = Boolean(view.me?.isHost);
  const [text, setText] = useState(heart.mine?.text ?? '');
  const [editing, setEditing] = useState(!heart.mine);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Andere Frage → wer noch nichts abgegeben hat, schreibt neu
  useEffect(() => {
    if (!heart.mine) setEditing(true);
  }, [heart.question]);

  const send = async (value: string | null) => {
    if (value !== null && !value.trim()) return setError('Schreib zuerst etwas – oder tippe auf „Diesmal nicht“.');
    setBusy(true);
    setError(null);
    try {
      await conn.act({ type: 'heart', text: value });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    } finally {
      setBusy(false);
    }
  };

  const swap = async () => {
    setError(null);
    try {
      await conn.act({ type: 'heartSwap' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };

  return (
    <section class={`phase heart stack${display ? ' is-display' : ''}`}>
      <header class="phase-head">
        <div>
          <p class="eyebrow">Zum Schluss · ohne Punkte</p>
          <h1 class="phase-title">Herzensrunde</h1>
        </div>
        <Timer start={heart.phaseStartedAt} deadline={heart.deadline} pausedAt={view.paused?.at ?? null} />
      </header>

      <article class="heart-question pop">
        <span class="heart-mark" aria-hidden="true">
          ♥
        </span>
        <p>{heart.question}</p>
      </article>
      <p class="muted small center">
        Kein Bluff, keine Punkte: Schreib ehrlich, was dir durch den Kopf geht. Alle Antworten erscheinen gleich nacheinander –
        ohne Namen.
      </p>
      {isHost && heart.canSwap && (
        <div class="center">
          <Button variant="ghost" small onClick={swap}>
            Andere Frage
          </Button>
        </div>
      )}

      {canWrite &&
        (editing ? (
          <form
            class="stack"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <label class="field">
              <span>Deine Antwort</span>
              <textarea
                value={text}
                maxLength={HEART_MAX}
                rows={3}
                placeholder="Ehrlich und in deinen Worten …"
                onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
                autocomplete="off"
              />
              <small class="counter">
                {text.length}/{HEART_MAX}
              </small>
            </label>
            {error && (
              <p class="error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" block disabled={busy || !text.trim()}>
              {heart.mine?.text ? 'Änderung abschicken' : 'Abschicken'}
            </Button>
            <Button variant="ghost" small disabled={busy} onClick={() => send(null)}>
              Diesmal nicht
            </Button>
          </form>
        ) : (
          <div class="submitted pop">
            {heart.mine?.text ? (
              <>
                <p class="eyebrow">Deine Antwort ist drin ✓</p>
                <p class="submitted-text">„{heart.mine.text}“</p>
                <p class="muted small">Sie erscheint gleich zwischen den anderen – ohne deinen Namen.</p>
              </>
            ) : (
              <>
                <p class="eyebrow">Diesmal nicht – völlig in Ordnung</p>
                <p class="muted small">Gleich kannst du lesen, was die anderen geschrieben haben.</p>
              </>
            )}
            <Button variant="ghost" small onClick={() => setEditing(true)}>
              {heart.mine?.text ? 'Noch ändern' : 'Doch etwas schreiben'}
            </Button>
          </div>
        ))}

      <Progress players={view.players.filter((p) => !p.bot)} label="Fertig" />
    </section>
  );
}

/** Die Antworten erscheinen nacheinander; die Reihenfolge hat der Server gemischt */
function HeartShow({ view, conn, display }: { view: RoomView; conn: RoomConnection; display: boolean }) {
  const heart = view.heart!;
  const answers = heart.answers ?? [];
  const isHost = Boolean(view.me?.isHost);
  const [error, setError] = useState<string | null>(null);
  const next = async () => {
    setError(null);
    try {
      await conn.act({ type: 'next' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };
  const step = display ? 1800 : 1100;

  return (
    <section class={`phase heart heart-show stack${display ? ' is-display' : ''}`}>
      <header class="heart-show-head">
        <p class="eyebrow">Herzensrunde · ohne Namen</p>
        <h1 class="phase-title">{heart.question}</h1>
      </header>
      {answers.length ? (
        <ul class="heart-answers">
          {answers.map((text, i) => (
            <li class="heart-answer" style={{ animationDelay: `${400 + i * step}ms` }}>
              {text}
            </li>
          ))}
        </ul>
      ) : (
        <p class="notice center">Diesmal hat niemand etwas aufgeschrieben – auch das ist in Ordnung.</p>
      )}
      <p class="heart-thanks muted center" style={{ animationDelay: `${600 + answers.length * step}ms` }}>
        Danke für eure Ehrlichkeit.
      </p>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      {!(display && !view.me) && (
        <footer class="next-bar">
          {isHost ? (
            <Button variant="gold" block onClick={next}>
              Zum Endstand
            </Button>
          ) : (
            <p class="waiting">
              <span class="pulse" aria-hidden="true" />
              Gleich geht es zum Endstand …
            </p>
          )}
        </footer>
      )}
    </section>
  );
}
