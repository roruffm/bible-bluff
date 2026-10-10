import { useEffect, useState } from 'preact/hooks';
import {
  BOT_COLOR,
  BOT_ID,
  BOT_NAME,
  BOT_SETTINGS,
  DEFAULT_SETTINGS,
  DIFFICULTY_OPTIONS,
  NAME_MAX,
  ROUND_OPTIONS,
  VOTE_OPTIONS,
  WRITE_OPTIONS,
  normalizeCode,
} from '../../shared/rules';
import type { PublicRoom, Settings } from '../../shared/types';
import { EnterIcon, FriendsIcon } from '../components/Icons';
import { ThemePicker } from '../components/ThemePicker';
import { Avatar, Button, Logo, Rules, Segmented, Toggle } from '../components/ui';
import { ApiError, api } from '../lib/api';
import { navigate } from '../lib/router';
import { LegalLinks } from './Legal';
import { type Session, lastRoom, loadSession, rememberedName, saveSession } from '../lib/session';

export function Home() {
  const [code, setCode] = useState('');
  const last = lastRoom();
  const lastSession = last ? loadSession(last) : null;

  return (
    <main class="page home">
      <header class="hero">
        <Logo />
        <p class="tagline">Erfinde Bluffs. Finde die Wahrheit. Entdecke die Bibel.</p>
      </header>

      {lastSession && (
        <a
          class="resume"
          href={`/r/${lastSession.code}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/r/${lastSession.code}`);
          }}
        >
          Zurück zu Raum <b>{lastSession.code}</b> als {lastSession.name} →
        </a>
      )}

      <OpenRooms />

      <section class="card choice" aria-labelledby="join-title">
        <div class="choice-head">
          <span class="choice-icon is-join">
            <EnterIcon />
          </span>
          <div>
            <h2 id="join-title">Mitspielen</h2>
            <p class="muted small">Du hast einen Raumcode bekommen? Gib ihn hier ein.</p>
          </div>
        </div>
        <JoinForm
          code={code}
          onCode={setCode}
          onJoined={(s) => navigate(`/r/${s.code}`)}
          askCode
        />
      </section>

      <div class="or">
        <span>oder selbst starten</span>
      </div>

      <section class="card choice" aria-labelledby="create-title">
        <div class="choice-head">
          <span class="choice-icon is-create">
            <FriendsIcon />
          </span>
          <div>
            <h2 id="create-title">Mit Freunden</h2>
            <p class="muted small">Du eröffnest einen Raum und leitest die Partie – auf dem Handy oder am Beamer.</p>
          </div>
        </div>
        <Button variant="gold" block onClick={() => navigate('/neu')}>
          Raum eröffnen
        </Button>
      </section>

      <section class="card choice" aria-labelledby="joseph-title">
        <div class="choice-head">
          <JosephPortrait />
          <div>
            <h2 id="joseph-title">Allein gegen {BOT_NAME}</h2>
            <p class="muted small">
              {BOT_NAME} ist ein Bot und hat immer Zeit. Er erfindet Bluffs, rät mit – und ist schlagbar.
            </p>
          </div>
        </div>
        <Button block raised onClick={() => navigate('/joseph')}>
          Gegen {BOT_NAME} spielen
        </Button>
      </section>

      <Rules />

      <section class="side-card">
        <h2>Farben</h2>
        <ThemePicker compact />
      </section>

      <footer class="footnote">
        Fragen aus allen 27 Büchern des Neuen Testaments und ausgewählten Geschichten des Alten Testaments · freikirchlich-pfingstliche Lernfassung
      </footer>
      <LegalLinks />
    </main>
  );
}

/** Josephs Gesicht für die Startseite und den Anfang einer Partie mit ihm */
function JosephPortrait() {
  return <Avatar person={{ id: BOT_ID, name: BOT_NAME, color: BOT_COLOR }} size="lg" />;
}

/** So oft fragt die Startseite nach offenen Räumen, solange sie sichtbar ist */
const OPEN_ROOMS_POLL_MS = 10_000;

/** Räume, deren Leitung sie öffentlich zeigt. Erscheint nur, wenn es gerade welche gibt. */
function OpenRooms() {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      if (!document.hidden) {
        try {
          const res = await api.publicRooms();
          if (alive) setRooms(res.rooms);
        } catch {
          // Die Liste ist nur ein Angebot – ohne sie funktioniert die Startseite trotzdem
        }
      }
      if (alive) timer = setTimeout(load, OPEN_ROOMS_POLL_MS);
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  if (rooms.length === 0) return null;
  return (
    <section class="card open-rooms" aria-labelledby="open-rooms-title">
      <h2 id="open-rooms-title">Offene Räume</h2>
      <p class="muted small">Hier wird gerade gespielt, und neue Leute sind willkommen.</p>
      <ul class="open-room-list">
        {rooms.map((r) => (
          <li key={r.code}>
            <a
              class="open-room"
              href={`/r/${r.code}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/r/${r.code}`);
              }}
            >
              <span class="open-room-text">
                <b>Raum {r.code}</b>
                <small>{r.status === 'lobby' ? 'Wartet auf den Start' : `Runde ${r.round} von ${r.rounds} läuft`}</small>
                <small>{roomMeta(r)}</small>
              </span>
              <span class="open-room-go">Mitspielen</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function roomMeta(r: PublicRoom) {
  return `${r.people} ${r.people === 1 ? 'Person' : 'Personen'} · ${difficultyLabel(r.difficulty)}`;
}

function difficultyLabel(value: PublicRoom['difficulty']) {
  return DIFFICULTY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function JoinForm(props: {
  code: string;
  onCode?: (code: string) => void;
  onJoined: (session: Session) => void;
  askCode?: boolean;
}) {
  const [name, setName] = useState(rememberedName());
  const [error, setError] = useState<string | null>(null);
  const [reclaim, setReclaim] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (wantReclaim = false) => {
    const code = normalizeCode(props.code);
    if (!code) return setError('Bitte gib den Raumcode ein.');
    if (!name.trim()) return setError('Bitte gib einen Spitznamen ein.');
    setBusy(true);
    setError(null);
    try {
      const res = await api.join(code, name, wantReclaim);
      const session: Session = { code: res.code, token: res.token, playerId: res.playerId, name: res.view.me?.name ?? name };
      saveSession(session);
      props.onJoined(session);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'name_offline') {
        setReclaim(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Beitritt fehlgeschlagen.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (reclaim) {
    return (
      <div class="stack">
        <p class="notice">{reclaim}</p>
        <Button block onClick={() => submit(true)}>
          Ja, das bin ich – wieder einsteigen
        </Button>
        <Button
          block
          variant="ghost"
          onClick={() => {
            setReclaim(null);
            setName('');
          }}
        >
          Nein, anderen Namen wählen
        </Button>
      </div>
    );
  }

  return (
    <form
      class="stack"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {props.askCode && (
        <label class="field">
          <span>Raumcode</span>
          <input
            class="code-input"
            value={props.code}
            onInput={(e) => props.onCode?.(normalizeCode((e.currentTarget as HTMLInputElement).value))}
            placeholder="z. B. LAMPE7"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck={false}
            inputMode="text"
            maxLength={10}
            required
          />
        </label>
      )}
      <label class="field">
        <span>Dein Spitzname</span>
        <input
          value={name}
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          placeholder="z. B. Mirjam"
          maxLength={NAME_MAX}
          autocomplete="nickname"
          enterkeyhint="go"
          required
        />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" block raised disabled={busy}>
        {busy ? 'Trete bei …' : 'Beitreten'}
      </Button>
    </form>
  );
}

/** Raum eröffnen – oder mit `bot` einen eigenen Raum, in dem Joseph schon mitspielt */
export function CreateRoom({ bot = false }: { bot?: boolean }) {
  const [name, setName] = useState(rememberedName());
  const [plays, setPlays] = useState(true);
  const [settings, setSettings] = useState<Settings>(bot ? BOT_SETTINGS : DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const create = async () => {
    if (!name.trim()) return setError('Bitte gib einen Spitznamen ein.');
    setBusy(true);
    setError(null);
    try {
      const res = await api.createRoom(name, bot || plays, settings, bot);
      saveSession({ code: res.code, token: res.token, playerId: res.playerId, name: res.view.me?.name ?? name });
      navigate(`/r/${res.code}`, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das hat nicht geklappt.');
      setBusy(false);
    }
  };

  return (
    <main class="page create">
      <header class="page-head">
        <button class="back" onClick={() => navigate('/')} aria-label="Zurück">
          ←
        </button>
        <Logo small />
      </header>
      <h1>{bot ? `Gegen ${BOT_NAME} spielen` : 'Raum eröffnen'}</h1>
      {bot && (
        <div class="bot-intro">
          <JosephPortrait />
          <p class="lead">
            {BOT_NAME} schreibt Bluffs und rät mit. Der Raum gehört dir: Du startest, wann du willst, und kannst auch Freunde
            einladen.
          </p>
        </div>
      )}
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label class="field">
          <span>Dein Spitzname</span>
          <input
            value={name}
            onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
            placeholder="z. B. Timotheus"
            maxLength={NAME_MAX}
            required
          />
        </label>

        {!bot && (
          <Toggle
            checked={plays}
            onChange={setPlays}
            label="Ich spiele mit"
            hint={plays ? 'Du leitest und spielst auf diesem Handy.' : 'Dieses Gerät leitet nur – ideal für Beamer oder Fernseher.'}
          />
        )}

        {bot ? (
          <details class="more-settings">
            <summary>
              <span>Einstellungen</span>
              <span class="muted small">
                {settings.rounds} Runden · {settings.difficulty} · {settings.writeSeconds} s bluffen
              </span>
            </summary>
            <SettingsFields settings={settings} onChange={set} />
          </details>
        ) : (
          <SettingsFields settings={settings} onChange={set} />
        )}

        {error && (
          <p class="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="gold" block disabled={busy}>
          {busy ? 'Raum wird eröffnet …' : bot ? `Raum mit ${BOT_NAME} eröffnen` : 'Raum eröffnen'}
        </Button>
      </form>
      <LegalLinks />
    </main>
  );
}

export function SettingsFields(props: { settings: Settings; onChange: (patch: Partial<Settings>) => void; disabled?: boolean }) {
  const { settings, onChange, disabled } = props;
  return (
    <div class="settings">
      <div class="field">
        <span>Runden</span>
        <Segmented
          label="Runden"
          value={settings.rounds}
          options={ROUND_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
          onChange={(rounds) => onChange({ rounds })}
          disabled={disabled}
        />
      </div>
      <div class="field">
        <span>Schwierigkeit</span>
        <Segmented
          label="Schwierigkeit"
          value={settings.difficulty}
          options={DIFFICULTY_OPTIONS}
          onChange={(difficulty) => onChange({ difficulty })}
          disabled={disabled}
        />
      </div>
      <div class="field">
        <span>Zeit zum Bluffen</span>
        <Segmented
          label="Zeit zum Bluffen"
          value={settings.writeSeconds}
          options={WRITE_OPTIONS.map((n) => ({ value: n, label: `${n} s` }))}
          onChange={(writeSeconds) => onChange({ writeSeconds })}
          disabled={disabled}
        />
      </div>
      <div class="field">
        <span>Zeit zum Abstimmen</span>
        <Segmented
          label="Zeit zum Abstimmen"
          value={settings.voteSeconds}
          options={VOTE_OPTIONS.map((n) => ({ value: n, label: `${n} s` }))}
          onChange={(voteSeconds) => onChange({ voteSeconds })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
