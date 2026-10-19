import { useEffect, useRef } from 'preact/hooks';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { kidsIntroPosition, KIDS_INTRO_URL } from '../../shared/kids-intro';
import './kids-intro-video.css';

/** Im Klick auf „Show vorbereiten“ denselben Player für spätere Fernbedienung freigeben. */
export function unlockKidsIntroVideo() {
  const video = document.querySelector<HTMLVideoElement>('.kids-intro-film');
  if (!video) return;
  video.muted = false;
  void video.play().catch(() => {});
  video.pause();
  video.currentTime = 0;
}

type ControlsProps = { game: KidsGame; disabled: boolean; act: (action: Exclude<KidsAction, 'tick'>) => void };
export function KidsIntroControls({ game, disabled, act }: ControlsProps) {
  if (game.phase !== 'welcome') return null;
  const video = game.introVideo;
  return <section class="kids-intro-controls" aria-label="Erklärvideo steuern">
    <h2>So spielt ihr mit</h2>
    <p>Erklärvideo · 52 Sekunden · Bild und Ton am Beamer</p>
    <button type="button" class="kids-button kids-intro-play" disabled={disabled} onClick={() => { if (!video?.playing) unlockKidsIntroVideo(); act(video?.playing ? 'pause-intro' : 'play-intro'); }}>
      {video?.playing ? 'Ⅱ Erklärvideo pausieren' : video ? '▶ Erklärvideo fortsetzen' : '▶ Erklärvideo am Beamer abspielen'}
    </button>
    {video && <><p role="status">{video.playing ? 'Erklärvideo läuft am Beamer.' : 'Erklärvideo ist angehalten.'}</p>
      <div class="kids-intro-extra"><button type="button" class="kids-tool" disabled={disabled} onClick={() => act('restart-intro')}>↺ Video von vorne</button>
        <button type="button" class="kids-tool" disabled={disabled} onClick={() => act('stop-intro')}>■ Video beenden</button></div></>}
    <small>Danach „Mission starten“ wählen. Das Spiel wartet auf euch.</small>
  </section>;
}

/** Nur dieser Player erzeugt Bild und Ton; auf der Fernbedienung wird kein Video geladen. */
export function KidsIntroVideo({ game, act, onError }: { game: KidsGame | null; act: (action: KidsAction) => void; onError: (message: string) => void }) {
  const player = useRef<HTMLVideoElement>(null);
  const current = useRef({ game, act, onError });
  current.current = { game, act, onError };
  const video = game?.introVideo;
  const active = game?.phase === 'welcome' && !!video;
  useEffect(() => {
    const element = player.current;
    if (!element) return;
    let cancelled = false;
    const fail = () => {
      if (cancelled || !current.current.game?.introVideo) return;
      current.current.onError('Erklärvideo konnte nicht starten. Am Beamer H drücken und das Video mit der Maus starten. Bei einem Ladefehler die Verbindung prüfen.');
      current.current.act('stop-intro');
    };
    const sync = () => {
      const next = current.current.game?.introVideo;
      if (!active || !next) { element.pause(); return; }
      const position = kidsIntroPosition(next, Date.now());
      // Ein frischer Start soll trotz der kurzen Fernbedienungs-Laufzeit das ganze Intro zeigen.
      element.currentTime = next.playing && next.fromStart && position < 2500 ? 0 : position / 1000;
      if (next.playing) void element.play().catch(fail);
      else element.pause();
    };
    if (active && element.error) fail();
    else if (element.readyState >= 1 || !active) sync();
    element.addEventListener('loadedmetadata', sync);
    element.addEventListener('error', fail);
    return () => { cancelled = true; element.pause(); element.removeEventListener('loadedmetadata', sync); element.removeEventListener('error', fail); };
  }, [active, video?.sequence]);
  return <div class={`kids-intro-stage${active ? ' is-active' : ''}`} hidden={!active} aria-hidden={!active}>
    <video ref={player} class="kids-intro-film" src={KIDS_INTRO_URL} preload="auto" playsInline controls={false} disablePictureInPicture
      aria-label="BibleBluff Kids – So spielt ihr mit" onEnded={() => { if (current.current.game?.introVideo) current.current.act('stop-intro'); }}/>
  </div>;
}
