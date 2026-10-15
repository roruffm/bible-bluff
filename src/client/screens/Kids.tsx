import { useEffect, useRef, useState } from 'preact/hooks';
import { KidsRegroup } from '../components/KidsRegroup';
import { KidsLogo } from '../components/KidsLogo';
import { QRCode } from '../components/QR';
import { ProfessorBluff, professorMood, professorSays, ShowControls, ShowScoreboard, StoryPicture, Treasure } from '../components/KidsShow';
import { KIDS_CHAPTERS, KIDS_GROUPS } from '../../shared/kids-show-questions';
import { kidsControlUrl, useKidsRemote } from '../lib/kids-remote';
import { enableKidsSound, playKidsScene } from '../lib/kids-sound';
import { createKidsGame, kidsPrimaryAction, kidsResultPoints, kidsScores, updateKidsGame, type KidsAction, type KidsGame } from '../lib/kids';
import { navigate } from '../lib/router';
import './kids.css';

function Celebration({ variant }: { variant: number }) {
  return <div class={`kids-celebration kids-party-${variant % 4}`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37 + 11) % 100}%`, '--delay': `${(i % 9) * 70}ms`, '--turn': `${i * 29}deg`, '--c': ['#ffd362', '#72d8c7', '#fba2af', '#95baf7'][i % 4] }}>{['✦','★','●'][variant % 3]}</i>)}</div>;
}
export function KidsPage() {
  const [game, setGame] = useState<KidsGame | null>(null);
  const [showExit, setShowExit] = useState(false), [showPair, setShowPair] = useState(false);
  const [fullscreen, setFullscreen] = useState(false), [fullscreenError, setFullscreenError] = useState('');
  const [presentation, setPresentation] = useState(false), [toolsOpen, setToolsOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const root = useRef<HTMLElement>(null), primary = useRef<HTMLButtonElement>(null), lastCue = useRef<number | null>(null);
  const remote = useKidsRemote('display', setGame);
  const act = (action: KidsAction) => {
    if (action !== 'tick' && remote.active) { void remote.send(action); return; }
    setGame((g) => g ? updateKidsGame(g, action, Date.now()) : g);
  };
  const current = useRef({ game, showExit, showPair, toolsOpen, act });
  current.current = { game, showExit, showPair, toolsOpen, act };
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;
  useEffect(() => { const old = document.title; document.title = 'BibleBluff Kids · Die große Bluff-Jagd'; return () => { document.title = old; }; }, []);
  useEffect(() => { const sync = () => setFullscreen(!!document.fullscreenElement); document.addEventListener('fullscreenchange', sync); return () => document.removeEventListener('fullscreenchange', sync); }, []);
  useEffect(() => {
    if (game?.phase !== 'moving') return;
    const tick = () => act('tick'); const timer = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [game?.phase]);
  useEffect(() => {
    if (!game) { lastCue.current = null; return; }
    if (lastCue.current !== null && game.cueSeq > lastCue.current && sound) { const scene = game.rounds[game.index].question.scene; if (scene) playKidsScene(scene); }
    lastCue.current = game.cueSeq;
  }, [game?.cueSeq, sound]);
  useEffect(() => {
    if (!game || showExit || showPair || toolsOpen) return;
    if (presentation || game.phase === 'judging' || game.phase === 'moving') root.current?.focus({ preventScroll: true });
    else primary.current?.focus({ preventScroll: true });
  }, [game?.phase, game?.index, showExit, showPair, presentation, toolsOpen]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const { game, showExit, showPair, toolsOpen, act } = current.current;
      if (!game || showExit || showPair || toolsOpen || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.code === 'KeyH') { e.preventDefault(); setPresentation(v => !v); return; }
      if (e.code === 'Space' && ['BUTTON', 'A', 'SUMMARY'].includes(tag)) return;
      const action = (e.code === 'Space' || e.code === 'ArrowRight') ? kidsPrimaryAction(game.phase) : e.code === 'KeyP' ? (game.phase === 'moving' ? 'pause' : game.phase === 'paused' ? 'resume' : null) : game.phase === 'judging' ? ({ Digit1: 'correct', Digit2: 'participated', Digit0: 'none' } as const)[e.code as 'Digit1'|'Digit2'|'Digit0'] : null;
      if (action) { e.preventDefault(); act(action); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  const toggleFullscreen = async () => { try { setFullscreenError(''); if (document.fullscreenElement) await document.exitFullscreen(); else await root.current?.requestFullscreen(); } catch { setFullscreenError('Nutze das Vollbild deines Browsers.'); } };
  const toggleSound = async () => { if (sound) { setSound(false); return; } try { await enableKidsSound(); setSound(true); } catch { setFullscreenError('Klang hier nicht verfügbar. Die Gruppen können die Geräusche selbst machen.'); } };
  const exit = () => { void remote.disconnect(); setShowExit(false); setShowPair(false); setToolsOpen(false); setPresentation(false); setGame(null); };
  const pair = async () => { if (!game) return; setToolsOpen(false); setShowPair(true); if (!remote.active) { const paused = updateKidsGame(game, 'pause', Date.now()); setGame(paused); await remote.connect(paused, false); } };
  const replay = () => { if (remote.active) { void remote.send('restart'); return; } setGame(createKidsGame()); };
  const round = game?.rounds[game.index];
  const revealed = game?.phase === 'revealed', finished = game?.phase === 'finished';
  const interlude = game && ['welcome','chapter','superbluff','finished'].includes(game.phase);
  const scores = game ? kidsScores(game) : null;
  const group = round ? KIDS_GROUPS[round.question.group] : null;
  const seconds = game ? Math.ceil(game.remainingMs / 1000) : 30;
  const chapter = game ? Math.min(2, Math.floor(game.index / 3)) : 0;
  const status = !game ? '' : game.phase === 'reading' ? 'Erst zuhören. Dann geht’s los!' : game.phase === 'moving' ? '1, 2 oder 3? Ab in euer Feld!' : game.phase === 'paused' ? 'Kurze Pause. Bleibt, wo ihr seid!' : game.phase === 'locked' ? 'Stopp! Helfer prüfen die Felder.' : game.phase === 'returning' ? 'Alle zurück zu eurer Gruppe!' : game.phase === 'judging' ? 'Jetzt wird’s spannend …' : `Richtig ist Feld ${round!.correctIndex + 1}!`;
  return <main class={`kids-page kids-show${game ? ' is-playing' : ''}${presentation && game ? ' is-projecting' : ''}`} ref={root} tabIndex={-1}>
    <header class={`kids-topbar${game ? ' kids-playing-bar' : ''}`}>
      {game ? <><KidsLogo compact/><span class="kids-round-counter">{game.index === 9 ? 'SUPERBLUFF' : `Kapitel ${chapter + 1}`} <b>· {group?.name}</b></span><div class="kids-top-actions"><button class="kids-tool kids-mouse-toggle" type="button" aria-label={presentation ? 'Maussteuerung einblenden' : 'Maussteuerung ausblenden'} aria-pressed={!presentation} onClick={() => { setPresentation(!presentation); setToolsOpen(false); }}>↗ <span>Maus</span></button><button type="button" class="kids-tool kids-menu-toggle" aria-expanded={toolsOpen} aria-controls="kids-operator-tools" onClick={() => setToolsOpen(!toolsOpen)}>☰ <span>Bedienung</span></button></div></> : <><a href="/" class="kids-back" onClick={e => { e.preventDefault(); navigate('/'); }}>← Bible Bluff</a><span class="kids-top-title">GEMEINSAM GEGEN PROFESSOR BLUFF</span>{canFullscreen && <button type="button" class="kids-tool" onClick={toggleFullscreen}>⛶ Vollbild</button>}</>}
    </header>
    {game && toolsOpen && <aside class="kids-operator-tools" id="kids-operator-tools" aria-label="Bedienung für die Spielleitung">
      <button type="button" class="kids-tool" onClick={() => { setPresentation(!presentation); setToolsOpen(false); }}>{presentation ? 'Maussteuerung einblenden' : 'Nur Spiel anzeigen'}</button>
      <button type="button" class="kids-tool" disabled={remote.busy} onClick={pair}>{remote.active ? 'Smartphone-Steuerung anzeigen' : 'Smartphone verbinden'}</button>
      <button type="button" class="kids-tool" onClick={toggleSound}>{sound ? 'Klang ausschalten' : 'Klang einschalten'}</button>
      {canFullscreen && <button type="button" class="kids-tool" onClick={toggleFullscreen}>{fullscreen ? 'Vollbild aus' : 'Vollbild einschalten'}</button>}
      <button type="button" class="kids-tool" onClick={() => { act('pause'); setToolsOpen(false); setShowExit(true); }}>Spiel beenden</button>
      <p>→ / Leertaste: weiter · P: Pause<br/>H: Mausknöpfe · Wertung: 1 / 2 / 0</p><button type="button" class="kids-tool" onClick={() => setToolsOpen(false)}>Menü schließen</button>
    </aside>}
    {fullscreenError && <p role="status" class="kids-connection-note">{fullscreenError}</p>}
    {remote.error && !showPair && <p class="kids-connection-note" role="status">{remote.error}</p>}
    {remote.active && !remote.view && <div class="kids-exit"><div><h2>Show wiederherstellen …</h2><p>{remote.error || 'Die Fernbedienung wird wieder verbunden.'}</p><button type="button" class="kids-button" onClick={() => { void remote.disconnect(); }}>Zur Vorbereitung</button></div></div>}
    {!game ? <section class="kids-setup">
      <div class="kids-intro"><KidsLogo/><p class="kids-eyebrow">DAS GEMEINSAME BIBELABENTEUER</p><h1>Die große<br/><em>Bluff-Jagd!</em></h1><p>Drei Detektivteams. Ein frecher Professor.<br/>Und ein Schatz, den nur ihr entdecken könnt.</p><ProfessorBluff/><div class="kids-show-teams">{(['minis','mittis','maxis'] as const).map(g=><span><b>{KIDS_GROUPS[g].name}</b><small>{KIDS_GROUPS[g].ages}</small></span>)}</div></div>
      <div class="kids-setup-card"><p class="kids-eyebrow">FÜR DIE SPIELLEITUNG · CA. 45 MINUTEN</p><h2>Gemeinsam auf Punktejagd</h2><ol class="kids-rules">
        <li><b>Drei Felder vorbereiten</b><span>1, 2, 3 von links nach rechts markieren. Die aktive Altersgruppe wählt mit den Füßen. Andere bleiben bei ihrer Gruppe.</span></li>
        <li><b>9 Aufgaben + 1 Superbluff</b><span>Pro Kapitel spielen Minis, Mittis und Maxis. Erst vorlesen, dann 30 Sekunden starten. Eltern helfen bei Geräuschen und Pantomime.</span></li>
        <li><b>Alle zurück, dann auflösen</b><span>Helfer prüfen die Felder. Alle kehren zurück. Die Spielleitung trägt nur das gemeinsame Ergebnis ein.</span></li>
      </ol><div class="kids-scoring-rule"><b>10</b> Mehrheit richtig · <b>5</b> mindestens ein Kind richtig<br/><b>0</b> keiner richtig<br/>Professor Bluff: +7 je Runde · Finale: Bluff +10 · Team bis +10</div>
      <button type="button" class="kids-button kids-primary" onClick={() => setGame(createKidsGame())}>Show vorbereiten <span>→</span></button><p class="kids-setup-note">Ein Beamer für alle · Kein Kinder-Smartphone<br/>Maus, Tastatur oder Smartphone der Spielleitung</p>
      <details class="kids-organizer"><summary>Helferplan & Ablauf</summary><p>Moderation, Beamer-Bedienung und Gruppenhelfer einplanen. Genug Platz für die aktive Gruppe und begleitende Eltern lassen. Elternkarten 1–3 und ein Kissen für die Final-Pantomime bereitlegen.</p><p>Begrüßung 5 Min. · 3 Kapitel je 9 Min. · Showeinlagen 6 Min. · Finale 7 Min. Alle Punkte sind fest geregelt. In Kapitel 2 gibt es einen gemeinsamen Familienjoker ohne zusätzliche Punkte.</p></details></div>
    </section> : <>
      <ShowScoreboard game={game}/>
      {game.phase==='returning' || game.phase==='judging' ? <KidsRegroup game={game} act={act} disabled={remote.busy} primaryRef={primary}/> : interlude ? <section class={`kids-show-interlude is-${game.phase}`}>
        {finished && <Celebration variant={3}/>}
        <div class="kids-show-host"><ProfessorBluff mood={professorMood(game)}/><blockquote>{professorSays(game)}</blockquote><span>Professor Bluff</span></div>
        <div class="kids-show-story">
          <p class="kids-eyebrow">{game.phase === 'welcome' ? 'WILLKOMMEN, BIBLEBLUFF-DETEKTIVE!' : game.phase === 'chapter' ? `KAPITEL ${chapter + 1} VON 3` : game.phase === 'superbluff' ? 'ALLE TEAMS WERDEN GEBRAUCHT' : 'UNSERE GEMEINSAME ENTDECKUNG'}</p>
          <h1>{game.phase === 'welcome' ? 'Zusammen knacken wir jeden Bluff!' : game.phase === 'chapter' ? KIDS_CHAPTERS[chapter] : game.phase === 'superbluff' ? 'ALARM! Der Superbluff!' : scores!.team > scores!.professor ? 'Ihr habt den Bluff geknackt!' : 'Euer Teamgeist ist der Schatz!'}</h1>
          {game.phase === 'welcome' ? <><div class="kids-team-badges">{(['minis','mittis','maxis'] as const).map(g=><div><b>{KIDS_GROUPS[g].symbol} {KIDS_GROUPS[g].name}</b><span>{KIDS_GROUPS[g].title}</span></div>)}</div><p>Wir sammeln alle für EIN Team.<br/>Niemand scheidet aus. Alle gehören dazu!</p></> : game.phase === 'chapter' ? <><p>{chapter === 0 ? 'Minis, Mittis, Maxis: Eure erste Spur wartet!' : chapter === 1 ? 'Jetzt helfen auch die Eltern aus der Bluff-Zentrale. Ein Familienjoker steht bereit!' : 'Noch drei Aufgaben bis zum großen Finale. Jeder Beitrag zählt!'}</p><Treasure pieces={scores!.pieces}/></> : game.phase === 'superbluff' ? <><div class="kids-final-bonuses"><span>Professor Bluff <b>+10</b></span><span>Alle Kinder <b>+10?</b></span></div><p>Eltern spielen eine Geschichte.<br/>Ihr entdeckt gemeinsam die richtige Antwort!</p></> : <><Treasure pieces={9} open/><p class="kids-treasure-message">Bei Jesus sind wir willkommen.</p><small>Jesus lädt die Kinder zu sich ein. · Markus 10,14</small><p>Minis + Mittis + Maxis: Gemeinsam sind wir stark!</p><div class="kids-final-result"><b>Kinderteam {scores!.team}</b><span>Professor Bluff {scores!.professor}</span></div></>}
          {finished ? <div class="kids-finish-actions"><button type="button" class="kids-button kids-primary" disabled={remote.busy} onClick={replay}>Revanche! ↻</button><button type="button" class="kids-button" onClick={exit}>Zur Vorbereitung</button></div> : <ShowControls game={game} act={act} disabled={remote.busy} primaryRef={primary}/>}
        </div>
      </section> : round && <section class={`kids-stage kids-show-stage is-${game.phase}`} aria-labelledby="kids-question">
        <div class="kids-show-question">{round.question.scene && <div key={`${game.index}-${game.cueSeq}`} class="kids-scene"><StoryPicture motif={round.question.scene} animated/></div>}<h1 id="kids-question">{round.question.prompt}</h1></div>
        <div class="kids-status" role="status"><ProfessorBluff mood={professorMood(game)}/><div class={`kids-clock${game.phase === 'moving' && seconds <= 5 ? ' is-urgent' : ''}`} aria-label={`${seconds} Sekunden`}><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="kids-clock-track" cx="40" cy="40" r="33"/><circle class="kids-clock-progress" cx="40" cy="40" r="33" style={{ strokeDasharray:'207.35', strokeDashoffset: `${207.35 * (1-game.remainingMs/30000)}` }}/></svg><b aria-hidden="true">{revealed ? '✓' : ['locked','returning','judging'].includes(game.phase) ? '✋' : seconds}</b></div><div><strong>{status}</strong><span>{game.phase === 'locked' ? 'Noch nicht auflösen. Gleich geht’s zurück.' : revealed ? (game.index === 9 ? 'Alle Altersgruppen haben zusammengeholfen!' : `Ein Schatzteil entdeckt! Professor Bluff bekommt +7.`) : `${group!.title} sind dran! Die anderen fiebern mit.`}</span></div></div>
        <ol class={`kids-answers${round.question.group === 'minis' || game.index === 9 ? ' has-pictures' : ''}`} aria-label="Antworten und Spielfelder">{round.answers.map((answer,i)=><li key={`${game.index}-${i}`} class={`kids-answer kids-field-${i+1}${revealed ? i===round.correctIndex ? ' is-correct' : ' is-other' : ''}`}><span class="kids-number">{i+1}</span>{(round.question.group==='minis' || game.index===9) && <StoryPicture motif={round.question.pictures[answer===round.question.answer ? 0 : round.question.distractors.indexOf(answer)+1]}/>}<span class="kids-answer-text">{answer}</span>{revealed && i===round.correctIndex && <span class="kids-correct-mark">✓ Richtig!</span>}</li>)}</ol>
        <div class="kids-bottom"><div class="kids-discovery">{revealed ? <div><p>{round.question.explanation}</p><small>{round.question.ref} · {`Kinderteam +${kidsResultPoints(game.results[game.index])}${game.index===9 ? ' Finalbonus' : ''}`}</small></div> : <div><p>{game.jokerFor===game.index ? `Familienjoker: ${round.question.hint}` : professorSays(game)}</p></div>}</div><div class="kids-operator-actions">{game.phase==='reading' && <div class="kids-extra-controls">{round.question.scene && <button type="button" class="kids-tool" disabled={remote.busy} onClick={()=>act('scene')}>Szene abspielen</button>}{game.index>=3 && game.index<=5 && game.jokerFor===null && <button type="button" class="kids-tool" disabled={remote.busy} onClick={()=>act('joker')}>Familienjoker</button>}</div>}<ShowControls game={game} act={act} disabled={remote.busy} primaryRef={primary}/></div></div>
        {revealed && <Celebration variant={game.index}/>}
      </section>}
    </>}
    {showPair && <div class="kids-exit kids-pair" role="dialog" aria-modal="true" aria-labelledby="kids-pair-title" onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); setShowPair(false); }
      if (e.key === 'Tab') { const elements = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a')); const index = elements.indexOf(document.activeElement as HTMLElement); e.preventDefault(); elements[(index + (e.shiftKey ? -1 : 1) + elements.length) % elements.length]?.focus(); }
    }}><div><h2 id="kids-pair-title">Smartphone verbinden</h2><p>Nur für die Spielleitung: QR-Code mit dem Smartphone scannen und dieselbe Partie steuern.</p>
      {remote.credentials?.remoteToken ? <><QRCode value={kidsControlUrl(remote.credentials)} label="QR-Code zur Smartphone-Fernbedienung" /><a class="kids-button kids-remote-link" href={kidsControlUrl(remote.credentials)} target="_blank" rel="noopener noreferrer">Fernbedienung öffnen ↗</a><p class="kids-pair-note">Start · Pause · Mehrheitswertung · Weiter<br />Die Kinder brauchen kein Smartphone.</p></> : <p role="status">{remote.error || 'QR-Code wird vorbereitet …'}</p>}
      {remote.error && !remote.active && <button type="button" class="kids-button" disabled={remote.busy} onClick={pair}>Erneut versuchen</button>}
      <button type="button" class="kids-button kids-primary" autoFocus onClick={() => setShowPair(false)}>Zur Partie</button>
      {remote.active && <button type="button" class="kids-tool" onClick={() => { void remote.disconnect(); setShowPair(false); }}>Smartphone-Verbindung trennen</button>}
    </div></div>}
    {showExit && <div class="kids-exit" role="dialog" aria-modal="true" aria-labelledby="kids-exit-title" onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); setShowExit(false); }
      if (e.key === 'Tab') { e.preventDefault(); const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button'); const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); }
    }}><div><h2 id="kids-exit-title">Schon Schluss?</h2><p>Ihr könnt die Show fortsetzen oder zur Vorbereitung zurückgehen.</p><button type="button" class="kids-button kids-primary" autoFocus onClick={() => setShowExit(false)}>Weiterspielen</button><button type="button" class="kids-button" onClick={exit}>Zur Vorbereitung</button></div></div>}
  </main>;
}
