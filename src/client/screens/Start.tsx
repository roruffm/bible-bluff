import { useState } from 'preact/hooks';
import {
  DEFAULT_SETTINGS,
  DIFFICULTY_OPTIONS,
  NAME_MAX,
  ROUND_OPTIONS,
  VOTE_OPTIONS,
  WRITE_OPTIONS,
  normalizeCode,
} from '../../shared/rules';
import type { Settings } from '../../shared/types';
import { ThemePicker } from '../components/ThemePicker';
import { Button, Logo, Rules, Segmented, Toggle } from '../components/ui';
import { ApiError, api } from '../lib/api';
import { navigate } from '../lib/router';
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

      <section class="card">
        <h2>Mitspielen</h2>
        <JoinForm
          code={code}
          onCode={setCode}
          onJoined={(s) => navigate(`/r/${s.code}`)}
          askCode
        />
      </section>

      <div class="or">
        <span>oder</span>
      </div>

      <Button variant="gold" block onClick={() => navigate('/neu')}>
        Raum eröffnen
      </Button>
      <p class="muted center small">Du leitest die Partie – auf dem Handy oder am Beamer.</p>

      <Rules />

      <section class="card">
        <h2>Farben</h2>
        <ThemePicker />
      </section>

      <footer class="footnote">
        Fragen aus allen 27 Büchern des Neuen Testaments und ausgewählten Geschichten des Alten Testaments · freikirchlich-pfingstliche Lernfassung
      </footer>
    </main>
  );
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
      <Button type="submit" block disabled={busy}>
        {busy ? 'Trete bei …' : 'Beitreten'}
      </Button>
    </form>
  );
}

export function CreateRoom() {
  const [name, setName] = useState(rememberedName());
  const [plays, setPlays] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const create = async () => {
    if (!name.trim()) return setError('Bitte gib einen Spitznamen ein.');
    setBusy(true);
    setError(null);
    try {
      const res = await api.createRoom(name, plays, settings);
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
      <h1>Raum eröffnen</h1>
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

        <Toggle
          checked={plays}
          onChange={setPlays}
          label="Ich spiele mit"
          hint={plays ? 'Du leitest und spielst auf diesem Handy.' : 'Dieses Gerät leitet nur – ideal für Beamer oder Fernseher.'}
        />

        <SettingsFields settings={settings} onChange={set} />

        {error && (
          <p class="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="gold" block disabled={busy}>
          {busy ? 'Raum wird eröffnet …' : 'Raum eröffnen'}
        </Button>
      </form>
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
