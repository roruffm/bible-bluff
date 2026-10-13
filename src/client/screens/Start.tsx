import type { ComponentChildren } from 'preact';
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
import { TOPIC_PACKS } from '../../shared/topic-packs';
import type { CategoryId, PublicRoom, RoundType, Settings } from '../../shared/types';
import { Guide } from '../components/Guide';
import { BluffPractice } from '../components/BluffPractice';
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
  const [showGuide, setShowGuide] = useState(false);
  const [showColors, setShowColors] = useState(false);
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
        writeSeconds: 90,
        voteSeconds: 30,
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
        <p class="tagline">{t('Bibelwissen hilft. Bluffen auch.')}</p>
        <div class="hero-start">
          <Button variant="gold" block disabled={quickBusy} onClick={quickPlay}>
            <Avatar person={{ id: BOT_ID, name: BOT_NAME, color: BOT_COLOR }} />
            <span>{quickBusy ? t('Spiel startet …') : t('Jetzt gegen {bot} spielen', { bot: BOT_NAME })}</span>
            <svg class="hero-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
          <p class="hero-entry-note">{t('Virtueller Mitspieler · ohne Anmeldung')}</p>
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

      <section class="card home-ways">
        <button type="button" class="home-way" onClick={() => navigate('/neu')}>
          <span class="choice-icon is-create">
            <FriendsIcon />
          </span>
          <span class="home-way-text">
            <strong>{t('Mit Freunden spielen')}</strong>
            <small>{t('Raum eröffnen')}</small>
          </span>
          <Chevron />
        </button>
        <details class="home-join">
          <summary class="home-way">
            <span class="choice-icon is-join">
              <EnterIcon />
            </span>
            <span class="home-way-text">
              <strong>{t('Einem Spiel beitreten')}</strong>
              <small>{t('Raumcode eingeben')}</small>
            </span>
            <Chevron />
          </summary>
          <div class="home-join-form">
            <JoinForm code={code} onCode={setCode} onJoined={(s) => navigate(`/r/${s.code}`)} askCode />
          </div>
        </details>
      </section>

      <nav class="home-tools" aria-label={t('Anleitung und Einstellungen')}>
        <button type="button" aria-expanded={showGuide} aria-controls="home-guide" onClick={() => setShowGuide(!showGuide)}>{t('So geht’s')}</button>
        <button type="button" onClick={() => navigate('/jakob')}>{t('Spiel anpassen')}</button>
        <button type="button" aria-expanded={showColors} aria-controls="home-colors" onClick={() => setShowColors(!showColors)}>{t('Farben')}</button>
      </nav>
      <div id="home-guide" hidden={!showGuide}><Guide /></div>
      <div id="home-colors" hidden={!showColors}><ThemeFold /></div>
      <LegalLinks />
    </main>
  );
}

function Chevron() {
  return (
    <svg class="home-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Erste Entscheidung ohne Anmeldung oder Zeitdruck: so versteht man den Bluff, bevor man selbst einen schreibt. */
function QuickPreview({ onPlay, busy }: { onPlay: () => void; busy: boolean }) {
  const [choice, setChoice] = useState<number | null>(null);
  const answers = [
    t('In einem Brotlaib.'),
    t('Im Maul eines Fisches.'),
    t('In einem Vogelnest.'),
  ];
  return (
    <section class="card quick-preview" aria-labelledby="preview-title">
      <p class="eyebrow">{t('Probefrage')}</p>
      <h2 id="preview-title">{t('Wo sollte Petrus eine Münze finden?')}</h2>
      <p class="muted small">{t('Eine Antwort ist echt. Welche?')}</p>
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
        <BluffPractice onReveal={() => setChoice(3)} />
      </div>
      {choice !== null && (
        <div class="preview-reveal" role="status">
          <p class="preview-result"><b>{choice === 3 ? t('Jetzt kennst du beide Seiten: raten und bluffen!') : choice === 1 ? t('Treffer!') : t('Reingelegt!')}</b></p>
          <p>{t('Ein Fisch als Geldbörse! Jesus schickte Petrus angeln: Die Münze im Fischmaul sollte die Tempelsteuer für beide bezahlen.')}</p>
          <p class="preview-source">{t('Matthäus 17,24–27')}</p>
          <p class="preview-next">{t('Jetzt bist du dran: Erfinde einen Bluff und leg {bot} rein.', { bot: BOT_NAME })}</p>
          <Button variant="gold" block disabled={busy} onClick={onPlay}>
            {busy ? t('Spiel startet …') : t('Jetzt gegen {bot} spielen', { bot: BOT_NAME })}
          </Button>
        </div>
      )}
    </section>
  );
}

/** Jakobs Gesicht für die Startseite und den Anfang einer Partie mit ihm */
function JakobPortrait() {
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
 * Raum eröffnen – oder mit `bot` einen eigenen Raum, in dem Jakob schon mitspielt. Der Raum bekommt die
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
          <JakobPortrait />
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

        {bot ? (
          <details class="more-settings">
            <summary>
              <span>{t('Einstellungen')}</span>
              <span class="muted small">{settingsSummary(settings)}</span>
            </summary>
            <SettingsFields settings={settings} onChange={set} />
          </details>
        ) : (
          <SettingsFields settings={settings} onChange={set} compact extra={
            <>
              <Toggle checked={plays} onChange={setPlays} label={t('Ich spiele mit')}
                hint={plays ? t('Du leitest und spielst auf diesem Handy.') : t('Dieses Gerät leitet nur – ideal für Beamer oder Fernseher.')} />
              <HeartToggle checked={settings.heartRound} onChange={(heartRound) => set({ heartRound })} />
            </>
          } />
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

/** Herzensrunde ein oder aus – beim Eröffnen und im Warteraum (nicht in Räumen mit Jakob) */
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

export function SettingsFields(props: { settings: Settings; onChange: (patch: Partial<Settings>) => void; disabled?: boolean; compact?: boolean; extra?: ComponentChildren }) {
  const { settings, onChange, disabled, compact = false, extra } = props;
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
  const advanced = (
    <div class="settings">
      {extra}
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
            const scoped = settings.topicPack ? pool?.packs?.find((p) => p.id === settings.topicPack) : pool;
            const n = scoped ? categoryCount(scoped, c.id, settings.roundType) : null;
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
        <span>{t('Themenpakete')}</span>
        <div class={`topic-packs${compact ? ' is-compact' : ''}`} role="group" aria-label={t('Themenpakete')}>
          <button type="button" class={`topic-pack topic-pack-all${!settings.topicPack ? ' is-on' : ''}`} aria-pressed={!settings.topicPack} disabled={disabled} onClick={() => onChange({ topicPack: null })}>
            <strong>{t('Alle Themen')}</strong><small>{t('Deine Bibelbereiche frei kombinieren.')}</small>
          </button>
          {TOPIC_PACKS.map((p) => {
            const n = pool?.packs ? poolCount(pool, { ...settings, categories: ALL_CATEGORIES, topicPack: p.id }) : null;
            return <button type="button" class={`topic-pack${settings.topicPack === p.id ? ' is-on' : ''}`} aria-pressed={settings.topicPack === p.id} disabled={disabled || n === 0} onClick={() => onChange({ topicPack: p.id, categories: [...ALL_CATEGORIES] })}>
              <strong>{t(p.label)}</strong><small>{t(p.hint)}</small>{n !== null && <span>{poolAmount(n, settings.roundType)}</span>}
            </button>;
          })}
        </div>
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
      {compact ? (
        <details class="more-settings advanced-settings">
          <summary>{t('Weitere Einstellungen')}</summary>
          {advanced}
        </details>
      ) : advanced}
    </div>
  );
}
