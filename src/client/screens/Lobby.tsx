import { useState } from 'preact/hooks';
import { BOT_NAME, MIN_PLAYERS, RECOMMENDED_MIN_PLAYERS } from '../../shared/rules';
import type { RoomView, Settings } from '../../shared/types';
import { QRCode } from '../components/QR';
import { Avatar, Button, Rules, Toast, Toggle } from '../components/ui';
import type { RoomConnection } from '../lib/hooks';
import { roomUrl } from '../lib/router';
import { shareLink } from '../lib/share';
import { SettingsFields } from './Start';

export function RoomCodeCard({ code, big = false }: { code: string; big?: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const url = roomUrl(code);
  const share = async () => setToast(await shareLink({ title: 'Bible Bluff', text: `Spiel mit! Raumcode ${code}`, url }));
  return (
    <section class={`code-card${big ? ' is-big' : ''}`}>
      <div class="code-card-head">
        <p class="eyebrow">Raumcode</p>
        <p class="room-code" aria-label={`Raumcode ${code.split('').join(' ')}`}>
          {code}
        </p>
      </div>
      <div class="code-card-text">
        <p class="muted small">
          QR-Code scannen oder <b>{location.host}</b> öffnen und den Code eingeben.
        </p>
        {!big && (
          <Button variant="secondary" small onClick={share}>
            Einladung teilen
          </Button>
        )}
      </div>
      <QRCode value={url} label={`QR-Code zum Beitreten in Raum ${code}`} />
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
            {p.id === view.me?.id && <small> (du)</small>}
          </span>
          {p.bot ? (
            <span class="badge is-soft" title="Spielt automatisch mit">
              Bot
            </span>
          ) : (
            p.isHost && (
              <span class="badge" title="Spielleitung">
                Leitung
              </span>
            )
          )}
          {!p.plays && <span class="badge is-soft">schaut zu</span>}
          {showScore && p.plays && <span class="player-score">{p.score}</span>}
          <span class={`dot${p.online ? ' is-on' : ''}`} title={p.online ? 'verbunden' : 'nicht verbunden'} />
        </li>
      ))}
    </ul>
  );
}

export function Lobby({ view, conn }: { view: RoomView; conn: RoomConnection }) {
  const isHost = Boolean(view.me?.isHost);
  const playing = view.players.filter((p) => p.plays).length;
  const withBot = view.players.some((p) => p.bot);
  const [error, setError] = useState<string | null>(null);

  const change = async (patch: { settings?: Partial<Settings>; hostPlays?: boolean }) => {
    setError(null);
    try {
      await conn.act({ type: 'settings', ...patch });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };

  const setListed = async (listed: boolean) => {
    setError(null);
    try {
      await conn.act({ type: 'listed', listed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };

  const start = async () => {
    setError(null);
    try {
      await conn.act({ type: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Start fehlgeschlagen.');
    }
  };

  return (
    <section class="lobby stack-lg">
      <RoomCodeCard code={view.code} />

      <section class="card">
        <h2 class="card-title">
          Dabei <span class="count">{playing}</span>
        </h2>
        <PlayerList view={view} />
        {view.locked && <p class="notice small">Der Raum ist für neue Teilnehmende gesperrt.</p>}
        {view.listed && !isHost && (
          <p class="notice small">Öffentlicher Raum: Er steht auf der Startseite, und alle können beitreten.</p>
        )}
        <p class="fresh-note small" title="Fragen, die auf diesen Handys schon aufgelöst wurden, kommen erst später dran.">
          <span aria-hidden="true">✦</span> Für alle neu: <b>{view.freshCount}</b> von {view.poolSize} Fragen
        </p>
      </section>

      {isHost ? (
        <section class="card">
          <h2 class="card-title">Einstellungen</h2>
          <Toggle
            checked={view.hostPlays}
            onChange={(hostPlays) => change({ hostPlays })}
            label="Ich spiele mit"
            hint={view.hostPlays ? 'Du leitest und spielst.' : 'Du leitest nur – dieses Gerät zeigt die gemeinsame Ansicht.'}
          />
          <Toggle
            checked={view.listed}
            onChange={setListed}
            label="Öffentlich zeigen"
            hint={
              !view.listed
                ? 'Nur wer den Code oder Link hat, kommt herein. Schalte das nur ein, wenn Fremde willkommen sind.'
                : view.locked
                  ? 'Solange der Raum gesperrt ist, erscheint er nicht auf der Startseite.'
                  : 'Der Raum steht auf der Startseite, und alle können beitreten. Lass ihn offen, dann meldet sich dein Handy, wenn jemand dazukommt.'
            }
          />
          <SettingsFields settings={view.settings} onChange={(settings) => change({ settings })} />
        </section>
      ) : (
        <section class="card summary">
          <h2 class="card-title">Partie</h2>
          <p>
            {view.settings.rounds} Runden · {cap(view.settings.difficulty)} · {view.settings.writeSeconds} s bluffen ·{' '}
            {view.settings.voteSeconds} s abstimmen
          </p>
        </section>
      )}

      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}

      {isHost ? (
        <div class="sticky-action">
          <Button variant="gold" block disabled={playing < MIN_PLAYERS} onClick={start}>
            Partie starten
          </Button>
          <p class="muted small center">
            {playing < MIN_PLAYERS
              ? `Warte auf Mitspielende – mindestens ${MIN_PLAYERS}.`
              : withBot && playing < RECOMMENDED_MIN_PLAYERS
                ? `Startklar – ${BOT_NAME} ist bereit.`
                : playing < RECOMMENDED_MIN_PLAYERS
                  ? `Startklar. Am meisten Spaß macht es ab ${RECOMMENDED_MIN_PLAYERS} Personen.`
                  : 'Alle da? Dann los!'}
          </p>
        </div>
      ) : (
        <p class="waiting">
          <span class="pulse" aria-hidden="true" />
          Gleich geht’s los – die Spielleitung startet die Partie.
        </p>
      )}

      <Rules compact />
    </section>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
