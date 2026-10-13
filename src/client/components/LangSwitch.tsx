// Sprachwahl oben rechts auf der Startseite: Deutsch ist voreingestellt, die britische Flagge schaltet auf
// Englisch. Die Wahl gilt auf diesem Gerät und für Räume, die man danach eröffnet.

import type { JSX } from 'preact';
import type { Lang } from '../../shared/types';
import { preferredLang, setPreferredLang } from '../lib/i18n';

function FlagDe() {
  return (
    <svg class="flag" viewBox="0 0 5 3" aria-hidden="true" preserveAspectRatio="none">
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#dd0000" />
      <rect y="2" width="5" height="1" fill="#ffce00" />
    </svg>
  );
}

/** Union Jack – die Diagonalen rot versetzt wie im Original */
function FlagUk() {
  return (
    <svg class="flag" viewBox="0 0 60 30" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <clipPath id="flag-uk-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#flag-uk-t)" stroke="#c8102e" stroke-width="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6" />
    </svg>
  );
}

const OPTIONS: { lang: Lang; name: string; flag: () => JSX.Element }[] = [
  { lang: 'de', name: 'Deutsch', flag: FlagDe },
  { lang: 'en', name: 'English', flag: FlagUk },
];

export function LangSwitch() {
  const current = preferredLang();
  return (
    <div class="lang-switch" role="radiogroup" aria-label="Sprache · Language">
      {OPTIONS.map(({ lang, name, flag: Flag }) => (
        <button
          type="button"
          role="radio"
          lang={lang}
          aria-checked={lang === current}
          aria-label={name}
          title={name}
          class={lang === current ? 'is-on' : ''}
          onClick={() => setPreferredLang(lang)}
          data-lang={lang}
        >
          <Flag />
        </button>
      ))}
    </div>
  );
}
