import { useState } from 'preact/hooks';
import { PROFESSOR_INTERJECTIONS, professorInterjection } from '../../shared/professor-interjections';
import type { KidsGame } from '../../shared/kids-game';
import type { KidsRemoteAction } from '../../shared/kids-remote';

const categories = [...new Set(PROFESSOR_INTERJECTIONS.map(clip => clip.category))];
export function KidsSoundboard({ game, disabled, send }: { game: KidsGame; disabled: boolean; send: (action: KidsRemoteAction) => Promise<void> }) {
  const [category, setCategory] = useState<string>('Mitmachen');
  const last = game.voiceKind === 'interjection' ? professorInterjection(game.voiceClip) : null;
  return <details class="kids-remote-direction kids-soundboard">
    <summary>♪ Zwischendurch-Sprüche</summary>
    <p>Jederzeit auf Knopfdruck am Beamer abspielen.</p>
    <label>Art der Ansage<select value={category} onChange={event => setCategory(event.currentTarget.value)}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <div class="kids-soundboard-clips">{PROFESSOR_INTERJECTIONS.filter(clip => clip.category === category).map(clip => <div key={clip.id}>
      <button type="button" class="kids-button" disabled={disabled} aria-label={`${clip.label} am Beamer abspielen`} onClick={() => { void send(`interjection:${clip.id}`); }}>▶ {clip.label}</button>
      <p>{clip.text}</p>
    </div>)}</div>
    {last && <p class="kids-soundboard-last">Zuletzt gestartet: {last.label}</p>}
    <button type="button" class="kids-button" disabled={disabled} onClick={() => { void send('stop-speech'); }}>■ Professor-Audio stoppen</button>
    <small>Ein neuer Spruch ersetzt die laufende Sprache. Beim Wechsel der Spielphase stoppt die Aufnahme.</small>
  </details>;
}
