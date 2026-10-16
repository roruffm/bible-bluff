import { useState } from 'preact/hooks';
import { PROFESSOR_INTERJECTIONS, professorInterjection } from '../../shared/professor-interjections';
import type { KidsGame } from '../../shared/kids-game';
import type { KidsRemoteAction } from '../../shared/kids-remote';
import { professorVoiceKey } from '../../shared/professor-voice';
import { professorSays } from './KidsShow';

const categories = [...new Set(PROFESSOR_INTERJECTIONS.map(clip => clip.category))];
type SoundboardProps = { game: KidsGame; disabled: boolean; send: (action: KidsRemoteAction) => Promise<void> };

/** Die Technik findet passende Ansagen direkt beim aktuellen Spielschritt. */
const phaseAudio = {
  welcome: { title: 'Begrüßung', clips: ['together', 'quiet'] },
  chapter: { title: 'Kapitelstart', clips: ['listen', 'together'] },
  superbluff: { title: 'Finale', clips: ['together', 'nervous', 'listen'] },
  reading: { title: 'Frage vorlesen', clips: ['listen', 'try'] },
  scene: { title: 'Szene & Pantomime', clips: ['support'] },
  moving: { title: 'Antwortwahl · Anfeuern & Spannung', clips: ['walk', 'cheer', 'support', 'tricky', 'nervous'] },
  paused: { title: 'Pause · Zeit zum Nachdenken', clips: ['think', 'tricky', 'try', 'quiet'] },
  locked: { title: 'Stopp · Felder prüfen', clips: ['quiet'] },
  returning: { title: 'Zwischensequenz · Zurück zur Gruppe', clips: ['return', 'quiet'] },
  judging: { title: 'Zwischensequenz · Vor der Auflösung', clips: ['quiet', 'together'] },
  revealed: { title: 'Auflösung · Gemeinsam feiern', clips: ['applause', 'together'] },
  finished: { title: 'Abschluss · Applaus für alle', clips: ['applause', 'together'] },
} as const satisfies Record<KidsGame['phase'], { title: string; clips: readonly typeof PROFESSOR_INTERJECTIONS[number]['id'][] }>;

function InterjectionButton({ clip, disabled, send }: Pick<SoundboardProps, 'disabled' | 'send'> & { clip: typeof PROFESSOR_INTERJECTIONS[number] }) {
  return <div>
    <button type="button" class="kids-button" disabled={disabled} aria-label={`${clip.label} am Beamer abspielen`} onClick={() => { void send(`interjection:${clip.id}`); }}>▶ {clip.label}</button>
    <p>{clip.text}</p>
  </div>;
}

export function KidsPhaseAudio({ game, disabled, send }: SoundboardProps) {
  const context = phaseAudio[game.phase];
  return <section class="kids-remote-direction kids-soundboard kids-phase-audio" aria-label="Audio zur aktuellen Spielphase">
    <h2>♪ {context.title}</h2>
    <p>Passende Audios · manuell am Beamer abspielen</p>
    <div class="kids-soundboard-clips">
      {game.phase === 'reading' && <div>
        <button class="kids-button" type="button" disabled={disabled} onClick={() => { void send('read-question'); }}>▶ Frage am Beamer vorlesen</button>
        {game.index === 9 && <small>Finalfrage vorläufig mit deutscher Gerätestimme.</small>}
      </div>}
      {professorVoiceKey(game) && <div>
        <button type="button" class="kids-button" disabled={disabled} onClick={() => { void send('speak'); }}>▶ Spruch am Beamer abspielen</button>
        <p>{professorSays(game)}</p>
      </div>}
      {context.clips.map(id => <InterjectionButton key={id} clip={professorInterjection(id)!} disabled={disabled} send={send}/>)}
    </div>
    <button type="button" class="kids-button" disabled={disabled} onClick={() => { void send('stop-speech'); }}>■ Professor-Audio stoppen</button>
    <small>Ein neues Audio ersetzt die laufende Sprache. Beim Wechsel der Spielphase stoppt die Aufnahme.</small>
  </section>;
}

export function KidsSoundboard({ game, disabled, send }: SoundboardProps) {
  const [category, setCategory] = useState<string>('Mitmachen');
  const last = game.voiceKind === 'interjection' ? professorInterjection(game.voiceClip) : null;
  return <details class="kids-remote-direction kids-soundboard">
    <summary>♪ Zwischendurch-Sprüche</summary>
    <p>Alle freien Ansagen für besondere Situationen. Die zur Spielphase passenden Audios stehen direkt beim aktuellen Spielschritt.</p>
    <label>Art der Ansage<select value={category} onChange={event => setCategory(event.currentTarget.value)}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <div class="kids-soundboard-clips">{PROFESSOR_INTERJECTIONS.filter(clip => clip.category === category).map(clip => <InterjectionButton key={clip.id} clip={clip} disabled={disabled} send={send}/>)}</div>
    {last && <p class="kids-soundboard-last">Zuletzt gestartet: {last.label}</p>}
    <button type="button" class="kids-button" disabled={disabled} onClick={() => { void send('stop-speech'); }}>■ Zwischendurch-Spruch stoppen</button>
    <small>Ein neuer Spruch ersetzt die laufende Sprache. Beim Wechsel der Spielphase stoppt die Aufnahme.</small>
  </details>;
}
