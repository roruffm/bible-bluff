import { LogoArt } from './LogoArt';

/** Dieselbe Bildmarke wie das Hauptspiel, ergänzt um die bunten Spielfeldzahlen. */
export function KidsLogo({ compact = false }: { compact?: boolean }) {
  return <span class={`kids-logo${compact ? ' is-compact' : ''}`}>
    <LogoArt />
    <span class="kids-logo-tag" aria-label="Kids"><b>K</b><b>I</b><b>D</b><b>S</b><span class="kids-logo-dots" aria-hidden="true">1 2 3</span></span>
  </span>;
}
