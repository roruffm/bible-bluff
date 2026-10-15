import { KidsGroupName, KidsGroupText } from '../components/KidsGroupName';
import { professorVoiceKey } from '../../shared/professor-voice';
import { useEffect, useState } from 'preact/hooks';
import { kidsScores, updateKidsGame, type KidsGame } from '../../shared/kids-game';
import { KIDS_CHAPTERS, kidsAnswerPicture } from '../../shared/kids-show-questions';
import { useKidsRemote } from '../lib/kids-remote';
import { KidsFinishDialog } from '../components/KidsFinish';
import { KidsLogo } from '../components/KidsLogo';
import { professorSays, ShowControls, StoryPicture } from '../components/KidsShow';
import './kids.css';

export function KidsControlPage() {
  const [game, setGame] = useState<KidsGame | null>(null);
  const [showFinish,setShowFinish]=useState(false);
  const remote = useKidsRemote('control', setGame);
  useEffect(() => { const before = document.title; document.title = 'BibleBluff Kids · Show-Steuerung'; return () => { document.title = before; }; }, []);
  useEffect(() => {
    if (game?.phase !== 'moving' && game?.phase !== 'scene') return;
    const timer = window.setInterval(() => setGame(g => g ? updateKidsGame(g, 'tick', Date.now()) : g), 100);
    return () => clearInterval(timer);
  }, [game?.phase]);
  useEffect(()=>{if(game?.phase==='finished') setShowFinish(false);},[game?.phase]);
  const round = game?.rounds[game.index], scores = game ? kidsScores(game) : null;
  const disabled = remote.busy || !!remote.error;
  const phaseLabel = !game ? '' : game.phase === 'moving' ? `${Math.ceil(game.remainingMs / 1000)} s` : ({ welcome:'Begrüßung', chapter:'Kapitelstart', superbluff:'Superbluff', reading:'Vorlesen', scene:'Szene läuft', paused:'Pause', locked:'Stopp!', returning:'Rückweg', judging:'Wertung', revealed:'Aufgelöst', finished:'Geschafft!' } as const)[game.phase];
  return <main class="kids-page kids-remote-page">
    <header><KidsLogo compact/><h1>Show-Steuerung</h1><p class={`kids-remote-status${remote.error ? ' is-offline' : ''}`} role="status">{remote.error || (remote.view ? 'Mit der Beamer-Partie verbunden' : remote.active ? 'Verbindung wird aufgebaut …' : 'Scanne den QR-Code am Beamer.')}</p></header>
    {game && round && !remote.fatal && <>
      <div class="kids-remote-score">Kinderteam <b>{scores!.team}</b><span>Professor Bluff <b>{scores!.professor}</b></span></div>
      {game.phase!=='finished' && <div class="kids-remote-question"><span>{game.index===9 ? 'SUPERBLUFF · Alle gemeinsam' : <><KidsGroupName group={round.question.group}/> · Kapitel {Math.floor(game.index/3)+1}: {KIDS_CHAPTERS[Math.min(2,Math.floor(game.index/3))]}</>}</span><h2>{round.question.prompt}</h2></div>}
      <div class={`kids-remote-phase is-${game.phase}`}><strong>{phaseLabel}</strong><span>{game.phase==='finished' ? 'Der Endpunktestand bleibt am Beamer sichtbar.' : game.phase==='scene' ? 'Die zehnsekündige Szene läuft groß am Beamer. Danach bleibt Zeit zum Vorlesen. Der Antwort-Countdown startet erst mit deinem nächsten Schritt.' : game.phase==='locked' ? 'Helfer prüfen: Mehrheit richtig, mindestens ein Kind richtig oder keiner richtig. Noch nicht auflösen.' : game.phase==='returning' ? 'Warte, bis alle Kinder wieder in ihrer Gruppe sind.' : game.phase==='judging' ? 'Nur das gemeinsame Resultat eintragen. Damit wird aufgelöst.' : game.phase==='moving' ? 'Die aktive Gruppe wählt ihr Feld.' : 'Du bestimmst, wann es weitergeht.'}</span></div>
      {game.phase!=='finished' && <details class="kids-remote-direction" open={game.phase==='reading' || game.phase==='superbluff'}><summary>Regiehinweis · nur Spielleitung</summary><p><KidsGroupText text={round.question.direction}/></p>{game.phase==='welcome' && <p>Alle drei Teams begrüßen. Regel ansagen: Mehrheit richtig = 10, sonst mindestens ein Kind richtig = 5, keiner richtig = 0. Professor +7. Niemand scheidet aus.</p>}{game.phase==='chapter' && <p>Andere Gruppen bleiben in ihren Bereichen. Jetzt kommt zuerst die Aufgabe der jüngsten Gruppe.</p>}</details>}
      {['reading','moving','paused','locked','returning','judging','revealed'].includes(game.phase) && <ol class="kids-remote-answers">{round.answers.map((answer,i)=><li class={`kids-field-${i+1}${game.phase==='revealed' && i===round.correctIndex ? ' is-correct' : ''}`}><b>{i+1}</b><StoryPicture motif={kidsAnswerPicture(round.question,answer)}/><span>{answer}</span></li>)}</ol>}
      {game.phase==='reading' && <div class="kids-remote-extras"><button class="kids-button" type="button" disabled={disabled} onClick={()=>remote.send('read-question')}>▶ Frage am Beamer vorlesen</button>{game.index===9 && <small>Finalfrage vorläufig mit deutscher Gerätestimme.</small>}{round.question.scene && <button class="kids-button" type="button" disabled={disabled} onClick={()=>remote.send('scene')}>Szene am Beamer abspielen</button>}</div>}
      {professorVoiceKey(game) && <section class="kids-remote-direction kids-remote-voice" aria-label="Professor-Sprache am Beamer"><b>Professor Bluff:</b><p>{professorSays(game)}</p><div><button type="button" class="kids-button" disabled={disabled} onClick={()=>{void remote.send('speak');}}>▶ Spruch am Beamer abspielen</button><button type="button" class="kids-tool" disabled={disabled} onClick={()=>{void remote.send('stop-speech');}}>■ Sprache stoppen</button></div></section>}
      <div class="kids-remote-actions">{game.phase==='finished' ? <div class="kids-remote-farewell"><h2>Gemeinsam seid ihr stark!</h2><p>{professorSays(game)}</p><p>{scores!.playedRounds} {scores!.playedRounds===1 ? 'Aufgabe gewertet' : 'Aufgaben gewertet'}. Lasst den Abschluss am Beamer stehen und feiert alle Kinder.</p></div> : <ShowControls game={game} act={action=>{void remote.send(action);}} disabled={disabled}/>}</div>
      {game.phase!=='finished' && <button type="button" class="kids-button kids-remote-finish" disabled={disabled} onClick={()=>setShowFinish(true)}>Spiel abschließen</button>}
      {showFinish && game.phase!=='finished' && <KidsFinishDialog game={game} onCancel={()=>setShowFinish(false)} onFinish={()=>{void remote.send('finish');}} disabled={disabled} error={remote.error}/>}
      <p class="kids-remote-note">Maus und Smartphone steuern denselben Stand. Nach einem Netzabbruch wird automatisch erneut verbunden. Sprache und Szenen erklingen am Beamer. Nach einem Neuladen dort einmal „Bedienung → Klang einschalten“ wählen. Sprüche starten nur per Knopfdruck.</p>
    </>}
    {!remote.active && <p class="kids-remote-empty">Am Computer: Show vorbereiten → Bedienung → Smartphone verbinden.</p>}
  </main>;
}
