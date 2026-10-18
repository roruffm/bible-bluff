import { useEffect, useState } from 'preact/hooks';
import { PROFESSOR_INTERJECTIONS, professorInterjection, professorInterjectionForRound } from '../../shared/professor-interjections';
import type { KidsGame } from '../../shared/kids-game';
import type { KidsRemoteAction } from '../../shared/kids-remote';
import { professorVoiceKey } from '../../shared/professor-voice';
import { kidsClaimPhase, professorSays } from './KidsShow';

const categories = [...new Set(PROFESSOR_INTERJECTIONS.map(clip => clip.category))];
type SoundboardProps = { game: KidsGame; disabled: boolean; send: (action: KidsRemoteAction) => Promise<void> };
type CompactSoundboardProps = SoundboardProps & { compact?: boolean };
const QUICK_AUDIO = ['cheer', 'quiet', 'tricky', 'applause', 'try', 'support'] as const;

/** Nur die wesentlichen Ansagen stehen beim Ablauf; alle anderen bleiben im Audio-Reiter erreichbar. */
const phaseAudio = {
  welcome: ['together'], chapter: ['listen'], superbluff: ['nervous'], reading: [],
  scene: ['support'], moving: ['signal-countdown', 'cheer'], paused: ['signal-pause', 'think'],
  locked: ['signal-stop'], returning: ['return'], judging: ['regroup-ready'],
  revealed: ['result-correct', 'result-participated', 'result-none', 'applause'], finished: ['closing-jesus', 'applause'],
} as const satisfies Record<KidsGame['phase'], readonly typeof PROFESSOR_INTERJECTIONS[number]['id'][]>;

function InterjectionButton({ clip, game, disabled, send, compact = false }: CompactSoundboardProps & { clip: typeof PROFESSOR_INTERJECTIONS[number] }) {
  const countdown = clip.id === 'signal-countdown' && game.phase === 'moving';
  const label = countdown ? 'Countdown für letzte 5 Sekunden vormerken' : clip.label;
  return <div class="kids-audio-clip">
    <button type="button" class="kids-button" disabled={disabled} title={compact ? clip.text : undefined} aria-label={countdown ? label : `${label} am Beamer abspielen`} onClick={() => { void send(`interjection:${clip.id}`); }}><span aria-hidden="true">▶</span> {label}</button>
    <p>{countdown ? 'Professor zählt passend zum Timer fünf bis eins. Pause, ein anderes Audio oder ein Phasenwechsel heben die Vormerkung auf.' : clip.text}</p>
  </div>;
}

export function KidsPhaseAudio({ game, disabled, send, compact = false }: CompactSoundboardProps) {
  const groupCall = ['chapter', 'superbluff', 'reading'].includes(game.phase) ? professorInterjection(`call-${game.rounds[game.index].question.group}`) : null;
  const clips = phaseAudio[game.phase].filter(id => !compact || !id.startsWith('result-') || id === `result-${game.results[game.index]}`);
  return <section class={`kids-remote-direction kids-soundboard kids-phase-audio${compact ? ' is-compact' : ''}`} aria-label="Audio zur aktuellen Spielphase">
    <h2>{!compact && <span>2</span>} {compact ? 'Jetzt passend' : 'Passende Audios'}</h2>{!compact && <p>Antippen → Professor spricht am Beamer</p>}
    <div class="kids-soundboard-clips">
      {groupCall && <InterjectionButton clip={groupCall} game={game} disabled={disabled} send={send} compact={compact}/>}
      {game.index === 9 && (game.phase === 'superbluff' || game.phase === 'reading') && <div class="kids-audio-clip"><button class="kids-button kids-question-read" type="button" disabled={disabled} onClick={() => { void send('interjection:finale-parents'); }}>▶ Eltern-Pantomime erklären</button></div>}
      {game.phase === 'reading' && <div class="kids-audio-clip"><button class="kids-button kids-question-read" type="button" disabled={disabled} onClick={() => { void send('read-question'); }}>▶ Frage am Beamer vorlesen</button></div>}
      {game.phase === 'reading' && <div class="kids-audio-clip"><button class="kids-button kids-question-read" type="button" disabled={disabled} title="Alle drei Antworten in der Reihenfolge der Felder 1, 2, 3 am Beamer vorlesen" onClick={() => { void send('read-answers'); }}>▶ Antworten vorlesen</button></div>}
      {professorVoiceKey(game) && <div class="kids-audio-clip"><button type="button" class="kids-button" disabled={disabled} title={compact ? professorSays(game) : undefined} onClick={() => { void send('speak'); }}>▶ Spruch am Beamer abspielen</button><p>{professorSays(game)}</p></div>}
      {!compact && kidsClaimPhase(game.phase) && <div class="kids-audio-claim"><b>Professor-Tipp · selbst mit Professor-Stimme vorlesen</b><p>{professorSays(game)}</p></div>}
      {clips.map(id => <InterjectionButton key={id} clip={professorInterjectionForRound(id, game.index)!} game={game} disabled={disabled} send={send} compact={compact}/>)}
    </div>
    {game.phase === 'reading' && game.rounds[game.index].question.scene && <button class="kids-button kids-scene-play" type="button" aria-label="Szene am Beamer abspielen" disabled={disabled} onClick={() => { void send('scene'); }}>▷ Szene am Beamer abspielen</button>}
    {game.phase === 'moving' && game.voicePlaying && game.voiceKind === 'interjection' && game.voiceClip === 'signal-countdown' && game.voiceCue === `moving:${game.index}` && <p role="status">{game.remainingMs > 5000 ? 'Countdown vorgemerkt · Professor zählt in den letzten 5 Sekunden.' : 'Professor zählt jetzt mit.'}</p>}
  </section>;
}

export function KidsSoundboard({ game, disabled, send, compact = false }: CompactSoundboardProps) {
  const [category, setCategory] = useState<string>('Mitmachen');
  const [query, setQuery] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  useEffect(() => { if (compact && query) setLibraryOpen(true); }, [compact]);
  const last = game.voiceKind === 'interjection' ? professorInterjection(game.voiceClip) : null;
  const term = query.trim().toLocaleLowerCase('de');
  const clips = PROFESSOR_INTERJECTIONS.filter(clip => professorInterjectionForRound(clip.id, game.index)?.id === clip.id)
    .filter(clip => clip.id !== 'finale-parents' || game.index === 9)
    .filter(clip => term ? `${clip.label} ${clip.text} ${clip.category}`.toLocaleLowerCase('de').includes(term) : clip.category === category);
  return <section class={`kids-remote-direction kids-soundboard kids-all-audio${compact ? ' is-compact' : ''}`} aria-labelledby="kids-soundboard-title">
    <h2 id="kids-soundboard-title">{compact ? 'Für zwischendurch' : 'Zwischendurch-Sprüche'}</h2>{!compact && <p>Freie Ansagen für jede Situation. Alle Aufnahmen starten am Beamer.</p>}
    {compact && <div class="kids-quick-audio">{QUICK_AUDIO.filter(id => !(phaseAudio[game.phase] as readonly string[]).includes(id)).map(id => <InterjectionButton key={id} clip={professorInterjection(id)!} game={game} disabled={disabled} send={send} compact/>)}</div>}
    <details class="kids-audio-library-toggle" open={!compact || libraryOpen} onToggle={event => { if (compact) setLibraryOpen(event.currentTarget.open); }}>
      <summary hidden={!compact}>Alle Zusatzaudios</summary>
      <div class="kids-audio-library">
    <label>Ansage suchen<input type="search" value={query} placeholder="z. B. anfeuern, Pause, Jesus …" onInput={event => setQuery(event.currentTarget.value)}/></label>
    <label>Art der Ansage<select value={category} onChange={event => { setCategory(event.currentTarget.value); setQuery(''); }}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <p class="kids-audio-count" role="status">{term ? `${clips.length} Treffer in allen Kategorien` : `${clips.length} Ansagen · ${category}`}</p>
    <div class="kids-soundboard-clips">{clips.map(clip => <InterjectionButton key={clip.id} clip={clip} game={game} disabled={disabled} send={send}/>)}</div>
    {clips.length === 0 && <p>Keine Ansage gefunden. Probiere ein anderes Wort oder wähle eine Kategorie.</p>}
    {last && <p class="kids-soundboard-last">Zuletzt gestartet: {last.label}</p>}
    <small>Ein neues Audio ersetzt die laufende Sprache. Beim Wechsel der Spielphase stoppt die Aufnahme.</small>
      </div>
    </details>
  </section>;
}
