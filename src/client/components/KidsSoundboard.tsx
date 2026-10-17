import { useState } from 'preact/hooks';
import { PROFESSOR_INTERJECTIONS, professorInterjection } from '../../shared/professor-interjections';
import type { KidsGame } from '../../shared/kids-game';
import type { KidsRemoteAction } from '../../shared/kids-remote';
import { professorVoiceKey } from '../../shared/professor-voice';
import { kidsClaimPhase, professorSays } from './KidsShow';

const categories = [...new Set(PROFESSOR_INTERJECTIONS.map(clip => clip.category))];
type SoundboardProps = { game: KidsGame; disabled: boolean; send: (action: KidsRemoteAction) => Promise<void> };

/** Nur die wesentlichen Ansagen stehen beim Ablauf; alle anderen bleiben im Audio-Reiter erreichbar. */
const phaseAudio = {
  welcome: ['together'], chapter: ['listen'], superbluff: ['nervous'], reading: [],
  scene: ['support'], moving: ['signal-countdown', 'cheer'], paused: ['signal-pause', 'think'],
  locked: ['signal-stop'], returning: ['return'], judging: ['regroup-ready'],
  revealed: ['result-correct', 'result-participated', 'result-none', 'applause'], finished: ['closing-jesus', 'applause'],
} as const satisfies Record<KidsGame['phase'], readonly typeof PROFESSOR_INTERJECTIONS[number]['id'][]>;

function InterjectionButton({ clip, game, disabled, send }: SoundboardProps & { clip: typeof PROFESSOR_INTERJECTIONS[number] }) {
  const countdown = clip.id === 'signal-countdown' && game.phase === 'moving';
  const label = countdown ? 'Countdown für letzte 5 Sekunden vormerken' : clip.label;
  return <div class="kids-audio-clip">
    <button type="button" class="kids-button" disabled={disabled} aria-label={countdown ? label : `${label} am Beamer abspielen`} onClick={() => { void send(`interjection:${clip.id}`); }}><span aria-hidden="true">▶</span> {label}</button>
    <p>{countdown ? 'Professor zählt passend zum Timer fünf bis eins. Pause, ein anderes Audio oder ein Phasenwechsel heben die Vormerkung auf.' : clip.text}</p>
  </div>;
}

export function KidsPhaseAudio({ game, disabled, send }: SoundboardProps) {
  const groupCall = ['chapter', 'superbluff', 'reading'].includes(game.phase) ? professorInterjection(`call-${game.rounds[game.index].question.group}`) : null;
  return <section class="kids-remote-direction kids-soundboard kids-phase-audio" aria-label="Audio zur aktuellen Spielphase">
    <h2><span>2</span> Passende Audios</h2><p>Antippen → Professor spricht am Beamer</p>
    <div class="kids-soundboard-clips">
      {groupCall && <InterjectionButton clip={groupCall} game={game} disabled={disabled} send={send}/>}
      {game.phase === 'reading' && <div class="kids-audio-clip"><button class="kids-button" type="button" disabled={disabled} onClick={() => { void send('read-question'); }}>▶ Frage am Beamer vorlesen</button></div>}
      {professorVoiceKey(game) && <div class="kids-audio-clip"><button type="button" class="kids-button" disabled={disabled} onClick={() => { void send('speak'); }}>▶ Spruch am Beamer abspielen</button><p>{professorSays(game)}</p></div>}
      {kidsClaimPhase(game.phase) && <div class="kids-audio-claim"><b>Professor-Tipp · selbst mit Professor-Stimme vorlesen</b><p>{professorSays(game)}</p></div>}
      {phaseAudio[game.phase].map(id => <InterjectionButton key={id} clip={professorInterjection(id)!} game={game} disabled={disabled} send={send}/>)}
    </div>
    {game.phase === 'reading' && game.rounds[game.index].question.scene && <button class="kids-button kids-scene-play" type="button" aria-label="Szene am Beamer abspielen" disabled={disabled} onClick={() => { void send('scene'); }}>▷ Szene am Beamer abspielen</button>}
    {game.phase === 'moving' && game.voicePlaying && game.voiceKind === 'interjection' && game.voiceClip === 'signal-countdown' && game.voiceCue === `moving:${game.index}` && <p role="status">{game.remainingMs > 5000 ? 'Countdown vorgemerkt · Professor zählt in den letzten 5 Sekunden.' : 'Professor zählt jetzt mit.'}</p>}
  </section>;
}

export function KidsSoundboard({ game, disabled, send }: SoundboardProps) {
  const [category, setCategory] = useState<string>('Mitmachen');
  const [query, setQuery] = useState('');
  const last = game.voiceKind === 'interjection' ? professorInterjection(game.voiceClip) : null;
  const term = query.trim().toLocaleLowerCase('de');
  const clips = PROFESSOR_INTERJECTIONS.filter(clip => term ? `${clip.label} ${clip.text} ${clip.category}`.toLocaleLowerCase('de').includes(term) : clip.category === category);
  return <section class="kids-remote-direction kids-soundboard kids-all-audio" aria-labelledby="kids-soundboard-title">
    <h2 id="kids-soundboard-title">Zwischendurch-Sprüche</h2><p>Freie Ansagen für jede Situation. Alle Aufnahmen starten am Beamer.</p>
    <label>Ansage suchen<input type="search" value={query} placeholder="z. B. anfeuern, Pause, Jesus …" onInput={event => setQuery(event.currentTarget.value)}/></label>
    <label>Art der Ansage<select value={category} onChange={event => { setCategory(event.currentTarget.value); setQuery(''); }}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <p class="kids-audio-count" role="status">{term ? `${clips.length} Treffer in allen Kategorien` : `${clips.length} Ansagen · ${category}`}</p>
    <div class="kids-soundboard-clips">{clips.map(clip => <InterjectionButton key={clip.id} clip={clip} game={game} disabled={disabled} send={send}/>)}</div>
    {clips.length === 0 && <p>Keine Ansage gefunden. Probiere ein anderes Wort oder wähle eine Kategorie.</p>}
    {last && <p class="kids-soundboard-last">Zuletzt gestartet: {last.label}</p>}
    <small>Ein neues Audio ersetzt die laufende Sprache. Beim Wechsel der Spielphase stoppt die Aufnahme.</small>
  </section>;
}
