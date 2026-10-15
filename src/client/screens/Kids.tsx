import { useEffect, useRef, useState } from 'preact/hooks';
import { KIDS_QUESTIONS } from '../../shared/kids-questions';
import { KidsLogo } from '../components/KidsLogo';
import { createKidsGame, kidsPrimaryAction, updateKidsGame, type KidsAction, type KidsGame } from '../lib/kids';
import { navigate } from '../lib/router';
import './kids.css';

const CHEERS = ['Ein Hoch auf eure Neugier!', 'Zusammen macht Entdecken Spaß!', 'Ihr seid ein tolles Team!', 'Weiter so, Bibelentdecker!'];

function Celebration({ variant }: { variant: number }) {
  return <div class={`kids-celebration kids-party-${variant % 4}`} aria-hidden="true">
    {Array.from({ length: 38 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37 + 11) % 100}%`, '--delay': `${(i % 9) * 70}ms`, '--turn': `${i * 29}deg`, '--c': ['#ffd362', '#72d8c7', '#fba2af', '#95baf7'][i % 4] }}>{variant % 4 === 1 ? '★' : variant % 4 === 2 ? '●' : '✦'}</i>)}
    <svg class="kids-happy" viewBox="0 0 130 130"><circle cx="65" cy="65" r="50" fill="#ffd362" stroke="#12324a" stroke-width="5"/><path d="M40 52q8-13 16 0m18 0q8-13 16 0M39 73q26 34 52 0" fill="none" stroke="#12324a" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="68" r="6" fill="#f39a9d"/><circle cx="98" cy="68" r="6" fill="#f39a9d"/></svg>
  </div>;
}

export function KidsPage() {
  const [count, setCount] = useState(10);
  const [easy, setEasy] = useState(false);
  const [game, setGame] = useState<KidsGame | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const [presentation, setPresentation] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const current = useRef({ game, showExit });
  // Tastendrücke lesen den gerade gerenderten Zustand, auch vor dem nächsten Effect/Frame.
  current.current = { game, showExit };
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;
  const act = (action: KidsAction) => setGame((g) => g ? updateKidsGame(g, action, Date.now()) : g);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'BibleBluff Kids · 1, 2 oder 3?';
    return () => { document.title = previousTitle; };
  }, []);
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  useEffect(() => {
    if (game?.phase !== 'moving') return;
    const tick = () => act('tick');
    const timer = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [game?.phase]);
  useEffect(() => {
    if (!game || showExit || toolsOpen) return;
    if (presentation && game.phase !== 'finished') root.current?.focus({ preventScroll: true });
    else if (game.phase !== 'moving') primary.current?.focus({ preventScroll: true });
  }, [game?.phase, game?.index, showExit, presentation, toolsOpen]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const { game, showExit } = current.current;
      if (!game || showExit || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.code === 'KeyH') { e.preventDefault(); setPresentation((v) => !v); setToolsOpen(false); return; }
      if (e.code === 'Escape') { setToolsOpen(false); return; }
      // Leertaste aktiviert fokussierte Knöpfe nativ; → und P bleiben überall bedienbar.
      if (e.code === 'Space' && ['BUTTON', 'A', 'SUMMARY'].includes(tag)) return;
      const action = (e.code === 'Space' || e.code === 'ArrowRight') ? kidsPrimaryAction(game.phase) : e.code === 'KeyP' ? (game.phase === 'moving' ? 'pause' : game.phase === 'paused' ? 'resume' : null) : null;
      if (action) { e.preventDefault(); act(action); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const toggleFullscreen = async () => {
    try {
      setFullscreenError('');
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch { setFullscreenError('Vollbild ist hier nicht verfügbar. Nutze das Vollbild deines Browsers.'); }
  };
  const exit = () => { setShowExit(false); setToolsOpen(false); setPresentation(false); setGame(null); };
  const round = game?.rounds[game.index];
  const revealed = game?.phase === 'revealed';
  const finished = game?.phase === 'finished';
  const poolSize = KIDS_QUESTIONS.filter((q) => !easy || q.level === 1).length;
  const seconds = game ? Math.ceil(game.remainingMs / 1000) : 30;
  const active = !!game && !finished;
  const actionLabel = !game ? '' : game.phase === 'reading' ? '30 Sekunden starten' : game.phase === 'paused' ? 'Weiter geht’s' : game.phase === 'locked' ? 'Antwort aufdecken' : game.index + 1 === game.rounds.length ? 'Zum großen Finale' : 'Nächste Frage';

  return <main class={`kids-page${active ? ' is-playing' : ''}${presentation && active ? ' is-projecting' : ''}`} ref={root} tabIndex={-1}>
    <header class={`kids-topbar${active ? ' kids-playing-bar' : ''}`}>
      {active ? <><KidsLogo compact /><span class="kids-round-counter">Frage <b>{game.index + 1}</b><span> von {game.rounds.length}</span></span><button type="button" class="kids-tool kids-menu-toggle" aria-expanded={toolsOpen} aria-controls="kids-operator-tools" onClick={() => setToolsOpen(!toolsOpen)}>☰ <span>Bedienung</span></button></> : <><a href="/" class="kids-back" onClick={(e) => { e.preventDefault(); navigate('/'); }} aria-label="Zurück zu Bible Bluff">← <span>Bible Bluff</span></a><span class="kids-top-title">BEWEGEN. RATEN. STAUNEN.</span>{canFullscreen && <button type="button" class="kids-tool" onClick={toggleFullscreen}>{fullscreen ? '↙ Vollbild aus' : '⛶ Vollbild'}</button>}</>}
    </header>
    {active && toolsOpen && <aside class="kids-operator-tools" id="kids-operator-tools" aria-label="Bedienung für die Spielleitung">
      <button type="button" class="kids-tool" onClick={() => { setPresentation(!presentation); setToolsOpen(false); }}>{presentation ? 'Bedienknöpfe einblenden' : 'Nur Spiel anzeigen'}</button>
      {canFullscreen && <button type="button" class="kids-tool" onClick={toggleFullscreen}>{fullscreen ? 'Vollbild aus' : 'Vollbild einschalten'}</button>}
      <button type="button" class="kids-tool" onClick={() => { act('pause'); setToolsOpen(false); setShowExit(true); }}>Spiel beenden</button>
      <p>Leertaste / →: weiter<br />P: Pause · H: Bedienknöpfe an/aus</p>
      <button type="button" class="kids-tool" onClick={() => setToolsOpen(false)}>Menü schließen</button>
    </aside>}
    {fullscreenError && <p role="status" class="kids-screen-note">{fullscreenError}</p>}

    {!game ? <section class="kids-setup" aria-labelledby="kids-title">
      <div class="kids-intro">
        <KidsLogo />
        <p class="kids-eyebrow">DAS BEAMER-SPIEL FÜR 6–12 JAHRE</p>
        <h1 id="kids-title">Deine Antwort?<br /><em>Zeig sie mit den Füßen!</em></h1>
        <p>Eine Frage. Drei Felder. Jede Menge Bewegung.</p>
        <div class="kids-demo-fields" aria-label="Drei nummerierte Antwortfelder"><span>1</span><span>2</span><span>3</span></div>
      </div>
      <div class="kids-setup-card">
        <h2>So spielt ihr</h2>
        <ol class="kids-rules">
          <li><b>Felder vorbereiten</b><span>Markiert im Raum Feld 1, 2 und 3 – von links nach rechts wie auf dem Beamer.</span></li>
          <li><b>Zuhören & losgehen</b><span>Die Spielleitung liest vor und startet 30 Sekunden. Geht zu eurer Antwort!</span></li>
          <li><b>Stehen bleiben & staunen</b><span>Bei Stopp bleibt ihr stehen. Dann wird aufgedeckt. Alle bleiben dabei!</span></li>
        </ol>
        <div class="kids-settings">
          <fieldset><legend>Wie viele Fragen?</legend><div class="kids-options">{[6, 10, 15].map((n) => <button type="button" aria-pressed={n === count} onClick={() => setCount(n)}>{n}</button>)}</div></fieldset>
          <fieldset><legend>Welche Mischung?</legend><div class="kids-options"><button type="button" aria-pressed={!easy} onClick={() => setEasy(false)}>Bunt gemischt <small>6–12 Jahre</small></button><button type="button" aria-pressed={easy} onClick={() => setEasy(true)}>Extra leicht <small>6–8 Jahre</small></button></div></fieldset>
        </div>
        <button type="button" class="kids-button kids-primary" onClick={() => setGame(createKidsGame(count, easy))}>Los geht’s! <span>→</span></button>
        <p class="kids-setup-note">{poolSize} ausgewählte Fragen · Ein Bildschirm für alle<br />Bedienung durch die Spielleitung am Computer</p>
      </div>
      <p class="kids-shortcuts">Spielleitung: Leertaste / → = weiter · P = Pause · H = Bedienknöpfe an/aus<br />Fragen in Ruhe vorlesen. Erst danach die Zeit starten.</p>
    </section> : finished ? <section class="kids-finish" aria-labelledby="kids-finish-title">
      <Celebration variant={game.rounds.length} />
      <KidsLogo />
      <p class="kids-eyebrow">{game.rounds.length} FRAGEN VOLLER ENTDECKUNGEN</p>
      <h1 id="kids-finish-title">Ihr wart spitze!</h1>
      <p>So viel bewegt. So viel entdeckt.<br />Schön, dass ihr alle dabei wart!</p>
      <div class="kids-finish-actions"><button ref={primary} type="button" class="kids-button kids-primary" onClick={() => setGame(createKidsGame(count, easy))}>Noch eine Runde! ↻</button><button type="button" class="kids-button" onClick={exit}>Zur Auswahl</button></div>
    </section> : round && <section class={`kids-stage is-${game.phase}`} aria-labelledby="kids-question">
      <h1 id="kids-question" key={game.index}>{round.question.prompt}</h1>
      <div class="kids-status" role="status" aria-live="polite">
        <div class={`kids-clock${game.phase === 'moving' && seconds <= 5 ? ' is-urgent' : ''}`} aria-label={`${seconds} Sekunden`}>
          <svg viewBox="0 0 80 80" aria-hidden="true"><circle class="kids-clock-track" cx="40" cy="40" r="33"/><circle class="kids-clock-progress" cx="40" cy="40" r="33" style={{ strokeDasharray: '207.35', strokeDashoffset: `${207.35 * (1 - game.remainingMs / 30000)}` }} /></svg>
          <b aria-hidden="true">{revealed ? '✓' : game.phase === 'locked' ? '✋' : seconds}</b>
        </div>
        <div><strong>{game.phase === 'reading' ? 'Erst zuhören. Dann geht’s los!' : game.phase === 'moving' ? '1, 2 oder 3? Ab in euer Feld!' : game.phase === 'paused' ? 'Kurze Pause. Bleibt, wo ihr seid!' : game.phase === 'locked' ? 'Stopp! Jetzt stehen bleiben!' : `Richtig ist Feld ${round.correctIndex + 1}!`}</strong><span>{game.phase === 'reading' ? 'Welche Antwort stimmt?' : game.phase === 'moving' ? 'Wechseln erlaubt – bis zum Stopp!' : game.phase === 'paused' ? 'Die Zeit wartet auf euch.' : game.phase === 'locked' ? 'Bleibt in eurem Feld!' : CHEERS[game.index % CHEERS.length]}</span></div>
      </div>
      <ol class="kids-answers" aria-label="Antworten und Spielfelder">{round.answers.map((answer, i) => <li key={`${game.index}-${i}`} class={`kids-answer kids-field-${i + 1}${revealed ? i === round.correctIndex ? ' is-correct' : ' is-other' : ''}`}>
        <span class="kids-field-label">FELD</span><b class="kids-number">{i + 1}</b><span class="kids-answer-text">{answer}</span>
        {revealed && i === round.correctIndex && <span class="kids-correct-mark" aria-label="Richtige Antwort">✓ RICHTIG!</span>}
      </li>)}</ol>
      <footer class="kids-bottom">
        <div class="kids-discovery" aria-live="polite">{revealed ? <><span class="kids-discovery-star" aria-hidden="true">✦</span><div><p>{round.question.explanation}</p><small>{round.question.ref}</small></div></> : <p class="kids-control-hint">{game.phase === 'reading' ? 'In Ruhe vorlesen. Danach die Zeit starten.' : game.phase === 'locked' ? 'Bereit? Jetzt darf aufgedeckt werden.' : 'Leertaste / → weiter · P Pause · H Bedienknöpfe'}</p>}</div>
        <div class="kids-controls">{game.phase === 'moving' ? <button type="button" class="kids-button" onClick={() => act('pause')}>Ⅱ Pause</button> : <button ref={primary} type="button" class="kids-button kids-primary" aria-label={actionLabel} onClick={() => { const action = kidsPrimaryAction(game.phase); if (action) act(action); }}>{game.phase === 'reading' ? '30 s starten ▶' : game.phase === 'paused' ? 'Weiter ▶' : game.phase === 'locked' ? 'Aufdecken ✦' : game.index + 1 === game.rounds.length ? 'Finale →' : 'Nächste Frage →'}</button>}</div>
      </footer>
      {revealed && <Celebration key={game.index} variant={game.index} />}
    </section>}

    {showExit && <div class="kids-exit" role="dialog" aria-modal="true" aria-labelledby="kids-exit-title" onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); setShowExit(false); }
      if (e.key === 'Tab') { e.preventDefault(); const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button'); const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); }
    }}><div><h2 id="kids-exit-title">Schon Schluss?</h2><p>Ihr könnt weiterspielen oder zur Auswahl zurückgehen.</p><button type="button" class="kids-button kids-primary" autoFocus onClick={() => setShowExit(false)}>Weiterspielen</button><button type="button" class="kids-button" onClick={exit}>Zur Auswahl</button></div></div>}
  </main>;
}
