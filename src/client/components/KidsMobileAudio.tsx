import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { KidsGame } from '../../shared/kids-game';
import type { KidsRemoteAction } from '../../shared/kids-remote';
import { KIDS_AUDIO_SITUATIONS, kidsAudioAvailable, kidsAudioLabel, kidsContextAudio, kidsFavoriteId, parseKidsAudioFavorites, type KidsAudioShortcut } from '../../shared/kids-audio-controls';
import { professorInterjectionForRound, type ProfessorInterjectionId } from '../../shared/professor-interjections';
import { professorSays } from './KidsShow';
import './kids-mobile-audio.css';

const FAVORITES_KEY = 'bb:kids:audio-favorites';
type Props = { game: KidsGame; disabled: boolean; send: (action: KidsRemoteAction) => Promise<void>; sceneStep: 'scene' | 'question'; onSceneStep: (step: 'scene' | 'question') => void; children?: ComponentChildren };

function AudioChoice({ game, shortcut, disabled, send, favorites, toggleFavorite }: Pick<Props, 'game' | 'disabled' | 'send'> & {
  shortcut: KidsAudioShortcut; favorites: readonly ProfessorInterjectionId[]; toggleFavorite: (id: ProfessorInterjectionId) => void;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const special = shortcut === 'speak' || shortcut === 'read-question' || shortcut === 'read-answers';
  const clip = special ? null : professorInterjectionForRound(shortcut, game.index)!;
  const label = kidsAudioLabel(game, shortcut);
  const shortLabel = shortcut === 'signal-countdown' && game.phase === 'moving' ? 'Countdown vormerken' : shortcut === 'read-question' ? 'Frage vorlesen' : shortcut === 'speak' ? 'Professor-Spruch' : label;
  const favorite = clip && favorites.includes(kidsFavoriteId(clip.id));
  const text = shortcut === 'speak' ? professorSays(game) : shortcut === 'read-question' ? game.rounds[game.index].question.prompt : shortcut === 'read-answers' ? game.rounds[game.index].answers.join(' · ') : clip!.text;
  const action: KidsRemoteAction = special ? shortcut : `interjection:${clip!.id}`;
  return <div class="kids-mobile-clip">
    <button type="button" class={`kids-button kids-mobile-audio-play${shortcut === 'scene-invite' ? ' kids-scene-invite' : ''}`} disabled={disabled} aria-label={special || shortcut === 'signal-countdown' && game.phase === 'moving' ? label : `${label} am Beamer abspielen`} onClick={() => { void send(action); }}><span aria-hidden="true">▶</span> {shortLabel}</button>
    {clip && <button type="button" class="kids-audio-star" aria-label={`${label} ${favorite ? 'aus Favoriten entfernen' : 'als Favorit speichern'}`} aria-pressed={!!favorite} disabled={!favorite && favorites.length >= 3} onClick={() => toggleFavorite(clip.id)}>{favorite ? '★' : '☆'}</button>}
    <button type="button" class="kids-audio-info" aria-label={`Text zu „${label}“ anzeigen`} aria-expanded={infoOpen} onClick={() => setInfoOpen(!infoOpen)}>ⓘ</button>
    {infoOpen && <p class="kids-mobile-clip-text">{text}</p>}
  </div>;
}

export function KidsMobileAudio({ game, disabled, send, sceneStep, onSceneStep, children }: Props) {
  const [favorites, setFavorites] = useState<ProfessorInterjectionId[]>(() => {
    try { return parseKidsAudioFavorites(localStorage.getItem(FAVORITES_KEY)); } catch { return []; }
  });
  const [situation, setSituation] = useState<typeof KIDS_AUDIO_SITUATIONS[number]['id'] | null>(null);
  useEffect(() => { try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch { /* Favoriten gelten weiter für diese Sitzung. */ } }, [favorites]);
  const toggleFavorite = (id: ProfessorInterjectionId) => {
    const key = kidsFavoriteId(id);
    setFavorites(previous => previous.includes(key) ? previous.filter(value => value !== key) : previous.length < 3 ? [...previous, key] : previous);
  };
  const choices = kidsContextAudio(game, sceneStep);
  const makeChoice = (shortcut: KidsAudioShortcut) => <AudioChoice key={`${game.index}:${game.phase}:${shortcut}`} game={game} shortcut={shortcut} disabled={disabled} send={send} favorites={favorites} toggleFavorite={toggleFavorite}/>;
  const availableFavorites = favorites.map(id => professorInterjectionForRound(id, game.index)!).filter(clip => kidsAudioAvailable(game, clip.id) && !choices.includes(clip.id) && !choices.includes(kidsFavoriteId(clip.id)));
  const selected = KIDS_AUDIO_SITUATIONS.find(item => item.id === situation);
  const hasScene = game.phase === 'reading' && game.rounds[game.index].question.group === 'minis' && !!game.rounds[game.index].question.scene;
  return <div class="kids-mobile-audio">
    <section class="kids-remote-direction kids-soundboard kids-phase-audio" aria-label="Audio zur aktuellen Spielphase">
      <h2>Jetzt passend</h2>
      {hasScene && <div class="kids-audio-steps" role="group" aria-label="Forscher-Aufgabe vorbereiten"><button type="button" aria-pressed={sceneStep === 'scene'} onClick={() => onSceneStep('scene')}>Szene</button><button type="button" aria-pressed={sceneStep === 'question'} onClick={() => onSceneStep('question')}>Frage & Antworten</button></div>}
      <div class="kids-mobile-audio-choices">{choices.map(makeChoice)}</div>
      {hasScene && sceneStep === 'scene' && <button class="kids-button kids-scene-play kids-mobile-scene-play" type="button" disabled={disabled} aria-label="Szene am Beamer abspielen" onClick={() => { void send('scene'); }}>▷ Szene am Beamer abspielen</button>}
    </section>
    {children}
    {availableFavorites.length > 0 && <section class="kids-mobile-favorites kids-soundboard" aria-label="Deine Favoriten"><h2>★ Deine Favoriten</h2><div class="kids-mobile-audio-choices">{availableFavorites.map(clip => makeChoice(clip.id))}</div></section>}
    <details class="kids-mobile-more kids-soundboard" key={`${game.index}:${game.phase}`} onToggle={event => { if (!event.currentTarget.open) setSituation(null); }}>
      <summary>Weitere Ansagen <small>Nach Situation wählen</small></summary>
      <div class="kids-mobile-library">
        {selected ? <>
          <button type="button" class="kids-audio-back" onClick={() => setSituation(null)}>← Alle Situationen</button>
          <h3>{selected.label}</h3>
          <div class="kids-mobile-audio-choices">{selected.clips.filter(id => kidsAudioAvailable(game, id)).map(makeChoice)}</div>
          {selected.id === 'play' && game.phase === 'reading' && game.rounds[game.index].question.scene && !hasScene && <button type="button" class="kids-button kids-scene-play" disabled={disabled} onClick={() => { void send('scene'); }}>▷ Szene am Beamer abspielen</button>}
          {!selected.clips.some(id => kidsAudioAvailable(game, id)) && <p>Diese Ansagen stehen in der passenden Runde bereit.</p>}
        </> : <div class="kids-audio-situations">{KIDS_AUDIO_SITUATIONS.map(item => <button type="button" key={item.id} onClick={() => setSituation(item.id)}>{item.label}<span aria-hidden="true">›</span></button>)}</div>}
        <p class="kids-audio-favorite-hint">{favorites.length >= 3 ? 'Drei Favoriten gewählt. Entferne einen Stern zum Wechseln.' : `☆ markiert deine Favoriten · ${favorites.length}/3 gewählt`}</p>
      </div>
    </details>
  </div>;
}
