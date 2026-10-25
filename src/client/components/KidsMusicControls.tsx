import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { KIDS_DEFAULT_MUSIC } from '../../shared/kids-music';

export function KidsMusicControls({ game, act, disabled = false }: { game: KidsGame; act: (action: Exclude<KidsAction, 'tick'>) => void; disabled?: boolean }) {
  const music = game.music ?? KIDS_DEFAULT_MUSIC;
  return <section class="kids-music-controls" aria-label="Hintergrundmusik">
    <h3>Hintergrundmusik</h3>
    <button type="button" class="kids-tool" aria-pressed={music.enabled} disabled={disabled} onClick={() => act(music.enabled ? 'music-off' : 'music-on')}>{music.enabled ? '♫ Musik ausschalten' : '♫ Musik einschalten'}</button>
    <div class="kids-music-volume" role="group" aria-label="Musiklautstärke">
      <button type="button" class="kids-tool" aria-label="Hintergrundmusik leiser" disabled={disabled || music.volume <= 0} onClick={() => act('music-quieter')}>−</button>
      <output aria-live="polite" aria-label="Musiklautstärke">{music.volume} %</output>
      <button type="button" class="kids-tool" aria-label="Hintergrundmusik lauter" disabled={disabled || music.volume >= 100} onClick={() => act('music-louder')}>+</button>
    </div>
    <small>Ton am Beamer · Bei Ansagen automatisch leiser.</small>
  </section>;
}
