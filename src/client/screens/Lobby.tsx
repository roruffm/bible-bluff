import { useState } from 'preact/hooks';
import { BOT_NAME, DIFFICULTY_OPTIONS, MIN_PLAYERS, RECOMMENDED_MIN_PLAYERS } from '../../shared/rules';
import type { RoomView, Settings } from '../../shared/types';
import { QRCode } from '../components/QR';
import { Avatar, Button, Rules, Toast, Toggle } from '../components/ui';
import type { RoomConnection } from '../lib/hooks';
import { currentLang, locale, t, tj } from '../lib/i18n';
import { poolAmount, poolAmountDative, settingsSummary } from '../lib/pool';
import { roomUrl } from '../lib/router';
import { shareLink } from '../lib/share';
import { HeartToggle, SettingsFields } from './Start';

export function RoomCodeCard({ code, big = false }: { code: string; big?: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  // Im Raum gilt die Sprache der Partie – englische Räume laden mit ?lang=en ein
  const url = roomUrl(code, currentLang());
  const share = async () => setToast(await shareLink({ title: 'Bible Bluff', text: t('Spiel mit! Raumcode {code}', { code }), url }));
  return (
    <section class={`code-card${big ? ' is-big' : ''}`}>
      <div class="code-card-head">
        <p class="eyebrow">{t('Raumcode')}</p>
        <p class="room-code" aria-label={t('Raumcode {code}', { code: code.split('').join(' ') })}>
          {code}
        </p>
      </div>
      <div class="code-card-text">
        <p class="muted small">{tj('QR-Code scannen oder {host} öffnen und den Code eingeben.', { host: <b>{location.host}</b> })}</p>
        {!big && (
          <Button variant="secondary" small onClick={share}>
            {t('Einladung teilen')}
          </Button>
        )}
      </div>
      <QRCode value={url} label={t('QR-Code zum Beitreten in Raum {code}', { code })} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </section>
  );
}

export function PlayerList({ view, showScore = false }: { view: RoomView; showScore?: boolean }) {
  return (
    <ul class="player-list">
      {view.players.map((p) => (
        <li class={`player${p.online ? '' : ' is-offline'}${p.id === view.me?.id ? ' is-me' : ''}`}>
          <Avatar person={p} />
          <span class="player-name">
            {p.name}
            {p.id === view.me?.id && <small> {t('(du)')}</small>}
          </span>
          {p.bot ? (
            <span class="badge is-soft" title={t('Spielt automatisch mit')}>
              Bot
            </span>
          ) : (
            p.isHost && (
              <span class="badge" title={t('Spielleitung')}>
                {t('Leitung')}
              </span>
            )
          )}
          {!p.plays && <span class="badge is-soft">{t('schaut zu')}</span>}
          {showScore && p.plays && <span class="player-score">{p.score}</span>}
          <span class={`dot${p.online ? ' is-on' : ''}`} title={p.online ? t('verbunden') : t('nicht verbunden')} />
        </li>
      ))}
    </ul>
  );
}

/** Schwierigkeit klein geschrieben für die Zusammenfassung: „gemischt“, „mixed“ */
function difficultyName(value: Settings['difficulty']): string {
  const label = DIFFICULTY_OPTIONS.find((o) => o.value === value)?.label;
  return label ? t(label).toLocaleLowerCase(locale()) : value;
}

export function Lobby({ view, conn }: { view: RoomView; conn: RoomConnection }) {
  const isHost = Boolean(view.me?.isHost);
  const playing = view.players.filter((p) => p.plays).length;
  const withBot = view.players.some((p) => p.bot);
  const [error, setError] = useState<string | null>(null);

  const change = async (patch: { settings?: Partial<Settings>; hostPlays?: boolean }) => {
    setError(null);
    try {
      await conn.act({ type: 'settings', ...patch }, { inline: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Das ging nicht.'));
    }
  };

  const setListed = async (listed: boolean) => {
    setError(null);
    try {
      await conn.act({ type: 'listed', listed }, { inline: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Das ging nicht.'));
    }
  };

  const start = async () => {
    setError(null);
    try {
      await conn.act({ type: 'start' }, { inline: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Start fehlgeschlagen.'));
    }
  };

  return (
    <section class="lobby stack-lg">
      <RoomCodeCard code={view.code} />

      <section class="card">
        <h2 class="card-title">
          {t('Dabei')} <span class="count">{playing}</span>
        </h2>
        <PlayerList view={view} />
        {view.locked && <p class="notice small">{t('Der Raum ist für neue Teilnehmende gesperrt.')}</p>}
        {view.listed && !isHost && (
          <p class="notice small">{t('Öffentlicher Raum: Er steht auf der Startseite, und alle können beitreten.')}</p>
        )}
        <p class="fresh-note small" title={t('Fragen, die auf diesen Handys schon aufgelöst wurden, kommen erst später dran.')}>
          <span aria-hidden="true">✦</span>{' '}
          {tj('Für alle neu: {fresh} von {count}', {
            fresh: <b>{view.freshCount}</b>,
            count: poolAmountDative(view.poolSize, view.settings.roundType),
          })}
        </p>
        {view.poolSize < view.settings.rounds && (
          <p class="notice small">
            {t('Zur gewählten Auswahl gibt es nur {count} – die Partie hat dann {n} Runden.', {
              count: poolAmount(view.poolSize, view.settings.roundType),
              n: view.poolSize,
            })}
          </p>
        )}
      </section>

      <section class="card summary lobby-summary">
        <h2 class="card-title">{t('Partie')}</h2>
        <p>{settingsSummary(view.settings)}</p>
        <p class="muted small">
          {t('Schwierigkeit {level} · {write} s bluffen · {vote} s abstimmen', {
            level: difficultyName(view.settings.difficulty), write: view.settings.writeSeconds, vote: view.settings.voteSeconds,
          })}
        </p>
        {isHost && (
          <details class="more-settings lobby-settings">
            <summary>{t('Einstellungen ändern')}</summary>
            <div class="settings">
              <Toggle checked={view.hostPlays} onChange={(hostPlays) => change({ hostPlays })} label={t('Ich spiele mit')}
                hint={view.hostPlays ? t('Du leitest und spielst.') : t('Du leitest nur – dieses Gerät zeigt die gemeinsame Ansicht.')} />
              <Toggle checked={view.listed} onChange={setListed} label={t('Öffentlich zeigen')}
                hint={!view.listed
                  ? t('Nur wer den Code oder Link hat, kommt herein. Schalte das nur ein, wenn Fremde willkommen sind.')
                  : view.locked
                    ? t('Solange der Raum gesperrt ist, erscheint er nicht auf der Startseite.')
                    : t('Der Raum steht auf der Startseite, und alle können beitreten. Lass ihn offen, dann meldet sich dein Handy, wenn jemand dazukommt.')} />
              {!withBot && <HeartToggle checked={view.settings.heartRound} onChange={(heartRound) => change({ settings: { heartRound } })} />}
              <SettingsFields settings={view.settings} onChange={(settings) => change({ settings })} />
            </div>
          </details>
        )}
      </section>

      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}

      {isHost ? (
        <div class="sticky-action">
          <Button variant="gold" block disabled={playing < MIN_PLAYERS} onClick={start}>
            {t('Partie starten')}
          </Button>
          <p class="muted small center">
            {playing < MIN_PLAYERS
              ? t('Warte auf Mitspielende – mindestens {min}.', { min: MIN_PLAYERS })
              : withBot && playing < RECOMMENDED_MIN_PLAYERS
                ? t('Startklar – {bot} ist bereit.', { bot: BOT_NAME })
                : playing < RECOMMENDED_MIN_PLAYERS
                  ? t('Startklar. Am meisten Spaß macht es ab {min} Personen.', { min: RECOMMENDED_MIN_PLAYERS })
                  : t('Alle da? Dann los!')}
          </p>
        </div>
      ) : (
        <p class="waiting">
          <span class="pulse" aria-hidden="true" />
          {t('Gleich geht’s los – die Spielleitung startet die Partie.')}
        </p>
      )}

      <details class="more-settings lobby-rules"><summary>{t('Spielregeln')}</summary><Rules compact /></details>
    </section>
  );
}
