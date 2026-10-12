import { t } from '../lib/i18n';
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
    <div class={`theme-picker${compact ? ' is-compact' : ''}`} role="radiogroup" aria-label={t('Farbkonzept')}>
      {THEMES.map((th) => (
        <button
          type="button"
          role="radio"
          aria-checked={th.id === theme}
          class={`theme-option${th.id === theme ? ' is-on' : ''}`}
          onClick={() => setTheme(th.id)}
          data-theme-id={th.id}
        >
          <Swatch theme={th} />
          <span class="theme-name">{t(th.name)}</span>
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
        <span class="fold-title">{t('Farben')}</span>
        <span class="fold-hint">
          <Swatch theme={info} mini />
          {t(info.name)}
        </span>
      </summary>
      <div class="fold-body">
        <ThemePicker compact />
        <p class="muted small">{t('Gilt nur auf diesem Gerät. Jede Person wählt ihre Farben selbst.')}</p>
      </div>
    </details>
  );
}
