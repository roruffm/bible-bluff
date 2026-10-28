import { kidsPreviousStep, type KidsGame } from '../../shared/kids-game';
import type { KidsRemoteAction } from '../../shared/kids-remote';
import { kidsAudioStatus } from '../../shared/kids-audio-controls';
import { kidsRegieCanUse, kidsRegieCurrent, kidsRegieStatus, kidsRegieSteps, type KidsRegieId } from '../../shared/kids-regie';
import { KidsIntroControls } from './KidsIntroVideo';
import { KidsMobileAudio } from './KidsMobileAudio';
import { ShowControls } from './KidsShow';
import './kids-regie.css';

export function KidsRegie({ game, disabled, send }: { game: KidsGame; disabled: boolean; send: (action: KidsRemoteAction) => Promise<void> }) {
  const steps = kidsRegieSteps(game), current = kidsRegieCurrent(game);
  const status = kidsAudioStatus(game), speaking = status.state === 'loading' || status.state === 'playing';
  const invoke = (action: KidsRemoteAction) => { void send(action); };
  const act = (id: KidsRegieId) => invoke(`regie:do:${id}`);
  const done = steps.filter(s => kidsRegieStatus(game, s.id) === 'done').length;
  const skipped = steps.filter(s => kidsRegieStatus(game, s.id) === 'skipped').length;
  const index = steps.findIndex(s => s.id === current.id);
  const back = kidsPreviousStep(game);
  const backTargets = { welcome: 'zur Begrüßung', chapter: 'zum Kapitelstart', superbluff: 'zum Superbluff', reading: 'zum Vorlesen', locked: 'zum Stopp', returning: 'zum Rückweg', judging: 'zur Wertung', revealed: 'zur Auflösung' };
  const backNote = game.phase === 'revealed' ? 'Die Wertung dieser Aufgabe wird zurückgenommen.' : ['moving', 'paused', 'locked'].includes(game.phase) ? 'Der Countdown startet danach wieder von vorn.' : '';
  const mainLabel = game.phase === 'scene' ? 'Zur Frage' : game.phase === 'moving' ? 'Ⅱ Pause' : game.phase === 'paused' ? 'Weiter geht’s' : current.label;
  const mainName = game.phase === 'scene' || game.phase === 'moving' || game.phase === 'paused' || !current.audio ? mainLabel : current.id === 'question' ? 'Frage am Beamer vorlesen' : current.id === 'answers' ? 'Antworten vorlesen' : current.id === 'welcome' ? 'Spruch am Beamer abspielen' : `${mainLabel} am Beamer abspielen`;
  const mainAction = () => invoke(game.phase === 'scene' ? 'end-scene' : game.phase === 'moving' ? 'pause' : game.phase === 'paused' ? 'resume' : `regie:do:${current.id}`);
  const locked = disabled || !!game.introVideo;
  const mainDisabled = locked || current.audio && speaking && game.phase !== 'scene';
  const repeat: KidsRemoteAction | null = !(game.voiceSeq ?? 0) ? null
    : game.voiceKind === 'interjection' && game.voiceClip ? `interjection:${game.voiceClip}`
    : game.voiceKind === 'question' && game.phase === 'reading' ? 'read-question'
    : game.voiceKind === 'answers' && game.phase === 'reading' ? 'read-answers'
    : game.voiceKind === 'quote' && game.voiceCue === `${game.phase}:${game.index}` ? 'speak' : null;
  return <div class="kids-regie">
    <div class="kids-regie-round"><b>{game.index === 9 ? 'Gemeinsames Finale' : `Runde ${game.index + 1} von 10`}</b><span>{done}/{steps.length} erledigt{skipped > 0 && ` · ${skipped} übersprungen`}</span></div>
    <nav class={`kids-regie-steps${steps.length < 4 ? ' is-short' : ''}`} aria-label="Schritte dieser Runde">{steps.map((step, i) => {
      const state = kidsRegieStatus(game, step.id);
      return <button key={step.id} type="button" class={`is-${state}`} data-regie-step={step.id} aria-current={current.id === step.id ? 'step' : undefined} aria-label={`${step.short}, ${state === 'done' ? 'erledigt' : state === 'skipped' ? 'übersprungen' : 'offen'}`} disabled={locked || !kidsRegieCanUse(game, step.id)} onClick={() => { if (current.id !== step.id) invoke(`regie:select:${step.id}`); }}><span aria-hidden="true">{state === 'done' ? '✓' : state === 'skipped' ? '↷' : i + 1}</span>{step.short}</button>;
    })}</nav>
    <KidsIntroControls game={game} disabled={disabled} act={invoke}/>
    <section class="kids-regie-action" aria-label="Nächste Aktion">
      <p class="kids-regie-eyebrow">{game.phase === 'moving' ? 'Antwortzeit läuft' : game.phase === 'paused' ? 'Antwortzeit pausiert' : game.phase === 'scene' ? 'Szene läuft' : 'Jetzt dran'}{index >= 0 && ` · Schritt ${index + 1} von ${steps.length}`}</p>
      <h2>{game.phase === 'moving' || game.phase === 'paused' ? `${Math.ceil(game.remainingMs / 1000)} Sekunden` : current.title}</h2>
      <p class="kids-regie-description">{game.phase === 'moving' || game.phase === 'paused' ? 'Die aktive Gruppe wählt ihr Feld. Die anderen feuern an.' : current.description}</p>
      {game.phase === 'judging' ? <ShowControls game={game} act={invoke} disabled={locked}/> : <button type="button" class={`kids-button kids-regie-main${current.audio ? ' is-audio' : ''}${current.scene && game.phase !== 'scene' ? ' is-scene' : ''}`} disabled={mainDisabled} aria-label={mainName} onClick={mainAction}>{current.audio && !['moving', 'paused', 'scene'].includes(game.phase) && <span aria-hidden="true">▶ </span>}{mainLabel}</button>}
      {game.phase === 'reading' && current.id === 'invite' && <button type="button" class="kids-button kids-scene-play kids-regie-scene-next" disabled={locked} aria-label="Szene am Beamer abspielen" onClick={() => act('scene')}>▷ Szene am Beamer abspielen</button>}
      {game.phase === 'moving' && <button type="button" class="kids-tool kids-regie-context" disabled={locked} aria-label="Countdown für letzte 5 Sekunden vormerken" onClick={() => invoke('interjection:signal-countdown')}>◷ Countdown für letzte 5 Sekunden vormerken</button>}
      {game.phase === 'paused' && <button type="button" class="kids-tool kids-regie-context" disabled={locked} aria-label="Pause · bleibt stehen am Beamer abspielen" onClick={() => invoke('interjection:signal-pause')}>▶ Pause · bleibt stehen</button>}
      <div class="kids-regie-smallactions">
        {repeat && <button type="button" disabled={locked || game.phase === 'scene'} onClick={() => invoke(repeat)}>↶ Letzte Ansage</button>}
        {current.optional && game.phase !== 'scene' && <button type="button" class="kids-regie-skip" aria-label={current.id === 'countdown' ? 'Countdown überspringen' : 'Überspringen ⏭'} disabled={locked} onClick={() => invoke(game.phase === 'moving' || game.phase === 'paused' ? 'skip-countdown' : `regie:skip:${current.id}`)}>{current.id === 'countdown' ? 'Countdown überspringen' : 'Überspringen'} ⏭</button>}
      </div>
    </section>
    <p class="kids-regie-saved" aria-live="polite">{status.state === 'failed' ? 'Audio bleibt offen · Ton am Beamer prüfen.' : speaking && current.audio ? 'Häkchen nach vollständiger Wiedergabe.' : skipped > 0 ? '✓ Fortschritt gespeichert · ↷ übersprungene Schritte bleiben markiert' : '✓ Fortschritt gespeichert · jeder verfügbare Schritt direkt anwählbar'}</p>
    <KidsMobileAudio game={game} disabled={locked} send={send} extrasOnly/>
    {back && <button type="button" class="kids-tool kids-regie-back" disabled={locked} onClick={() => invoke('back')}>← Zurück {backTargets[back.phase as keyof typeof backTargets]}</button>}
    {back && backNote && <p class="kids-regie-saved">{backNote}</p>}
  </div>;
}
