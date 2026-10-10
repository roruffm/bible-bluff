import { useEffect, useState } from 'preact/hooks';
import type { RoomView } from '../../shared/types';
import { ThemePicker } from '../components/ThemePicker';
import { Avatar, Button, ConfirmButton, Logo, Rules, Toast } from '../components/ui';
import type { ApiError } from '../lib/api';
import { type RoomConnection, useRoom, useWakeLock } from '../lib/hooks';
import { useJoinAlert } from '../lib/join-alert';
import { navigate } from '../lib/router';
import { markSeen } from '../lib/seen';
import { type Session, clearSession, loadSession } from '../lib/session';
import { THEME_PARAM, useTheme } from '../lib/theme';
import { Lobby, RoomCodeCard, PlayerList } from './Lobby';
import { VotePhase, WritePhase } from './Play';
import { RevealPhase } from './Reveal';
import { FinalScreen, ScoresPhase } from './Results';
import { LegalLinks } from './Legal';
import { JoinForm } from './Start';

export function RoomPage({ code }: { code: string }) {
  const [session, setSession] = useState<Session | null>(() => loadSession(code));
  const [note, setNote] = useState<string | null>(null);

  if (!session) {
    return (
      <main class="page join">
        <header class="page-head">
          <button class="back" onClick={() => navigate('/')} aria-label="Zur Startseite">
            ←
          </button>
          <Logo small />
        </header>
        <h1>Mitspielen</h1>
        <p class="lead">
          Raum <b class="mono">{code}</b>
        </p>
        {note && <p class="notice">{note}</p>}
        <section class="card">
          <JoinForm code={code} onJoined={setSession} />
        </section>
        <Rules compact />
        <LegalLinks />
      </main>
    );
  }

  return (
    <RoomLive
      key={session.token}
      code={code}
      session={session}
      onLost={(message) => {
        clearSession(code);
        setNote(message);
        setSession(null);
      }}
    />
  );
}

function RoomLive({ code, session, onLost }: { code: string; session: Session; onLost: (message: string) => void }) {
  const conn = useRoom(code, session.token);
  const { view, fatal } = conn;

  useEffect(() => {
    if (fatal?.code === 'unknown_session' || fatal?.code === 'not_in_room') onLost(fatal.message);
  }, [fatal]);

  if (fatal && fatal.code !== 'unknown_session' && fatal.code !== 'not_in_room') {
    return <Gone error={fatal} code={code} />;
  }
  if (!view) return <Loading />;
  if (view.status === 'closed') return <Gone code={code} closed />;
  return <GameShell view={view} conn={conn} />;
}

export function TvPage({ code }: { code: string }) {
  const conn = useRoom(code, null);
  const { view, fatal } = conn;
  useWakeLock(Boolean(view && view.status !== 'closed'));
  useEffect(() => {
    document.documentElement.classList.add('tv-mode');
    return () => document.documentElement.classList.remove('tv-mode');
  }, []);
  if (fatal) return <Gone error={fatal} code={code} />;
  if (!view) return <Loading />;
  if (view.status === 'closed') return <Gone code={code} closed />;
  return (
    <main class="tv">
      {conn.offline && <OfflineBanner />}
      {view.paused && <PausedOverlay view={view} conn={conn} display />}
      <Stage view={view} conn={conn} display />
    </main>
  );
}

function GameShell({ view, conn }: { view: RoomView; conn: RoomConnection }) {
  const [panel, setPanel] = useState(false);
  const isHost = Boolean(view.me?.isHost);
  // Wer nur leitet, sieht die gemeinsame Ansicht – mit Steuerung.
  const display = !view.me?.plays && view.status === 'playing';
  // Wartet die Leitung in einem öffentlichen Raum, bleibt ihr Bildschirm an – sonst käme die Meldung nicht an
  useWakeLock(view.status === 'playing' || (isHost && view.listed && view.status === 'lobby'));
  const [joinNote, setJoinNote] = useState<string | null>(null);
  useJoinAlert(view, setJoinNote);

  // Neue Phase → nach oben, damit niemand mitten in der alten Ansicht hängen bleibt
  const phaseKey = `${view.status}-${view.round?.index ?? ''}-${view.round?.phase ?? ''}`;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phaseKey]);

  // „Neues für alle“: Sobald die Antwort aufgedeckt ist, kennt dieses Gerät die Frage
  const solved = view.round && (view.round.phase === 'reveal' || view.round.phase === 'scores') ? view.round.question.id : null;
  useEffect(() => {
    if (solved && view.me) markSeen(solved);
  }, [solved]);

  return (
    <div class={`shell${display ? ' is-presenter' : ''}`}>
      <header class="topbar">
        <a
          href="/"
          class="topbar-logo"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          aria-label="Bible Bluff – Startseite"
        >
          <Logo small />
        </a>
        <span class="topbar-code" title="Raumcode">
          {view.code}
        </span>
        {view.me && (
          <span class="topbar-me">
            <Avatar person={view.me} size="sm" />
            <span class="topbar-score">{view.players.find((p) => p.id === view.me!.id)?.score ?? 0}</span>
          </span>
        )}
        <button class="topbar-menu" onClick={() => setPanel(true)} aria-haspopup="dialog">
          {isHost ? 'Leitung' : 'Menü'}
        </button>
      </header>

      {conn.offline && <OfflineBanner />}
      {view.paused && <PausedOverlay view={view} conn={conn} />}

      <main class="page game">
        <Stage view={view} conn={conn} display={display} />
      </main>

      {panel && <Panel view={view} conn={conn} onClose={() => setPanel(false)} />}
      <Toast message={joinNote} onDone={() => setJoinNote(null)} />
    </div>
  );
}

function Stage({ view, conn, display }: { view: RoomView; conn: RoomConnection; display: boolean }) {
  if (view.status === 'lobby') {
    return display || !view.me ? <TvLobby view={view} /> : <Lobby view={view} conn={conn} />;
  }
  if (view.status === 'finished') return <FinalScreen view={view} conn={conn} display={!view.me} />;
  const round = view.round;
  if (!round) return <Loading />;
  switch (round.phase) {
    case 'write':
      return <WritePhase view={view} conn={conn} display={display} />;
    case 'vote':
      return <VotePhase view={view} conn={conn} display={display} />;
    case 'reveal':
      return <RevealPhase view={view} conn={conn} display={!view.me} />;
    case 'scores':
      return <ScoresPhase view={view} conn={conn} display={!view.me} />;
  }
}

function TvLobby({ view }: { view: RoomView }) {
  return (
    <section class="tv-lobby">
      <div class="tv-lobby-intro">
        <Logo />
        <p class="tagline">Erfinde Bluffs. Finde die Wahrheit. Entdecke die Bibel.</p>
        <RoomCodeCard code={view.code} big />
      </div>
      <div class="tv-lobby-players">
        <h2 class="card-title">
          Dabei <span class="count">{view.players.filter((p) => p.plays).length}</span>
        </h2>
        <PlayerList view={view} />
        <p class="waiting">
          <span class="pulse" aria-hidden="true" />
          Gleich geht’s los …
        </p>
      </div>
    </section>
  );
}

function PausedOverlay({ view, conn, display = false }: { view: RoomView; conn: RoomConnection; display?: boolean }) {
  const isHost = Boolean(view.me?.isHost) && !display;
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-label="Pause">
      <div class="overlay-card pop">
        <p class="overlay-icon" aria-hidden="true">
          ❚❚
        </p>
        <h2>Pause</h2>
        <p class="muted">Die Zeit steht still, bis es weitergeht.</p>
        {isHost && (
          <Button variant="gold" block onClick={() => conn.act({ type: 'resume' })}>
            Fortsetzen
          </Button>
        )}
      </div>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div class="offline" role="status">
      Verbindung wird wiederhergestellt …
    </div>
  );
}

function Loading() {
  return (
    <main class="page center-page">
      <div class="loader" aria-label="Lädt" />
    </main>
  );
}

function Gone({ error, code, closed = false }: { error?: ApiError; code: string; closed?: boolean }) {
  useEffect(() => {
    if (closed || error?.code === 'kicked' || error?.code === 'not_found' || error?.code === 'closed') clearSession(code);
  }, [closed, error, code]);
  const title = closed || error?.code === 'closed' ? 'Raum geschlossen' : error?.code === 'kicked' ? 'Entfernt' : 'Ups';
  const text = closed
    ? 'Die Spielleitung hat diesen Raum geschlossen. Danke fürs Mitspielen!'
    : error?.message ?? 'Etwas ist schiefgelaufen.';
  return (
    <main class="page center-page">
      <div class="card gone">
        <Logo small />
        <h1>{title}</h1>
        <p>{text}</p>
        <Button block onClick={() => navigate('/')}>
          Zur Startseite
        </Button>
      </div>
    </main>
  );
}

function Panel({ view, conn, onClose }: { view: RoomView; conn: RoomConnection; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const isHost = Boolean(view.me?.isHost);
  const phase = view.status === 'playing' ? view.round?.phase : null;
  const [theme] = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const run = (action: Parameters<RoomConnection['act']>[0], close = true) => async () => {
    setError(null);
    try {
      await conn.act(action);
      if (close) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };

  const skipLabel: Record<string, string> = {
    write: 'Schreibzeit jetzt beenden',
    vote: 'Abstimmung jetzt beenden',
    reveal: 'Aufdeckung überspringen',
    scores: 'Nächste Runde',
  };

  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <aside class="sheet" role="dialog" aria-modal="true" aria-label={isHost ? 'Spielleitung' : 'Menü'} onClick={(e) => e.stopPropagation()}>
        <header class="sheet-head">
          <h2>{isHost ? 'Spielleitung' : 'Menü'}</h2>
          <button class="sheet-close" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </header>

        {error && (
          <p class="error" role="alert">
            {error}
          </p>
        )}

        {isHost && phase && (
          <section class="sheet-section">
            <h3>Partie</h3>
            <div class="stack">
              {view.paused ? (
                <Button block variant="gold" onClick={run({ type: 'resume' })}>
                  Fortsetzen
                </Button>
              ) : (
                <Button block variant="secondary" onClick={run({ type: 'pause' })}>
                  Pausieren
                </Button>
              )}
              <Button block variant="secondary" onClick={run({ type: 'skipPhase' })}>
                {skipLabel[phase]}
              </Button>
              {phase === 'write' && (
                <Button block variant="secondary" onClick={run({ type: 'swapQuestion' })}>
                  Andere Frage nehmen
                </Button>
              )}
            </div>
          </section>
        )}

        {isHost && (
          <section class="sheet-section">
            <h3>Raum</h3>
            <div class="stack">
              <Button block variant="secondary" onClick={run({ type: 'lock', locked: !view.locked }, false)}>
                {view.locked ? 'Raum wieder öffnen' : 'Raum für Neue sperren'}
              </Button>
              <Button block variant="secondary" onClick={run({ type: 'listed', listed: !view.listed }, false)}>
                {view.listed ? 'Nicht mehr öffentlich zeigen' : 'Öffentlich auf der Startseite zeigen'}
              </Button>
              {view.listed && (
                <p class="muted small">
                  {view.locked
                    ? 'Gesperrt: Der Raum erscheint gerade nicht auf der Startseite.'
                    : 'Der Raum steht auf der Startseite, und alle können beitreten.'}
                </p>
              )}
              <a class="btn btn-ghost btn-block" href={`/tv/${view.code}?${THEME_PARAM}=${theme}`} target="_blank" rel="noopener">
                Leinwand-Ansicht öffnen ↗
              </a>
            </div>
          </section>
        )}

        <section class="sheet-section">
          <h3>Teilnehmende</h3>
          <ul class="manage-list">
            {view.players.map((p) => (
              <li>
                <Avatar person={p} size="sm" dim={!p.online} />
                <span class="manage-name">
                  {p.name}
                  {p.isHost && <small> · Leitung</small>}
                  {!p.online && <small> · offline</small>}
                </span>
                {isHost && p.id !== view.me?.id && (
                  <span class="manage-actions">
                    <ConfirmButton small variant="ghost" confirm="Übergeben?" onConfirm={run({ type: 'makeHost', playerId: p.id }, false)}>
                      Leitung geben
                    </ConfirmButton>
                    <ConfirmButton small variant="ghost" confirm="Entfernen?" onConfirm={run({ type: 'kick', playerId: p.id }, false)}>
                      Entfernen
                    </ConfirmButton>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section class="sheet-section">
          <h3>Farben</h3>
          <ThemePicker compact />
        </section>

        <section class="sheet-section">
          <div class="stack">
            {isHost ? (
              <ConfirmButton block variant="secondary" confirm="Für alle schließen? Nochmal tippen" onConfirm={run({ type: 'close' })}>
                Raum schließen
              </ConfirmButton>
            ) : (
              <ConfirmButton
                block
                variant="secondary"
                confirm="Wirklich verlassen? Nochmal tippen"
                onConfirm={async () => {
                  await conn.act({ type: 'leave' }).catch(() => {});
                  clearSession(view.code);
                  navigate('/');
                }}
              >
                Raum verlassen
              </ConfirmButton>
            )}
          </div>
        </section>
        <Rules compact />
        <LegalLinks newTab />
      </aside>
    </div>
  );
}
