import { THEMES, useTheme } from '../lib/theme';

/** Auswahl des Farbkonzepts – jede Kachel zeigt eine Mini-Vorschau aus Leiste, Papier und Akzenten. */
export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useTheme();
  return (
    <div class={`theme-picker${compact ? ' is-compact' : ''}`} role="radiogroup" aria-label="Farbkonzept">
      {THEMES.map((t) => {
        const [bar, paper, a, b] = t.preview;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={t.id === theme}
            class={`theme-option${t.id === theme ? ' is-on' : ''}`}
            onClick={() => setTheme(t.id)}
            data-theme-id={t.id}
          >
            <span class="theme-swatch" style={{ '--sw-bar': bar, '--sw-paper': paper, '--sw-a': a, '--sw-b': b }} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span class="theme-name">{t.name}</span>
            {!compact && <span class="theme-text">{t.text}</span>}
          </button>
        );
      })}
    </div>
  );
}
