// Kleine Bildzeichen für die Startseite und Josephs Gesicht.
// Linien folgen der Schriftfarbe (currentColor); Josephs Gesicht hat feste Farben, weil es auf seiner Spielerfarbe sitzt.

/** Joseph: ein kleiner Roboter mit der Maskenbrille aus dem Logo – er zwinkert wie die Bildmarke */
export function BotFace() {
  return (
    <svg class="bot-face" viewBox="0 0 48 48" aria-hidden="true">
      <g stroke="#2b211c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 13 L24 8" fill="none" />
        <path d="M24 2.5 L25.4 5.6 L28.5 7 L25.4 8.4 L24 11.5 L22.6 8.4 L19.5 7 L22.6 5.6 Z" fill="#f2d9a0" stroke-width="1.8" />
        <rect x="5" y="22" width="4" height="9" rx="2" fill="#2b211c" />
        <rect x="39" y="22" width="4" height="9" rx="2" fill="#2b211c" />
        <rect x="9" y="13" width="30" height="27" rx="9" fill="#fbf3e4" />
        <path
          d="M11 23.5 C11 18.5 18 16.5 24 20.5 C30 16.5 37 18.5 37 23.5 C37 28.5 32 30.5 28 29 C26.5 28.4 25.3 27 24 27 C22.7 27 21.5 28.4 20 29 C16 30.5 11 28.5 11 23.5 Z"
          fill="#f2d9a0"
          stroke-width="2"
        />
        <path d="M27.5 24.5 Q30.5 21.5 33.5 24.5" fill="none" stroke-width="2.2" />
        <path d="M19.5 33 Q24 36.5 28.5 33" fill="none" stroke-width="2.2" />
      </g>
      <ellipse cx="18" cy="23.8" rx="2.8" ry="2.1" fill="#2b211c" />
    </svg>
  );
}

/** Mit Code eintreten: Pfeil durch eine offene Tür */
export function EnterIcon() {
  return (
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 4 H18 A2 2 0 0 1 20 6 V18 A2 2 0 0 1 18 20 H14" />
        <path d="M3.5 12 H14" />
        <path d="M10 8 L14 12 L10 16" />
      </g>
    </svg>
  );
}

/** Mit Freunden: zwei Personen */
export function FriendsIcon() {
  return (
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20 C2.5 15.8 5.4 13.5 9 13.5 C12.6 13.5 15.5 15.8 15.5 20" />
        <path d="M15.5 4.8 A3.5 3.5 0 0 1 15.5 11.2" />
        <path d="M18 13.9 C20.2 14.6 21.5 16.7 21.5 20" />
      </g>
    </svg>
  );
}
