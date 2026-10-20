/** Feste Farben und Formen der drei Spielfelder: Orange mit Kreis, Blau mit Dreieck, Lila mit Quadrat.
 * Bewusst andere Farben als die Gruppen (Mint, Gold, Rosa), damit kein Kind seine Gruppenfarbe für die richtige Antwort hält. */
export const KIDS_FIELDS = [
  { color: '#ffad5c', soft: '#ffd4a8' },
  { color: '#7fbfff', soft: '#c4e2ff' },
  { color: '#b994ff', soft: '#e2d4ff' },
] as const;

const SHAPES = [
  <circle cx="12" cy="12" r="9"/>,
  <path d="M12 2.5 22.5 20.5h-21z"/>,
  <rect x="3" y="3" width="18" height="18" rx="2.5"/>,
];

/** Formsymbol des Feldes; rein schmückend, die Nummer daneben trägt die Bedeutung. */
export function KidsFieldShape({ index }: { index: number }) {
  return <svg class="kids-field-shape" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{SHAPES[index]}</svg>;
}
