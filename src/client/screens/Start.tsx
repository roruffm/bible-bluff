import { useEffect, useState } from 'preact/hooks';
import {
  ALL_CATEGORIES,
  BOT_COLOR,
  BOT_ID,
  BOT_NAME,
  BOT_SETTINGS,
  CATEGORIES,
  DEFAULT_SETTINGS,
  DIFFICULTY_OPTIONS,
  NAME_MAX,
  ROUND_OPTIONS,
  ROUND_TYPE_OPTIONS,
  VOTE_OPTIONS,
  WRITE_OPTIONS,
  normalizeCode,
} from '../../shared/rules';
import type { CategoryId, PublicRoom, RoundType, Settings } from '../../shared/types';
import { Guide } from '../components/Guide';
import { EnterIcon, FriendsIcon } from '../components/Icons';
import { LangSwitch } from '../components/LangSwitch';
import { ThemeFold } from '../components/ThemePicker';
import { Avatar, Button, Logo, Segmented, Toggle } from '../components/ui';
import { ApiError, api } from '../lib/api';
import { currentLang, preferredLang, t, tj } from '../lib/i18n';
import { categoryCount, poolAmount, poolCount, settingsSummary, usePool } from '../lib/pool';
import { navigate } from '../lib/router';
import { LegalLinks } from './Legal';
import { type Session, lastRoom, loadSession, rememberedName, saveSession } from '../lib/session';

export function Home() {
  const [code, setCode] = useState('');
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const last = lastRoom();
  const lastSession = last ? loadSession(last) : null;

  const quickPlay = async () => {
    if (quickBusy) return;
    setQuickBusy(true);
    setQuickError(null);
    try {
      const name = rememberedName().trim() || t('Gast');
      const settings: Settings = {
        ...BOT_SETTINGS,
        rounds: 4,
        difficulty: 'leicht',
        roundType: 'fragen',
        writeSeconds: 45,
        voteSeconds: 20,
        lang: preferredLang(),
      };
      const res = await api.createRoom(name, true, settings, true);
      saveSession({ code: res.code, token: res.token, playerId: res.playerId, name: res.view.me?.name ?? name });
      // Der Raum ist schon gespeichert: Bei einem Fehler kann man ihn in der Lobby selbst starten.
      await api.action(res.code, res.token, { type: 'start' }).catch(() => {});
      navigate(`/r/${res.code}`);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : t('Das hat nicht geklappt.'));
      setQuickBusy(false);
    }
  };

  return (
    <main class="page home">
      <header class="hero has-lang">
        <LangSwitch />
        <Logo />
        <p class="tagline">{t('Erfinde Bluffs. Finde die Wahrheit. Entdecke die Bibel.')}</p>
        <div class="hero-start">
          <Button variant="gold" block disabled={quickBusy} onClick={quickPlay}>
            {quickBusy ? t('Spiel startet …') : t('Jetzt sofort spielen')}
          </Button>
          <p>{t('Allein gegen Joseph · ohne Anmeldung · direkt zur ersten Frage')}</p>
        </div>
      </header>

      {quickError && <p class="error" role="alert">{quickError}</p>}

      {lastSession && (
        <a
          class="resume"
          href={`/r/${lastSession.code}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/r/${lastSession.code}`);
          }}
        >
          {tj('Zurück zu Raum {code} als {name} →', { code: <b>{lastSession.code}</b>, name: lastSession.name })}
        </a>
      )}

      <QuickPreview onPlay={quickPlay} busy={quickBusy} />

      <OpenRooms />

      <section class="card choice" aria-labelledby="create-title">
        <div class="choice-head">
          <span class="choice-icon is-create">
            <FriendsIcon />
          </span>
          <div>
            <h2 id="create-title">{t('Mit Freunden')}</h2>
            <p class="muted small">{t('Du eröffnest einen Raum und leitest die Partie – auf dem Handy oder am Beamer.')}</p>
          </div>
        </div>
        <Button variant="gold" block onClick={() => navigate('/neu')}>
          {t('Raum eröffnen')}
        </Button>
      </section>

      <div class="or">
        <span>{t('oder einem Raum beitreten')}</span>
      </div>

      <section class="card choice" aria-labelledby="join-title">
        <div class="choice-head">
          <span class="choice-icon is-join">
            <EnterIcon />
          </span>
          <div>
            <h2 id="join-title">{t('Mitspielen')}</h2>
            <p class="muted small">{t('Du hast einen Raumcode bekommen? Gib ihn hier ein.')}</p>
          </div>
        </div>
        <JoinForm code={code} onCode={setCode} onJoined={(s) => navigate(`/r/${s.code}`)} askCode />
      </section>

      <Guide />
      <ThemeFold />

      <footer class="footnote">
        {t(
          'Fragen aus allen 27 Büchern des Neuen Testaments und ausgewählten Geschichten des Alten Testaments · freikirchlich-pfingstliche Lernfassung',
        )}
      </footer>
      <LegalLinks />
    </main>
  );
}

/** Erste Entscheidung ohne Anmeldung oder Zeitdruck: so versteht man den Bluff, bevor man selbst einen schreibt. */
function QuickPreview({ onPlay, busy }: { onPlay: () => void; busy: boolean }) {
  const [choice, setChoice] = useState<number | null>(null);
  const answers = [
    t('Er bat um eine Kaffeepause.'),
    t('Er schlief ein und fiel aus dem Fenster.'),
    t('Er übernahm spontan die Predigt.'),
  ];
  return (
    <section class="card quick-preview" aria-labelledby="preview-title">
      <p class="eyebrow">{t('Eine Frage zum Ausprobieren')}</p>
      <h2 id="preview-title">{t('Was geschah Eutychus, als Paulus bis Mitternacht redete?')}</h2>
      <p class="muted small">{t('Zwei Antworten sind erfunden. Welche steht wirklich in der Bibel?')}</p>
      <div class="preview-answers">
        {answers.map((answer, index) => (
          <button
            key={index}
            type="button"
            class={`preview-answer${choice !== null && index === 1 ? ' is-true' : ''}${choice === index && index !== 1 ? ' is-bluff' : ''}`}
            onClick={() => setChoice(index)}
            aria-pressed={choice === index}
          >
            <span class="preview-letter">{String.fromCharCode(65 + index)}</span>
            <span>{answer}</span>
          </button>
        ))}
      </div>
      {choice !== null && (
        <div class="preview-reveal" role="status">
          <b>{choice === 1 ? t('Treffer!') : t('Reingelegt!')}</b>{' '}
          {t('Eutychus fiel tatsächlich schlafend aus dem Fenster. Paulus ging zu ihm hinab, und der Junge wurde lebend nach Hause gebracht. Apostelgeschichte 20,7–12.')}
          <p>{t('Im Spiel erfindest du selbst solche Bluffs – und versuchst, Josephs Antwort zu durchschauen.')}</p>
          <Button variant="gold" block disabled={busy} onClick={onPlay}>
            {busy ? t('Spiel startet …') : t('Jetzt gegen Joseph spielen')}
          </Button>
        </div>
      )}
      <button type="button" class="preview-custom" onClick={() => navigate('/joseph')}>
        {t('Partie mit eigenen Einstellungen starten →')}
      </button>
    </section>
  );
}

/** Josephs Gesicht für die Startseite und den Anfang einer Partie mit ihm */
function JosephPortrait() {
  return <Avatar person={{ id: BOT_ID, name: BOT_NAME, color: BOT_COLOR }} size="lg" />;
}

/** So oft fragt die Startseite nach offenen Räumen, solange sie sichtbar ist */
const OPEN_ROOMS_POLL_MS = 10_000;

/** Räume, deren Leitung sie öffentlich zeigt – nur die in der gewählten Sprache. Erscheint nur, wenn es gerade welche gibt. */
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

  const lang = currentLang();
  const shown = rooms.filter((r) => (r.lang ?? 'de') === lang);
  if (shown.length === 0) return null;
  return (
    <section class="card open-rooms" aria-labelledby="open-rooms-title">
      <h2 id="open-rooms-title">{t('Offene Räume')}</h2>
      <p class="muted small">{t('Hier wird gerade gespielt, und neue Leute sind willkommen.')}</p>
      <ul class="open-room-list">
        {shown.map((r) => (
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
                <b>{t('Raum {code}', { code: r.code })}</b>
                <small>
                  {r.status === 'lobby' ? t('Wartet auf den Start') : t('Runde {round} von {rounds} läuft', { round: r.round ?? 1, rounds: r.rounds })}
                </small>
                <small>{roomMeta(r)}</small>
              </span>
              <span class="open-room-go">{t('Mitspielen')}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function roomMeta(r: PublicRoom) {
  const people = r.people === 1 ? t('1 Person') : t('{n} Personen', { n: r.people });
  return `${people} · ${difficultyLabel(r.difficulty)}`;
}

function difficultyLabel(value: PublicRoom['difficulty']) {
  const label = DIFFICULTY_OPTIONS.find((o) => o.value === value)?.label;
  return label ? t(label) : value;
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
    if (!code) return setError(t('Bitte gib den Raumcode ein.'));
    if (!name.trim()) return setError(t('Bitte gib einen Spitznamen ein.'));
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
        setError(err instanceof Error ? err.message : t('Beitritt fehlgeschlagen.'));
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
          {t('Ja, das bin ich – wieder einsteigen')}
        </Button>
        <Button
          block
          variant="ghost"
          onClick={() => {
            setReclaim(null);
            setName('');
          }}
        >
          {t('Nein, anderen Namen wählen')}
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
          <span>{t('Raumcode')}</span>
          <input
            class="code-input"
            value={props.code}
            onInput={(e) => props.onCode?.(normalizeCode((e.currentTarget as HTMLInputElement).value))}
            placeholder={t('z. B. LAMPE7')}
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
        <span>{t('Dein Spitzname')}</span>
        <input
          value={name}
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          placeholder={t('z. B. Mirjam')}
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
        {busy ? t('Trete bei …') : t('Beitreten')}
      </Button>
    </form>
  );
}

/**
 * Raum eröffnen – oder mit `bot` einen eigenen Raum, in dem Joseph schon mitspielt. Der Raum bekommt die
 * Sprache, die auf der Startseite gewählt ist.
 */
export function CreateRoom({ bot = false }: { bot?: boolean }) {
  const [name, setName] = useState(rememberedName());
  const [plays, setPlays] = useState(true);
  const [settings, setSettings] = useState<Settings>(() => ({ ...(bot ? BOT_SETTINGS : DEFAULT_SETTINGS), lang: preferredLang() }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const create = async () => {
    if (!name.trim()) return setError(t('Bitte gib einen Spitznamen ein.'));
    setBusy(true);
    setError(null);
    try {
      const res = await api.createRoom(name, bot || plays, settings, bot);
      saveSession({ code: res.code, token: res.token, playerId: res.playerId, name: res.view.me?.name ?? name });
      navigate(`/r/${res.code}`, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Das hat nicht geklappt.'));
      setBusy(false);
    }
  };

  return (
    <main class="page create">
      <header class="page-head">
        <button class="back" onClick={() => navigate('/')} aria-label={t('Zurück')}>
          ←
        </button>
        <Logo small />
      </header>
      <h1>{bot ? t('Gegen {bot} spielen', { bot: BOT_NAME }) : t('Raum eröffnen')}</h1>
      {bot && (
        <div class="bot-intro">
          <JosephPortrait />
          <p class="lead">
            {t('{bot} schreibt Bluffs und rät mit. Der Raum gehört dir: Du startest, wann du willst, und kannst auch Freunde einladen.', {
              bot: BOT_NAME,
            })}
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
          <span>{t('Dein Spitzname')}</span>
          <input
            value={name}
            onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
            placeholder={t('z. B. Timotheus')}
            maxLength={NAME_MAX}
            required
          />
        </label>

        {!bot && (
          <Toggle
            checked={plays}
            onChange={setPlays}
            label={t('Ich spiele mit')}
            hint={plays ? t('Du leitest und spielst auf diesem Handy.') : t('Dieses Gerät leitet nur – ideal für Beamer oder Fernseher.')}
          />
        )}
        {!bot && <HeartToggle checked={settings.heartRound} onChange={(heartRound) => set({ heartRound })} />}

        {bot ? (
          <details class="more-settings">
            <summary>
              <span>{t('Einstellungen')}</span>
              <span class="muted small">{settingsSummary(settings)}</span>
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
          {busy ? t('Raum wird eröffnet …') : bot ? t('Raum mit {bot} eröffnen', { bot: BOT_NAME }) : t('Raum eröffnen')}
        </Button>
      </form>
      <LegalLinks />
    </main>
  );
}

/** Herzensrunde ein oder aus – beim Eröffnen und im Warteraum (nicht in Räumen mit Joseph) */
export function HeartToggle({ checked, onChange }: { checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <Toggle
      checked={checked}
      onChange={onChange}
      label={t('Herzensrunde am Ende')}
      hint={
        checked
          ? t(
              'Zum Schluss eine Runde ohne Punkte: Alle schreiben ehrlich, zum Beispiel was sie an Jesus überrascht hat. Die Antworten erscheinen ohne Namen.',
            )
          : t('Ohne Herzensrunde: Nach der letzten Runde kommt gleich der Endstand.')
      }
    />
  );
}

function roundTypeHint(type: RoundType): string {
  if (type === 'fragen') return t('Bibelfragen – alle erfinden eine falsche Antwort.');
  if (type === 'luecken') return t('Ein Satz mit Lücke – alle erfinden, was hineingehört.');
  return t('Fragen und Lückentexte: etwa jede dritte Runde ist ein Lückentext.');
}

export function SettingsFields(props: { settings: Settings; onChange: (patch: Partial<Settings>) => void; disabled?: boolean }) {
  const { settings, onChange, disabled } = props;
  const pool = usePool(settings.lang);
  const available = pool ? poolCount(pool, settings) : null;
  const all = settings.categories.length >= ALL_CATEGORIES.length;
  const toggle = (id: CategoryId) => {
    const on = settings.categories.includes(id);
    // Mindestens eine Kategorie bleibt gewählt
    if (on && settings.categories.length === 1) return;
    const next = on ? settings.categories.filter((c) => c !== id) : [...settings.categories, id];
    onChange({ categories: ALL_CATEGORIES.filter((c) => next.includes(c)) });
  };
  return (
    <div class="settings">
      <div class="field">
        <span>{t('Runden')}</span>
        <Segmented
          label={t('Runden')}
          value={settings.rounds}
          options={ROUND_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
          onChange={(rounds) => onChange({ rounds })}
          disabled={disabled}
        />
      </div>
      <div class="field">
        <span>{t('Rundenart')}</span>
        <Segmented
          label={t('Rundenart')}
          value={settings.roundType}
          options={ROUND_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))}
          onChange={(roundType) => onChange({ roundType })}
          disabled={disabled}
        />
        <small class="field-hint">{roundTypeHint(settings.roundType)}</small>
      </div>
      <div class="field">
        <span class="field-head">
          {t('Kategorien')}
          {!all && (
            <button type="button" class="link-btn" disabled={disabled} onClick={() => onChange({ categories: [...ALL_CATEGORIES] })}>
              {t('Alle wählen')}
            </button>
          )}
        </span>
        <div class="cat-chips" role="group" aria-label={t('Kategorien')}>
          {CATEGORIES.map((c) => {
            const on = settings.categories.includes(c.id);
            const n = pool ? categoryCount(pool, c.id, settings.roundType) : null;
            return (
              <button
                type="button"
                class={`cat-chip${on ? ' is-on' : ''}`}
                aria-pressed={on}
                disabled={disabled || (n === 0 && !on)}
                onClick={() => toggle(c.id)}
              >
                <span>{t(c.label)}</span>
                {n !== null && <small>{n}</small>}
              </button>
            );
          })}
        </div>
        {available !== null && (
          <small class={`field-hint${available < settings.rounds ? ' is-warn' : ''}`}>
            {available < settings.rounds
              ? t('Mit dieser Auswahl gibt es nur {count} – die Partie hat dann {n} Runden.', {
                  count: poolAmount(available, settings.roundType),
                  n: available,
                })
              : t('{count} passen zu deiner Auswahl.', { count: poolAmount(available, settings.roundType) })}
          </small>
        )}
      </div>
      <div class="field">
        <span>{t('Schwierigkeit')}</span>
        <Segmented
          label={t('Schwierigkeit')}
          value={settings.difficulty}
          options={DIFFICULTY_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))}
          onChange={(difficulty) => onChange({ difficulty })}
          disabled={disabled}
        />
      </div>
      <div class="field">
        <span>{t('Zeit zum Bluffen')}</span>
        <Segmented
          label={t('Zeit zum Bluffen')}
          value={settings.writeSeconds}
          options={WRITE_OPTIONS.map((n) => ({ value: n, label: `${n} s` }))}
          onChange={(writeSeconds) => onChange({ writeSeconds })}
          disabled={disabled}
        />
      </div>
      <div class="field">
        <span>{t('Zeit zum Abstimmen')}</span>
        <Segmented
          label={t('Zeit zum Abstimmen')}
          value={settings.voteSeconds}
          options={VOTE_OPTIONS.map((n) => ({ value: n, label: `${n} s` }))}
          onChange={(voteSeconds) => onChange({ voteSeconds })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
