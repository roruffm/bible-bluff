import type { ComponentChildren, RefObject } from 'preact';
import { kidsScores } from '../../shared/kids-game';
import type { KidsSavedShow } from '../lib/kids-saved';
import { useKidsReadiness } from '../lib/kids-ready';
import { KidsGroupName } from './KidsGroupName';

/** Nach einem Neuladen oder Absturz: mit einem Klick (oder der Leertaste) zurück an dieselbe Stelle. */
export function KidsResume({ saved, onResume, onDiscard, resumeRef }: { saved: KidsSavedShow; onResume: () => void; onDiscard: () => void; resumeRef: RefObject<HTMLButtonElement> }) {
  const { game } = saved, s = kidsScores(game);
  const time = new Date(saved.savedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const where = game.phase === 'finished' ? 'Endbildschirm' : game.phase === 'welcome' ? 'Begrüßung' : game.index === 9 ? 'Superbluff'
    : <>{game.short ? 'Kurzshow' : `Kapitel ${Math.floor(game.index / 3) + 1}`} · <KidsGroupName group={game.rounds[game.index].question.group}/></>;
  return <section class="kids-resume" aria-labelledby="kids-resume-title">
    <p class="kids-eyebrow">GESICHERTER SPIELSTAND · {time} UHR</p>
    <h3 id="kids-resume-title">Show fortsetzen?</h3>
    <p>{where} · Kinderteam <b>{s.team}</b> · Professor Bluff <b>{s.professor}</b></p>
    {game.phase === 'paused' && <p class="kids-resume-note">Der Countdown ist angehalten. Er läuft erst mit „Weiter geht’s“ weiter.</p>}
    <div class="kids-resume-actions">
      <button type="button" class="kids-button kids-primary" ref={resumeRef} onClick={onResume}>Show fortsetzen</button>
      <button type="button" class="kids-tool" onClick={onDiscard}>Verwerfen</button>
    </div>
  </section>;
}

type Mark = 'ok' | 'wait' | 'warn';
function Check({ mark, label, children }: { mark: Mark; label: string; children: ComponentChildren }) {
  return <li class={`kids-check-row is-${mark}`}><span class="kids-check-mark" aria-hidden="true">{mark === 'ok' ? '✓' : mark === 'wait' ? '…' : '!'}</span><b>{label}</b><span>{children}</span></li>;
}

/** Vor dem Einlass einmal durchgehen: Ton, Aufnahmen, Offline-Kopie, Internet für die Fernbedienung, Vollbild. */
export function KidsTechCheck({ checked, testing, sound, onCheck, fullscreen, onFullscreen }: {
  checked: boolean; testing: boolean; sound: 'unarmed' | 'on' | 'off'; onCheck: () => void; fullscreen: boolean | null; onFullscreen: () => void;
}) {
  const { voices, offline, internet } = useKidsReadiness();
  const allVoices = voices.done && voices.loaded === voices.total;
  return <section class="kids-check" aria-labelledby="kids-check-title">
    <div class="kids-check-head">
      <div><h3 id="kids-check-title">Technik-Check</h3><p>Vor dem Einlass: Ton, Aufnahmen, Offline-Kopie und Internet prüfen.</p></div>
      <button type="button" class="kids-tool" disabled={testing} onClick={onCheck}>{checked ? 'Erneut prüfen' : 'Technik prüfen'}</button>
    </div>
    {checked && <ul class="kids-check-list" aria-live="polite">
      <Check mark={sound === 'on' ? 'ok' : sound === 'off' ? 'warn' : 'wait'} label="Ton">{sound === 'on' ? 'Professor Bluff spricht einen Testsatz. Ist er im ganzen Raum gut zu hören?' : sound === 'off' ? 'Kein Ton möglich. Die Gruppen machen die Geräusche selbst.' : 'Ton wird eingeschaltet …'}</Check>
      <Check mark={allVoices ? 'ok' : voices.done ? 'warn' : 'wait'} label="Aufnahmen">{allVoices ? `Alle ${voices.total} Professor-Aufnahmen sind geladen.` : voices.done ? `${voices.loaded} von ${voices.total} Aufnahmen geladen. „Erneut prüfen“ lädt den Rest, fehlende Sprüche bitte selbst vorlesen.` : `${voices.loaded} von ${voices.total} Professor-Aufnahmen geladen …`}</Check>
      <Check mark={offline === 'ready' ? 'ok' : offline === 'idle' || offline === 'preparing' ? 'wait' : 'warn'} label="Ohne Internet">{offline === 'ready' ? 'Fällt das Internet aus, läuft die Show weiter, auch nach einem Neuladen.' : offline === 'unsupported' ? 'Fällt das Internet aus, läuft die Show weiter. Neu laden klappt hier nur mit Internet.' : offline === 'failed' ? 'Offline-Kopie fehlgeschlagen. Die Show läuft bei Netzausfall weiter, neu laden klappt nur mit Internet.' : 'Offline-Kopie wird angelegt …'}</Check>
      <Check mark={internet === 'online' ? 'ok' : internet === 'offline' ? 'warn' : 'wait'} label="Fernbedienung">{internet === 'online' ? 'Internet erreichbar. Das Smartphone lässt sich nach „Show vorbereiten“ unter „Bedienung“ verbinden.' : internet === 'offline' ? 'Kein Internet: bitte mit Maus oder Tastatur steuern. Die Show läuft trotzdem.' : 'Internet wird geprüft …'}</Check>
      {fullscreen !== null && <Check mark={fullscreen ? 'ok' : 'warn'} label="Vollbild">{fullscreen ? 'Vollbild ist an.' : <>Für den Beamer: <button type="button" class="kids-check-action" onClick={onFullscreen}>Vollbild einschalten</button></>}</Check>}
    </ul>}
  </section>;
}

/** Kurzer Stand im Bedienmenü, auch mitten in der Show. */
export function KidsTechStatus() {
  const { voices, offline } = useKidsReadiness();
  const allVoices = voices.done && voices.loaded === voices.total;
  return <p class="kids-tech-status">{allVoices ? '✓' : voices.done ? '!' : '…'} Aufnahmen {voices.loaded}/{voices.total}{offline === 'ready' ? ' · ✓ Offline-Kopie' : ''}</p>;
}
