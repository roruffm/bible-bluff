import { useEffect, useState } from 'preact/hooks';
import { kidsScores, updateKidsGame, type KidsGame } from '../../shared/kids-game';
import { KIDS_CHAPTERS, KIDS_GROUPS } from '../../shared/kids-show-questions';
import { useKidsRemote } from '../lib/kids-remote';
import { KidsLogo } from '../components/KidsLogo';
import { ShowControls } from '../components/KidsShow';
import './kids.css';

export function KidsControlPage() {
  const [game, setGame] = useState<KidsGame | null>(null);
  const remote = useKidsRemote('control', setGame);
  useEffect(() => { const before = document.title; document.title = 'BibleBluff Kids · Show-Steuerung'; return () => { document.title = before; }; }, []);
  useEffect(() => {
    if (game?.phase !== 'moving') return;
    const timer = window.setInterval(() => setGame(g => g ? updateKidsGame(g, 'tick', Date.now()) : g), 100);
    return () => clearInterval(timer);
  }, [game?.phase]);
  const round = game?.rounds[game.index], scores = game ? kidsScores(game) : null;
  const disabled = remote.busy || !!remote.error;
  const phaseLabel = !game ? '' : game.phase === 'moving' ? `${Math.ceil(game.remainingMs / 1000)} s` : ({ welcome:'Begrüßung', chapter:'Kapitelstart', superbluff:'Superbluff', reading:'Vorlesen', paused:'Pause', locked:'Stopp!', returning:'Rückweg', judging:'Wertung', revealed:'Aufgelöst', finished:'Geschafft!' } as const)[game.phase];
  return <main class="kids-page kids-remote-page">
    <header><KidsLogo compact/><h1>Show-Steuerung</h1><p class={`kids-remote-status${remote.error ? ' is-offline' : ''}`} role="status">{remote.error || (remote.view ? 'Mit der Beamer-Partie verbunden' : remote.active ? 'Verbindung wird aufgebaut …' : 'Scanne den QR-Code am Beamer.')}</p></header>
    {game && round && !remote.fatal && <>
      <div class="kids-remote-score">Kinderteam <b>{scores!.team}</b><span>Professor Bluff <b>{scores!.professor}</b></span></div>
      <div class="kids-remote-question"><span>{game.index===9 ? 'SUPERBLUFF · Alle gemeinsam' : `${KIDS_GROUPS[round.question.group].name} · Kapitel ${Math.floor(game.index/3)+1}: ${KIDS_CHAPTERS[Math.min(2,Math.floor(game.index/3))]}`}</span><h2>{round.question.prompt}</h2></div>
      <div class={`kids-remote-phase is-${game.phase}`}><strong>{phaseLabel}</strong><span>{game.phase==='locked' ? 'Helfer merken sich die Mehrheit. Noch nicht auflösen.' : game.phase==='returning' ? 'Warte, bis alle Kinder wieder in ihrer Gruppe sind.' : game.phase==='judging' ? 'Nur das gemeinsame Resultat eintragen. Damit wird aufgelöst.' : game.phase==='moving' ? 'Die aktive Gruppe wählt ihr Feld.' : 'Du bestimmst, wann es weitergeht.'}</span></div>
      {game.phase!=='finished' && <details class="kids-remote-direction" open={game.phase==='reading' || game.phase==='superbluff'}><summary>Regiehinweis · nur Spielleitung</summary><p>{round.question.direction}</p>{game.phase==='welcome' && <p>Alle drei Teams begrüßen. Regel ansagen: +5 Mitmachen, +5 richtige Mehrheit, Professor +7. Niemand scheidet aus.</p>}{game.phase==='chapter' && <p>Andere Gruppen bleiben in ihren Bereichen. {game.index===3 ? 'Eltern dürfen einmal einen Familienjoker für eine der nächsten drei Aufgaben freischalten.' : 'Jetzt kommt zuerst die Mini-Aufgabe.'}</p>}</details>}
      {['reading','moving','paused','locked','returning','judging','revealed'].includes(game.phase) && <ol class="kids-remote-answers">{round.answers.map((answer,i)=><li class={`kids-field-${i+1}${game.phase==='revealed' && i===round.correctIndex ? ' is-correct' : ''}`}><b>{i+1}</b><span>{answer}</span></li>)}</ol>}
      {game.jokerFor===game.index && <p class="kids-remote-direction">Familienjoker: {round.question.hint}</p>}
      {game.phase==='reading' && <div class="kids-remote-extras">{round.question.scene && <button class="kids-button" type="button" disabled={disabled} onClick={()=>remote.send('scene')}>Szene am Beamer abspielen</button>}{game.index>=3 && game.index<=5 && game.jokerFor===null && <button class="kids-button" type="button" disabled={disabled} onClick={()=>remote.send('joker')}>Familienjoker freischalten</button>}</div>}
      <div class="kids-remote-actions">{game.phase==='finished' ? <button type="button" class="kids-button kids-primary" disabled={disabled} onClick={()=>remote.send('restart')}>Revanche starten ↻</button> : <ShowControls game={game} act={action=>{void remote.send(action);}} disabled={disabled}/>}</div>
      <p class="kids-remote-note">Maus und Smartphone steuern denselben Stand. Nach einem Netzabbruch wird automatisch erneut verbunden. Klang wird am Beamer unter „Bedienung“ eingeschaltet.</p>
    </>}
    {!remote.active && <p class="kids-remote-empty">Am Computer: Show vorbereiten → Bedienung → Smartphone verbinden.</p>}
  </main>;
}
