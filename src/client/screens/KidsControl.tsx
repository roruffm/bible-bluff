import { KidsGroupName, KidsGroupText } from '../components/KidsGroupName';
import { useEffect, useState } from 'preact/hooks';
import { kidsCanJumpToFinal, kidsCanSkipCountdown, kidsLastScoredIndex, kidsPreviousStep, kidsProfessorPoints, kidsResultPoints, kidsScores, updateKidsGame, type KidsGame, type KidsPhase } from '../../shared/kids-game';
import { KIDS_CHAPTERS, kidsAnswerPicture } from '../../shared/kids-show-questions';
import { useKidsRemote } from '../lib/kids-remote';
import { KidsFinishDialog } from '../components/KidsFinish';
import { KidsLogo } from '../components/KidsLogo';
import { KidsPhaseAudio, KidsSoundboard } from '../components/KidsSoundboard';
import { KidsTimePlan } from '../components/KidsTimePlan';
import { professorSays, ShowControls, StoryPicture } from '../components/KidsShow';
import './kids.css';
import './kids-remote.css';

const tabs = [{ id: 'flow', label: 'Ablauf' }, { id: 'audio', label: 'Zusatzaudios' }, { id: 'tools', label: 'Funktionen' }] as const;
type Tab = typeof tabs[number]['id'];
const backTargets: Partial<Record<KidsPhase, string>> = { welcome: 'zur Begrüßung', chapter: 'zum Kapitelstart', superbluff: 'zum Superbluff', reading: 'zum Vorlesen', locked: 'zum Stopp', returning: 'zum Rückweg', judging: 'zur Wertung', revealed: 'zur Auflösung' };

export function KidsControlPage() {
  const [game, setGame] = useState<KidsGame | null>(null);
  const [showFinish, setShowFinish] = useState(false);
  const [tab, setTab] = useState<Tab>('flow');
  const remote = useKidsRemote('control', setGame);
  useEffect(() => { const before = document.title; document.title = 'BibleBluff Kids · Fernbedienung'; return () => { document.title = before; }; }, []);
  useEffect(() => {
    if (game?.phase !== 'moving' && game?.phase !== 'scene') return;
    const timer = window.setInterval(() => setGame(g => g ? updateKidsGame(g, 'tick', Date.now()) : g), 100);
    return () => clearInterval(timer);
  }, [game?.phase]);
  useEffect(() => { if (game?.phase === 'finished' || game?.phase === 'superbluff') { setShowFinish(false); setTab('flow'); } }, [game?.phase]);
  useEffect(() => { if (tab === 'flow') window.scrollTo({ top: 0, behavior: 'instant' }); }, [game?.phase, game?.index]);
  const round = game?.rounds[game.index], scores = game ? kidsScores(game) : null;
  const disabled = remote.busy || !!remote.error;
  const lastScored = game ? kidsLastScoredIndex(game) : -1;
  const back = game ? kidsPreviousStep(game) : null;
  const backNote = !game ? '' : game.phase === 'revealed' ? 'Die Wertung dieser Aufgabe wird zurückgenommen.' : ['moving', 'paused', 'locked'].includes(game.phase) ? 'Der Countdown startet danach wieder von vorn.' : '';
  const phaseLabel = !game ? '' : game.phase === 'moving' ? `${Math.ceil(game.remainingMs / 1000)} s` : ({ welcome: 'Begrüßung', chapter: 'Kapitelstart', superbluff: 'Superbluff', reading: 'Vorlesen', scene: 'Szene läuft', paused: 'Pause', locked: 'Stopp!', returning: 'Rückweg', judging: 'Wertung', revealed: 'Aufgelöst', finished: 'Geschafft!' } as const)[game.phase];
  const direction = !game ? '' : game.phase === 'finished' ? 'Der Endpunktestand bleibt am Beamer sichtbar. Feiert alle Kinder!' : game.phase === 'scene' ? 'Die Szene läuft zehn Sekunden. Danach vorlesen und den Antwort-Countdown starten.' : game.phase === 'locked' ? (game.short ? 'Helfer zählen die Finger. Danach hier das gemeinsame Ergebnis werten.' : 'Helfer prüfen die Felder. Danach alle Kinder zurückholen. Noch nicht auflösen.') : game.phase === 'returning' ? 'Erst weiterklicken, wenn alle Kinder wieder bei ihrer Gruppe sind.' : game.phase === 'judging' ? 'Das gemeldete Ergebnis wählen. Damit erscheint die Auflösung am Beamer.' : game.phase === 'moving' ? (game.short ? 'Die aktive Gruppe zeigt ihre Antwort mit den Fingern.' : 'Die aktive Gruppe wählt ihr Feld. Die anderen feuern an.') : game.phase === 'reading' ? 'Frage und Professor-Tipp abspielen oder vorlesen. Dann die Antwortzeit starten.' : 'Passende Ansage abspielen, dann mit dem großen Knopf weiter.';
  const selectTab = (next: Tab) => { setTab(next); window.scrollTo({ top: 0, behavior: 'instant' }); };
  return <main class="kids-page kids-remote-page">
    <header class="kids-remote-header"><KidsLogo compact/><div><h1>Fernbedienung</h1><p>Nur für die Helfer · Ton am Beamer</p></div></header>
    <p class={`kids-remote-status${remote.error ? ' is-offline' : ''}`} role="status">{remote.error || (remote.view ? 'Mit der Beamer-Partie verbunden' : remote.active ? 'Verbindung wird aufgebaut …' : 'Scanne den QR-Code am Beamer.')}</p>
    {game && round && !remote.fatal && <>
      <div class="kids-remote-toolbar">
        <div class={`kids-remote-live is-${game.phase}`}><span>{game.phase === 'finished' ? 'Alle gemeinsam' : game.index === 9 ? 'Finale · Alle gemeinsam' : <KidsGroupName group={round.question.group}/>}</span><strong>{phaseLabel}</strong></div>
        <nav class="kids-remote-tabs" role="tablist" aria-label="Bereiche der Fernbedienung">{tabs.map((item, index) => <button key={item.id} id={`kids-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`kids-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => selectTab(item.id)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
          if (next === null) return; event.preventDefault(); selectTab(tabs[next].id); document.getElementById(`kids-tab-${tabs[next].id}`)?.focus();
        }}>{item.label}</button>)}</nav>
        <button type="button" class="kids-remote-stop" disabled={disabled} onClick={() => { void remote.send('stop-speech'); }}>■ Professor-Audio stoppen</button>
      </div>
      <section id={`kids-panel-${tab}`} class="kids-remote-panel" role="tabpanel" aria-labelledby={`kids-tab-${tab}`} tabIndex={0}>
        {tab === 'flow' && <>
          {game.phase !== 'finished' && <div class="kids-remote-question"><span>{game.index === 9 ? 'SUPERBLUFF' : game.short ? 'Kurzshow' : `Kapitel ${Math.floor(game.index / 3) + 1}: ${KIDS_CHAPTERS[Math.min(2, Math.floor(game.index / 3))]}`}</span><h2>{round.question.prompt}</h2>{game.index === 9 && <p>Finale: Kinderteam 20 / 10 / 0 Punkte · Professor Bluff +0</p>}</div>}
          <section class="kids-remote-step" aria-labelledby="kids-next-step"><h2 id="kids-next-step"><span>1</span> Jetzt steuern</h2><p>{direction}</p>
            <div class="kids-remote-actions">{game.phase === 'finished' ? <div class="kids-remote-farewell"><h2>Gemeinsam seid ihr stark!</h2><p>{scores!.playedRounds} {scores!.playedRounds === 1 ? 'Aufgabe gewertet' : 'Aufgaben gewertet'}. Der Abschluss bleibt stehen.</p></div> : <ShowControls game={game} act={action => { void remote.send(action); }} disabled={disabled}/>}
              {kidsCanSkipCountdown(game) && <button type="button" class="kids-tool kids-skip-countdown" aria-label="Countdown überspringen" disabled={disabled} onClick={() => { void remote.send('skip-countdown'); }}>⏭ Countdown überspringen</button>}
              {back && <button type="button" class="kids-tool kids-remote-back" disabled={disabled} onClick={() => { void remote.send('back'); }}>← Zurück {backTargets[back.phase]}</button>}
            </div>
            {back && backNote && <p class="kids-remote-back-note">{backNote}</p>}
            {game.phase === 'revealed' && lastScored >= 0 && <button type="button" class="kids-remote-correct-link" onClick={() => selectTab('tools')}>Letzte Wertung ändern</button>}
          </section>
          <KidsPhaseAudio game={game} disabled={disabled} send={remote.send}/>
          {game.phase !== 'finished' && <details class="kids-remote-direction kids-remote-guide" key={`${game.phase}:${game.index}`} open={game.phase === 'locked' || game.phase === 'judging'}><summary>Antworten & Regiehinweis · nur für Helfer</summary>
            <p><KidsGroupText text={round.question.direction}/></p>
            {game.short && <p>Kurzshow: Die aktive Gruppe bleibt sitzen und zeigt 1, 2 oder 3 Finger.</p>}
            {game.phase === 'welcome' && <p>Mehrheit richtig = 10, mindestens ein Kind richtig = 5, keiner richtig = 0. Professor +{kidsProfessorPoints(game)} je regulärer Aufgabe. Finale: Kinder 20 / 10 / 0, Professor +0. Niemand scheidet aus.</p>}
            <ol class="kids-remote-answers">{round.answers.map((answer, i) => <li key={i} class={`kids-field-${i + 1}${i === round.correctIndex ? ' is-correct' : ''}`}><b>{i + 1}</b><StoryPicture motif={kidsAnswerPicture(round.question, answer)}/><span>{answer}{i === round.correctIndex && <small class="kids-remote-correct">✓ Richtige Antwort</small>}{answer === round.question.bluff.answer && <small class="kids-remote-bluff">Professor-Tipp (Bluff)</small>}</span></li>)}</ol>
          </details>}
        </>}
        {tab === 'audio' && <KidsSoundboard game={game} disabled={disabled} send={remote.send}/>}
        {tab === 'tools' && <>
          <section class="kids-remote-function" aria-labelledby="kids-tools-title"><h2 id="kids-tools-title">Spielverlauf</h2><p>Abkürzungen und Abschluss für die Spielleitung.</p>
            {kidsCanJumpToFinal(game) && <button type="button" class="kids-button kids-final-jump" disabled={disabled} onClick={() => { void remote.send('jump-final'); }}>🏁 Direkt ins Finale</button>}
            {game.phase !== 'finished' && <button type="button" class="kids-button kids-remote-finish" disabled={disabled} onClick={() => setShowFinish(true)}>Spiel abschließen</button>}
            {game.phase === 'finished' && <p>Die Show ist abgeschlossen. Für eine neue Show am Computer H drücken und zur Vorbereitung zurückkehren.</p>}
          </section>
          {lastScored >= 0 && <section class="kids-remote-direction kids-score-correction" aria-labelledby="kids-correction-title"><h2 id="kids-correction-title">Letzte Wertung ändern</h2><p>Aufgabe {lastScored + 1}: {game.rounds[lastScored].question.prompt}</p><p role="status">Aktuell: {kidsResultPoints(game.results[lastScored], lastScored)} Punkte für das Kinderteam.</p>
            <div class="kids-correction-options">{([
              ['correct', `Mehrheit richtig · ${kidsResultPoints('correct', lastScored)} Punkte`],
              ['participated', `Mindestens ein Kind richtig · ${kidsResultPoints('participated', lastScored)} Punkte`],
              ['none', 'Keiner richtig · 0 Punkte'],
            ] as const).map(([result, label]) => <button key={result} type="button" class="kids-button" aria-pressed={game.results[lastScored] === result} disabled={disabled || game.results[lastScored] === result} onClick={() => { void remote.send(`${result}-last`); }}>{label}</button>)}</div>
            <small>Ändert nur diese Wertung. Die laufende Frage und der Timer bleiben bestehen.</small>
          </section>}
          <KidsTimePlan game={game}/>
          <details class="kids-remote-direction"><summary>Verbindung & Ton</summary><p>Nach einem Netzabbruch wird automatisch erneut verbunden. Alle Audios und Szenen erklingen am Beamer, Sprüche starten per Knopfdruck.</p><p>Nach einem Neuladen am Beamer: H drücken → Bedienung → Klang einschalten. Mit H anschließend wieder nur die Show anzeigen.</p></details>
        </>}
      </section>
      <div class="kids-remote-score">Kinderteam <b>{scores!.team}</b><span>Professor Bluff <b>{scores!.professor}</b></span></div>
      {tab === 'flow' && <KidsTimePlan game={game} compact/>}
      {showFinish && game.phase !== 'finished' && <KidsFinishDialog game={game} onCancel={() => setShowFinish(false)} onFinish={() => { void remote.send('finish'); }} disabled={disabled} error={remote.error}/>}
    </>}
    {!remote.active && <p class="kids-remote-empty">Am Computer: „Smartphone-Fernbedienung einrichten“ wählen. Bei laufender Show: H → Bedienung → Smartphone verbinden.</p>}
  </main>;
}
