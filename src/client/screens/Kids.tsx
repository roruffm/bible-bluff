import { kidsIntroPosition } from '../../shared/kids-intro';
import { KidsMusicControls } from '../components/KidsMusicControls';
import { KIDS_DEFAULT_MUSIC, kidsMusicCue, kidsMusicStage } from '../../shared/kids-music';
import { kidsBackgroundMusic } from '../lib/kids-music';
import { KidsTeamPortrait } from '../components/KidsTeamPortrait';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { KidsGroupName } from '../components/KidsGroupName';
import { KidsMascot } from '../components/KidsMascot';
import { KidsScene } from '../components/KidsScene';
import { KidsTrail } from '../components/KidsTrail';
import { KidsSky } from '../components/KidsSky';
import { KidsAnswers } from '../components/KidsAnswers';
import { KidsBannerMascot, KidsLightSweep, KidsPointsFlight, useKidsPresentationMoment } from '../components/KidsShowEffects';
import { KidsAnswersVoiceButton, KidsQuestionVoiceButton, KidsVoiceProvider } from '../components/KidsVoice';
import { KidsFinish, KidsFinishDialog } from '../components/KidsFinish';
import { KidsReveal } from '../components/KidsReveal';
import { KidsRegroup } from '../components/KidsRegroup';
import { KidsLogo } from '../components/KidsLogo';
import { QRCode } from '../components/QR';
import { ProfessorBluff, professorMood, professorSays, ShowControls, ShowScoreboard, StoryPicture } from '../components/KidsShow';
import { KIDS_GROUPS, type KidsGroup } from '../../shared/kids-show-questions';
import { kidsControlUrl, useKidsRemote } from '../lib/kids-remote';
import { enableKidsSound, playKidsMusic, KIDS_SUSPENSE_MS, playKidsCue, playKidsScene, playProfessorVoice, type KidsCue } from '../lib/kids-sound';
import { clearKidsShow, loadKidsShow, saveKidsShow } from '../lib/kids-saved';
import { checkKidsInternet, prepareKidsShow } from '../lib/kids-ready';
import { KidsResume, KidsTechCheck, KidsTechStatus } from '../components/KidsPrepare';
import { BluffClaim, KidsCheers, KidsStopSign } from '../components/KidsBluff';
import { createKidsGame, KIDS_ANSWER_MS, kidsCanJumpToFinal, kidsCanSkipCountdown, kidsCanScore, kidsOvertook, kidsPrimaryAction, kidsResultPoints, updateKidsGame, type KidsAction, type KidsGame } from '../lib/kids';
import { navigate } from '../lib/router';
import './kids.css';
import './kids-show-theme.css';
import '../components/professor-bluff.css';
import { professorMotion } from '../lib/professor-motion';
import { KidsInterlude } from '../components/KidsInterlude';
import { KidsIntroControls, KidsIntroVideo, unlockKidsIntroVideo } from '../components/KidsIntroVideo';

function Celebration({ variant }: { variant: number }) {
  return <div class={`kids-celebration kids-party-${variant % 4}`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37 + 11) % 100}%`, '--delay': `${(i % 9) * 70}ms`, '--turn': `${i * 29}deg`, '--c': ['#ffd362', '#72d8c7', '#fba2af', '#95baf7'][i % 4] }}>{['✦','★','●'][variant % 3]}</i>)}</div>;
}
/** Two synchronized corner clocks; only one timer is announced to screen readers. */
function KidsStageClock({ side, seconds, progress, locked, urgent, cheer }: {
  side: 'left' | 'right'; seconds: number; progress: number; locked: boolean; urgent: boolean; cheer?: Exclude<KidsGroup, 'all'>;
}) {
  return <div class={`kids-clock kids-corner-clock kids-clock-${side}${urgent ? ' is-urgent' : ''}`}
    aria-label={side === 'left' ? `${seconds} Sekunden` : undefined}
    aria-hidden={side === 'right' ? true : undefined}>
    {/* Re-keyed every second so the pulse lands exactly when the number (and the tick sound) changes. */}
    <span class="kids-clock-beat" key={seconds} aria-hidden="true">
      <svg viewBox="0 0 80 80" aria-hidden="true"><circle class="kids-clock-track" cx="40" cy="40" r="33"/><circle class="kids-clock-progress" cx="40" cy="40" r="33" style={{ strokeDasharray: '207.35', strokeDashoffset: `${207.35 * (1 - progress)}` }}/></svg>
      <span class="kids-clock-text" aria-hidden="true"><b>{locked ? '✋' : seconds}</b><small>{locked ? 'Stopp!' : 'Sekunden'}</small></span>
    </span>
    {cheer && <span class="kids-clock-cheer" key={cheer}><KidsMascot group={cheer}/></span>}
  </div>;
}

export function KidsPage() {
  const [game, setGame] = useState<KidsGame | null>(null);
  const moment = useKidsPresentationMoment(game);
  const [showExit, setShowExit] = useState(false), [showPair, setShowPair] = useState(false), [showFinish, setShowFinish] = useState(false);
  const [fullscreen, setFullscreen] = useState(false), [fullscreenError, setFullscreenError] = useState('');
  const [presentation, setPresentation] = useState(true), [toolsOpen, setToolsOpen] = useState(false);
  const [sound, setSound] = useState<'unarmed'|'on'|'off'>('unarmed');
  const [suspense, setSuspense] = useState<number|null>(null);
  const [saved, setSaved] = useState(() => loadKidsShow());
  const [checked, setChecked] = useState(false), [testing, setTesting] = useState(false);
  const resumeButton = useRef<HTMLButtonElement>(null), soundTest = useRef<AbortController|null>(null);
  const soundOn = useRef(false), lastPhase = useRef<string|null>(null);
  soundOn.current = sound === 'on';
  const cue = (name: KidsCue) => soundOn.current ? playKidsCue(name) : () => {};
  const root = useRef<HTMLElement>(null), primary = useRef<HTMLButtonElement>(null);
  const remote = useKidsRemote('display', setGame);
  // Jeder Stand wird auf diesem Gerät gesichert, auch der vom Fernbedienungs-Server: Neuladen oder Absturz kosten nichts.
  // Sofort nach dem Rendern, damit auch ein Neuladen direkt nach einem Klick den letzten Schritt behält.
  useLayoutEffect(() => { if (game) saveKidsShow(game); }, [game]);
  useEffect(() => { if (game) prepareKidsShow(); }, [!!game]);
  useLayoutEffect(() => { if (saved && !game && !remote.active) resumeButton.current?.focus(); }, [!!saved, !!game, remote.active]);
  useEffect(() => () => soundTest.current?.abort(), []);
  const music = game?.music ?? KIDS_DEFAULT_MUSIC;
  const musicStage = game ? kidsMusicStage(game) : null;
  const musicCue = game && musicStage ? kidsMusicCue(game, musicStage) : '';
  const musicActive = !!game && sound === 'on' && music.enabled && musicStage !== null;
  useEffect(() => {
    if (!musicActive) { kidsBackgroundMusic.pause(!game); return; }
    let cancelled = false;
    void playKidsMusic(music.volume, musicStage!, musicCue, musicStage === 'countdown' ? (KIDS_ANSWER_MS - game!.remainingMs) / 1000 : game!.introVideo ? kidsIntroPosition(game!.introVideo, Date.now()) / 1000 : undefined).catch(error => {
      if (!cancelled) setFullscreenError(error instanceof Error ? error.message : 'Hintergrundmusik nicht verfügbar.');
    });
    return () => { cancelled = true; };
  }, [musicActive, music.volume, !!game, musicStage, musicCue]);
  useEffect(() => () => kidsBackgroundMusic.pause(true), []);
  const act = (action: KidsAction) => {
    if (action === 'music-on' && sound !== 'on') void enableKidsSound().then(() => setSound('on')).catch(() => setSound('off'));
    if ((action === 'scene' || action === 'start') && sound === 'unarmed') void enableKidsSound().then(()=>setSound('on')).catch(()=>setSound('off'));
    if (action !== 'tick' && remote.active) { void remote.send(action); return; }
    setGame((g) => g ? updateKidsGame(g, action, Date.now()) : g);
  };
  const current = useRef({ game, showExit, showPair, showFinish, toolsOpen, act });
  current.current = { game, showExit, showPair, showFinish, toolsOpen, act };
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;
  useEffect(() => { const old = document.title; document.title = 'BibleBluff Kids · Die große Bluff-Jagd'; return () => { document.title = old; }; }, []);
  useLayoutEffect(() => {
    if (!game) return;
    root.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [game?.phase, game?.index]);
  useEffect(() => { const sync = () => setFullscreen(!!document.fullscreenElement); document.addEventListener('fullscreenchange', sync); return () => document.removeEventListener('fullscreenchange', sync); }, []);
  useEffect(() => {
    if (game?.phase !== 'moving' && game?.phase !== 'scene') return;
    const tick = () => act('tick'); const timer = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [game?.phase]);
  const seconds = game ? Math.ceil(game.remainingMs / 1000) : 30;
  // Die letzten fünf Sekunden ticken zum lauten Mitzählen.
  useEffect(() => { if (game?.phase === 'moving' && seconds >= 1 && seconds <= 5) cue(seconds === 1 ? 'last-tick' : 'tick'); }, [game?.phase, seconds]);
  // Jeden Phasenwechsel vor dem nächsten Klick festhalten, auch wenn die ruhige Bühne keinen Animationsframe anfordert.
  // Neuladen und Wiederverbinden lösen weder Gong noch Trommelwirbel aus.
  useLayoutEffect(() => {
    const before = lastPhase.current; lastPhase.current = game?.phase ?? null;
    if (!game) return;
    if (before === 'moving' && game.phase === 'locked') cue('gong');
    if (before !== 'judging' || game.phase !== 'revealed') return;
    const overtook = kidsOvertook(game);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { if (overtook) cue('overtake'); return; }
    setSuspense(game.index);
    const stop = cue('drumroll');
    const timer = window.setTimeout(() => { setSuspense(null); if (overtook) cue('overtake'); }, KIDS_SUSPENSE_MS);
    return () => { clearTimeout(timer); stop(); setSuspense(null); };
  }, [game?.phase, game?.index]);
  useEffect(() => {
    if (game?.phase !== 'scene' || sound !== 'on') return;
    const scene=game.rounds[game.index].question.scene;
    if (!scene) return;
    const controller = new AbortController();
    let stop=()=>{};
    void enableKidsSound().then(async()=>{
      if (!controller.signal.aborted) stop = await playKidsScene(scene, game.deadline ?? Date.now(), controller.signal);
      if (controller.signal.aborted) stop();
    }).catch(error=>{ if(!controller.signal.aborted) setFullscreenError(error instanceof Error ? error.message : 'Die Szenenaufnahme konnte nicht abgespielt werden.'); });
    return ()=>{ controller.abort(); stop(); };
  }, [game?.phase, game?.cueSeq, sound]);
  useEffect(() => {
    if (!game || showExit || showPair || showFinish || toolsOpen) return;
    if (presentation || kidsCanScore(game) || game.phase === 'moving' || game.phase === 'finished') root.current?.focus({ preventScroll: true });
    else primary.current?.focus({ preventScroll: true });
  }, [game?.phase, game?.index, showExit, showPair, showFinish, presentation, toolsOpen]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const { game, showExit, showPair, showFinish, toolsOpen, act } = current.current;
      if (!game || showExit || showPair || showFinish || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.code === 'KeyH') { e.preventDefault(); setPresentation(v => !v); setToolsOpen(false); return; }
      if (toolsOpen || game.introVideo) return;
      if (e.code === 'Space' && ['BUTTON', 'A', 'SUMMARY'].includes(tag)) return;
      const action = (e.code === 'Space' || e.code === 'ArrowRight') ? kidsPrimaryAction(game) : e.code === 'KeyP' ? (game.phase === 'moving' ? 'pause' : game.phase === 'paused' ? 'resume' : null) : kidsCanScore(game) ? ({ Digit1: 'correct', Digit2: 'participated', Digit0: 'none' } as const)[e.code as 'Digit1'|'Digit2'|'Digit0'] : null;
      if (action) { e.preventDefault(); act(action); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(()=>{ if(game?.phase==='finished') { setShowFinish(false); setToolsOpen(false); } },[game?.phase]);
  useEffect(()=>{ if(game?.phase==='superbluff') { setShowFinish(false); setShowExit(false); setShowPair(false); setToolsOpen(false); } },[game?.phase]);
  const toggleFullscreen = async () => { try { setFullscreenError(''); if (document.fullscreenElement) await document.exitFullscreen(); else await root.current?.requestFullscreen(); } catch { setFullscreenError('Nutze das Vollbild deines Browsers.'); } };
  const toggleSound = async () => { if (sound === 'on') { setSound('off'); return; } try { await enableKidsSound(); setSound('on'); } catch { setFullscreenError('Klang hier nicht verfügbar. Die Gruppen können die Geräusche selbst machen.'); } };
  const exit = () => { void remote.disconnect(); clearKidsShow(); setSaved(null); setShowExit(false); setShowPair(false); setShowFinish(false); setToolsOpen(false); setPresentation(true); setGame(null); };
  const enableVoice = async () => { if (!game?.introVideo) unlockKidsIntroVideo(); await enableKidsSound(); setSound('on'); };
  const startShow = (withRemote = false) => {
    const next = createKidsGame(Math.random);
    setSaved(null); setGame(next); setPresentation(true);
    void enableVoice().catch(() => setSound('off'));
    if (withRemote) { setShowPair(true); void remote.connect(next, false); }
  };
  // Der Klick aufs Fortsetzen darf den Ton gleich wieder einschalten; Browser verlangen dafür eine Geste.
  const resume = () => { if (!saved) return; setSaved(null); setGame(saved.game); setPresentation(true); void enableVoice().catch(() => setSound('off')); };
  const discard = () => { clearKidsShow(); setSaved(null); };
  /** Lädt alles vorab, prüft das Internet und spielt einen Testsatz über die Beamer-Lautsprecher. */
  const checkTech = async () => {
    setChecked(true); setTesting(true); setFullscreenError('');
    prepareKidsShow(); void checkKidsInternet();
    try { await enableVoice(); } catch { setSound('off'); setTesting(false); return; }
    soundTest.current?.abort(); const controller = new AbortController(); soundTest.current = controller;
    try { await playProfessorVoice('interjection-listen', controller.signal, () => {}); } catch (error) { setFullscreenError(error instanceof Error ? error.message : 'Der Testsatz konnte nicht abgespielt werden.'); }
    setTesting(false);
  };
  const pair = async () => { if (!game) return; void enableVoice().catch(()=>setSound('off')); setToolsOpen(false); setShowPair(true); if (!remote.active) { const paused = updateKidsGame(game, 'pause', Date.now()); setGame(paused); await remote.connect(paused, false); } };
  const round = game?.rounds[game.index];
  const revealed = game?.phase === 'revealed', finished = game?.phase === 'finished';
  const interlude = game && ['welcome','chapter','superbluff'].includes(game.phase);
  const suspenseIndex = revealed && suspense === game?.index ? suspense : -1;
  const lastSeconds = game?.phase === 'moving' && seconds <= 5 && seconds > 0;
  const chapter = game ? Math.min(2, Math.floor(game.index / 3)) : 0;
  // Während der Antwortzeit feuern die beiden wartenden Gruppen an den Uhren an.
  const cheering = round && round.question.group !== 'all' && (game?.phase === 'moving' || game?.phase === 'paused') ? (['minis', 'mittis', 'maxis'] as const).filter(group => group !== round.question.group) : [];
  const displayPhase = !game ? '' : finished ? 'Unsere gemeinsame Bluff-Jagd' : game.phase === 'welcome' ? 'Willkommen!' : game.index === 9 ? 'Das große Finale' : game.phase === 'chapter' ? `Kapitel ${chapter + 1} von 3` : game.phase === 'revealed' ? 'Auflösung' : `Kapitel ${chapter + 1} · Frage ${game.index % 3 + 1}`;
  const status = !game ? '' : game.phase === 'reading' ? 'Erst zuhören. Dann geht’s los!' : game.phase === 'moving' ? (lastSeconds ? 'Zählt laut mit!' : '1, 2 oder 3? Ab in euer Feld!') : game.phase === 'paused' ? 'Kurze Pause. Bleibt, wo ihr seid!' : game.phase === 'locked' ? 'Stopp! Helfer prüfen die Felder.' : game.phase === 'returning' ? 'Alle zurück zu eurer Gruppe!' : game.phase === 'judging' ? 'Jetzt wird’s spannend …' : `Richtig ist Feld ${round!.correctIndex + 1}!`;
  return <KidsVoiceProvider game={game} enabled={sound==='on'} enable={enableVoice} act={act} busy={remote.busy} onError={setFullscreenError}><main class={`kids-page kids-show${game ? ' is-playing' : ''}${presentation && game ? ' is-projecting' : ''}${fullscreen ? ' is-fullscreen' : ''}`} ref={root} tabIndex={-1}>
    {game && <KidsSky game={game}/>}
    {game && moment?.kind === 'sweep' && <KidsLightSweep key={`${game.phase}-${moment.index}`}/>}
    {game && moment?.kind === 'points' && suspenseIndex < 0 && <KidsPointsFlight key={`${moment.index}-${moment.result}`} game={game} points={moment.points}/>}
    <KidsIntroVideo game={game} act={act} onError={setFullscreenError}/>
    {game?.introVideo && <div class="kids-intro-local-controls"><KidsIntroControls game={game} act={act} disabled={remote.busy}/></div>}
    <header class={`kids-topbar${game ? ' kids-playing-bar' : ''}`}>
      {game ? <><KidsLogo compact/><div class="kids-round-line"><span class="kids-round-counter">{displayPhase}</span>{!finished && game.phase !== 'welcome' && <KidsTrail game={game}/>}</div>{!finished && <ShowScoreboard game={game} hiddenIndex={suspenseIndex}/>}<div class="kids-top-actions">{kidsCanJumpToFinal(game) && <button type="button" class="kids-tool kids-final-toggle" aria-label="Direkt ins Finale" disabled={remote.busy || (remote.active && !!remote.error)} onClick={()=>act('jump-final')}>🏁 <span>Finale</span></button>}{!finished && <button type="button" class="kids-tool kids-end-toggle" aria-label="Spiel mit Punktestand abschließen" onClick={()=>{setToolsOpen(false);setShowFinish(true);}}>⚑ <span>Abschluss</span></button>}<button class="kids-tool kids-mouse-toggle" type="button" aria-label={presentation ? 'Maussteuerung einblenden' : 'Maussteuerung ausblenden'} aria-pressed={!presentation} onClick={() => { setPresentation(!presentation); setToolsOpen(false); }}>↗ <span>Maus</span></button>{canFullscreen && <button type="button" class="kids-tool kids-fullscreen-toggle" onClick={toggleFullscreen} aria-label={fullscreen ? 'Vollbild ausschalten' : 'Vollbild einschalten'}>⛶ <span>{fullscreen ? 'Fenster' : 'Vollbild'}</span></button>}<button type="button" class="kids-tool kids-menu-toggle" aria-label="Bedienung" aria-expanded={toolsOpen} aria-controls="kids-operator-tools" onClick={() => setToolsOpen(!toolsOpen)}>☰ <span>Bedienung</span></button></div></> : <><a href="/" class="kids-back" onClick={e => { e.preventDefault(); navigate('/'); }}>← Bible Bluff</a><span class="kids-top-title">GEMEINSAM GEGEN PROFESSOR BLUFF</span>{canFullscreen && <button type="button" class="kids-tool" onClick={toggleFullscreen}>⛶ Vollbild</button>}</>}
    </header>
    {game && toolsOpen && <aside class="kids-operator-tools" id="kids-operator-tools" aria-label="Bedienung für die Spielleitung">
      {kidsCanSkipCountdown(game) && <button type="button" class="kids-tool" aria-label="Countdown überspringen" disabled={remote.busy || (remote.active && !!remote.error)} onClick={()=>{setToolsOpen(false);act('skip-countdown');}}>⏭ Countdown überspringen</button>}
      {kidsCanJumpToFinal(game) && <button type="button" class="kids-tool" disabled={remote.busy || (remote.active && !!remote.error)} onClick={()=>act('jump-final')}>🏁 Zur Finalrunde springen</button>}
      <button type="button" class="kids-tool" onClick={() => { setPresentation(!presentation); setToolsOpen(false); }}>{presentation ? 'Maussteuerung einblenden' : 'Nur Spiel anzeigen'}</button>
      <button type="button" class="kids-tool" disabled={remote.busy} onClick={pair}>{remote.active ? 'Smartphone-Steuerung anzeigen' : 'Smartphone verbinden'}</button>
      <button type="button" class="kids-tool" onClick={toggleSound}>{sound === 'on' ? 'Klang ausschalten' : 'Klang einschalten'}</button>
      {canFullscreen && <button type="button" class="kids-tool" onClick={toggleFullscreen}>{fullscreen ? 'Vollbild aus' : 'Vollbild einschalten'}</button>}
      <button type="button" class="kids-tool" onClick={() => { setToolsOpen(false); if(finished) setShowExit(true); else setShowFinish(true); }}>{finished ? 'Zur Vorbereitung' : 'Spiel abschließen'}</button>
      <KidsMusicControls game={game} act={act} disabled={remote.busy || (remote.active && !!remote.error)}/>
      <KidsTechStatus/>
      <p>→ / Leertaste: weiter · P: Pause<br/>H: Mausknöpfe · Wertung: 1 / 2 / 0</p><button type="button" class="kids-tool" onClick={() => setToolsOpen(false)}>Menü schließen</button>
    </aside>}
    {fullscreenError && <p role="status" class="kids-connection-note">{fullscreenError}</p>}
    {remote.error && !showPair && <p class="kids-connection-note" role="status">{remote.error}{remote.lost && game && <button type="button" class="kids-tool" onClick={() => { void remote.disconnect(); }}>Ohne Smartphone weiterspielen</button>}</p>}
    {remote.active && !remote.view && <div class="kids-exit"><div><h2>Show wiederherstellen …</h2><p>{remote.error || 'Die Fernbedienung wird wieder verbunden.'}</p><button type="button" class="kids-button" onClick={() => { void remote.disconnect(); }}>Zur Vorbereitung</button></div></div>}
    {!game ? <section class="kids-setup">
      <div class="kids-intro"><KidsLogo/><p class="kids-eyebrow">DAS GEMEINSAME BIBELABENTEUER</p><h1>Die große<br/><em>Bluff-Jagd!</em></h1><p>Drei Detektivteams. Ein frecher Professor.<br/>Gemeinsam knackt ihr seine Bibelrätsel.</p><ProfessorBluff/><div class="kids-show-teams">{(['minis','mittis','maxis'] as const).map(g=><span key={g} class={`group-${g}`}><KidsTeamPortrait group={g}/><b><KidsGroupName group={g}/></b><small>{KIDS_GROUPS[g].ages}</small></span>)}</div></div>
      <div class="kids-setup-card">{saved && !remote.active && <KidsResume saved={saved} onResume={resume} onDiscard={discard} resumeRef={resumeButton}/>}<p class="kids-eyebrow">FÜR DIE SPIELLEITUNG · CA. 45 MINUTEN</p><h2>Gemeinsam auf Punktejagd</h2><ol class="kids-rules">
        <li><b>Drei Felder vorbereiten</b><span>1, 2, 3 von links nach rechts markieren. Die aktive Altersgruppe wählt mit den Füßen. Andere bleiben bei ihrer Gruppe.</span></li>
        <li><b>Bis zu 9 Aufgaben + 1 Superbluff</b><span>Pro Kapitel spielen alle drei Gruppen. Erst vorlesen, dann 30 Sekunden starten. Eltern helfen bei Geräuschen und Pantomime. Ihr könnt die Show jederzeit mit Punktestand abschließen.</span></li>
        <li><b>Alle zurück, dann auflösen</b><span>Helfer prüfen die Felder. Alle kehren zurück. Die Spielleitung trägt nur das gemeinsame Ergebnis ein.</span></li>
      </ol><div class="kids-scoring-rule"><b>10</b> Mehrheit richtig · <b>5</b> mindestens ein Kind richtig<br/><b>0</b> keiner richtig<br/>Professor Bluff: +7 je Runde · Finale: Team 20 / 10 / 0 · Professor +0</div>
      <button type="button" class={`kids-button${saved && !remote.active ? '' : ' kids-primary'}`} onClick={() => startShow()}>{saved && !remote.active ? 'Neue Show vorbereiten' : 'Show vorbereiten'} <span>→</span></button>
      <button type="button" class="kids-button kids-setup-remote" disabled={remote.busy} onClick={() => startShow(true)}>Smartphone-Fernbedienung einrichten</button>
      <p class="kids-setup-note">Die Kinder sehen nur die Show. Die Helfer steuern per Fernbedienung.<br/><b>Am Computer: H</b> blendet die Mausbedienung ein oder aus. → / Leertaste: weiter · P: Pause.</p>
      <KidsTechCheck checked={checked} testing={testing} sound={sound} onCheck={() => { void checkTech(); }} fullscreen={canFullscreen ? fullscreen : null} onFullscreen={() => { void toggleFullscreen(); }}/>
      <details class="kids-organizer"><summary>Helferplan & Ablauf</summary><p>Moderation, Beamer-Bedienung und Gruppenhelfer einplanen. Genug Platz für die aktive Gruppe und begleitende Eltern lassen. Elternkarten 1–3 und ein Kissen für die Final-Pantomime bereitlegen.</p><p>Begrüßung 5 Min. · 3 Kapitel je 9 Min. · Showeinlagen 6 Min. · Finale 7 Min. Alle Punkte sind fest geregelt. Gewertet werden nur abgeschlossene Aufgaben. Über „Abschluss“ könnt ihr jederzeit den Endbildschirm zeigen.</p></details></div>
    </section> : <>
      {finished ? <KidsFinish game={game}><Celebration variant={3}/></KidsFinish> : game.phase==='scene' ? <KidsScene key={`${game.index}-${game.cueSeq}`} game={game} act={act} sound={sound==='on'} toggleSound={()=>{void toggleSound();}} disabled={remote.busy} primaryRef={primary}/> : <>
      {game.phase==='returning' || game.phase==='judging' ? <KidsRegroup game={game} act={act} disabled={remote.busy} primaryRef={primary}/> : revealed ? <KidsReveal key={`${game.index}-${game.results[game.index]}`} game={game} act={act} disabled={remote.busy} primaryRef={primary} suspense={suspenseIndex >= 0}>{suspenseIndex < 0 && kidsResultPoints(game.results[game.index], game.index)>0 && <Celebration variant={game.index}/>}</KidsReveal> : interlude ? <KidsInterlude game={game} chapter={chapter} act={act} disabled={remote.busy} primaryRef={primary}/> : round && <section class={`kids-stage kids-show-stage is-${game.phase} is-group-${round.question.group}`} aria-labelledby="kids-question">
        <div class="kids-show-question">
          <div class={`kids-active-group${round.question.group === 'all' ? ' is-finale-team' : ''}${moment?.kind === 'group' ? ' is-mascot-entering' : ''}`}>
            {round.question.group === 'all' && <span class="kids-mascot-formation" aria-hidden="true">{(['minis','mittis','maxis'] as const).map(group => <KidsBannerMascot key={`${game.index}-${group}`} group={group} entering={moment?.kind === 'group'} formation/>)}</span>}
            <KidsGroupName group={round.question.group}/>
            {round.question.group !== 'all' && <KidsBannerMascot key={game.index} group={round.question.group} entering={moment?.kind === 'group'}/>}
            <span>{round.question.group === 'all' ? 'Alle Kinder' : `sind dran! · ${KIDS_GROUPS[round.question.group].ages}`}</span>
          </div>

          <h1 id="kids-question">{round.question.prompt}</h1>
          <div class="kids-status" role="status"><strong>{status}</strong>{round.question.group !== 'all' && (game.phase === 'moving' || game.phase === 'paused') && <KidsCheers active={round.question.group}/>}</div>
          {game.phase === 'locked' && <><KidsStopSign side="left"/><KidsStopSign side="right"/></>}
        </div>
        <aside class="kids-question-host" aria-label="Professor Bluffs Behauptung"><BluffClaim text={professorSays(game)}/><ProfessorBluff key={`${game.phase}:${game.index}`} mood={professorMood(game)} motion={professorMotion(game)}/></aside>
        <KidsAnswers game={game}/>
        <div class="kids-bottom">
          <KidsStageClock side="left" seconds={seconds} progress={game.remainingMs / KIDS_ANSWER_MS} locked={game.phase==='locked'} urgent={game.phase==='moving' && seconds<=5} cheer={cheering[0]}/>
          <div class="kids-operator-actions">{game.phase==='reading' && <div class="kids-extra-controls"><KidsQuestionVoiceButton/><KidsAnswersVoiceButton/>{round.question.scene && <button type="button" class="kids-tool" disabled={remote.busy} onClick={()=>act('scene')}>Szene abspielen</button>}</div>}<ShowControls game={game} act={act} disabled={remote.busy} primaryRef={primary}/></div>
          <KidsStageClock side="right" seconds={seconds} progress={game.remainingMs / KIDS_ANSWER_MS} locked={game.phase==='locked'} urgent={game.phase==='moving' && seconds<=5} cheer={cheering[1]}/>
        </div>
      </section>}
    </>}
    </>}
    {showPair && <div class="kids-exit kids-pair" role="dialog" aria-modal="true" aria-labelledby="kids-pair-title" onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); setShowPair(false); }
      if (e.key === 'Tab') { const elements = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a')); const index = elements.indexOf(document.activeElement as HTMLElement); e.preventDefault(); elements[(index + (e.shiftKey ? -1 : 1) + elements.length) % elements.length]?.focus(); }
    }}><div><h2 id="kids-pair-title">Smartphone verbinden</h2><p>Nur für die Spielleitung: QR-Code mit dem Smartphone scannen und dieselbe Partie steuern.</p>
      {remote.credentials?.remoteToken ? <><QRCode value={kidsControlUrl(remote.credentials)} label="QR-Code zur Smartphone-Fernbedienung" /><a class="kids-button kids-remote-link" href={kidsControlUrl(remote.credentials)} target="_blank" rel="noopener noreferrer">Fernbedienung öffnen ↗</a><p class="kids-pair-note">Start · Szene · Pause · Mehrheitswertung · Weiter<br />Die Kinder brauchen kein Smartphone.</p></> : <p role="status">{remote.error || 'QR-Code wird vorbereitet …'}</p>}
      <button type="button" class="kids-tool" disabled={sound==='on'} onClick={()=>{void toggleSound();}}>{sound==='on' ? 'Klänge am Beamer sind aktiviert' : 'Klänge für Smartphone-Steuerung aktivieren'}</button>
      {remote.error && !remote.active && <button type="button" class="kids-button" disabled={remote.busy} onClick={pair}>Erneut versuchen</button>}
      <button type="button" class="kids-button kids-primary" autoFocus onClick={() => { setShowPair(false); setPresentation(true); }}>Zur Partie</button>
      {remote.active && <button type="button" class="kids-tool" onClick={() => { void remote.disconnect(); setShowPair(false); }}>Smartphone-Verbindung trennen</button>}
    </div></div>}
    {showFinish && game && !finished && <KidsFinishDialog game={game} onCancel={()=>setShowFinish(false)} onFinish={()=>act('finish')} disabled={remote.busy || !!remote.error} error={remote.error}/>}
    {showExit && <div class="kids-exit" role="dialog" aria-modal="true" aria-labelledby="kids-exit-title" onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); setShowExit(false); }
      if (e.key === 'Tab') { e.preventDefault(); const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button'); const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); }
    }}><div><h2 id="kids-exit-title">Zur Vorbereitung zurück?</h2><p>Der Endbildschirm wird geschlossen.</p><button type="button" class="kids-button kids-primary" autoFocus onClick={() => setShowExit(false)}>Abschluss weiter anzeigen</button><button type="button" class="kids-button" onClick={exit}>Zur Vorbereitung</button></div></div>}
  </main></KidsVoiceProvider>;
}
