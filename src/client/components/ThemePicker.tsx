import { type ThemeInfo, THEMES, themeInfo, useTheme } from '../lib/theme';

function Swatch({ theme, mini = false }: { theme: ThemeInfo; mini?: boolean }) {
  const [bar, paper, a, b] = theme.preview;
  return (
    <span
      class={`theme-swatch${mini ? ' is-mini' : ''}`}
      style={{ '--sw-bar': bar, '--sw-paper': paper, '--sw-a': a, '--sw-b': b }}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
    </span>
  );
}

/** Auswahl des Farbkonzepts – jede Kachel zeigt eine Mini-Vorschau aus Leiste, Papier und Akzenten. */
export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useTheme();
  return (
    <div class={`theme-picker${compact ? ' is-compact' : ''}`} role="radiogroup" aria-label="Farbkonzept">
      {THEMES.map((t) => (
        <button
          type="button"
          role="radio"
          aria-checked={t.id === theme}
          class={`theme-option${t.id === theme ? ' is-on' : ''}`}
          onClick={() => setTheme(t.id)}
          data-theme-id={t.id}
        >
          <Swatch theme={t} />
          <span class="theme-name">{t.name}</span>
        </button>
      ))}
    </div>
  );
}

/** Startseite: die Farbauswahl zugeklappt, in der Zeile steht das gewählte Farbkonzept */
export function ThemeFold() {
  const [theme] = useTheme();
  const info = themeInfo(theme);
  return (
    <details class="fold colors">
      <summary>
        <span class="fold-title">Farben</span>
        <span class="fold-hint">
          <Swatch theme={info} mini />
          {info.name}
        </span>
      </summary>
      <div class="fold-body">
        <ThemePicker compact />
        <p class="muted small">Gilt nur auf diesem Gerät. Jede Person wählt ihre Farben selbst.</p>
      </div>
    </details>
  );
}
