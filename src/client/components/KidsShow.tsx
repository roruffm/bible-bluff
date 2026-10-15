import type { RefObject } from 'preact';
import { kidsActionLabel, kidsPrimaryAction, kidsScores, type KidsAction, type KidsGame } from '../../shared/kids-game';
import { KIDS_GROUPS, type StoryMotif } from '../../shared/kids-show-questions';

export type ProfessorMood = 'confident' | 'nervous' | 'panic' | 'defeated' | 'victory';
export function professorMood(game: KidsGame): ProfessorMood {
  const s = kidsScores(game);
  if (game.phase === 'finished') return s.team > s.professor ? 'defeated' : 'victory';
  if (game.phase === 'superbluff') return 'panic';
  if (s.team >= s.professor && s.pieces > 3) return 'panic';
  return s.team >= s.professor && s.pieces > 0 ? 'nervous' : 'confident';
}
export function professorSays(game: KidsGame): string {
  const mood = professorMood(game);
  if (game.phase === 'welcome') return 'Ha! Drei Detektivteams gegen MEIN Superhirn? Das wird ja heiter!';
  if (game.phase === 'superbluff') return 'ALARM! Mein Superbluff! Zehn Punkte für mich … aber ihr könnt sie auch holen!';
  if (game.phase === 'finished') return mood === 'defeated' ? 'Von MINIS, MITTIS und MAXIS besiegt?! Ich brauche eine neue Rätsel-Ausbildung!' : 'Ha! Knapp gewonnen! Aber euer Teamgeist? Unbesiegbar. Revanche?';
  if (game.phase === 'revealed') return mood === 'panic' ? 'Ihr holt mich ein! Wo ist mein Notfall-Schnurrbart?!' : mood === 'nervous' ? 'Huch! Ihr seid ja richtige Spürnasen. Ich muss wohl nachlesen …' : 'Mein Plan läuft! Wobei … ihr habt ganz schön viel entdeckt!';
  if (game.index >= 6) return 'Nur noch ein Kapitel! Meine Knie zittern? Das ist mein Denk-Tanz!';
  if (game.index >= 3) return 'Das war nur die Aufwärmrunde. Jetzt wird geblufft!';
  return 'Ich bin Professor Bluff. Mein Spezialgebiet? Mich selbst überschätzen!';
}
export function ProfessorBluff({ mood = 'confident' }: { mood?: ProfessorMood }) {
  return <svg class={`bluff-professor mood-${mood}`} viewBox="0 0 240 280" role="img" aria-label={`Professor Bluff${mood === 'panic' ? ' ist aufgeregt' : mood === 'defeated' ? ' staunt über das Kinderteam' : ''}`}>
    <ellipse cx="120" cy="267" rx="78" ry="9" fill="#12324a20" />
    <g class="bluff-body"><path d="M67 180Q120 153 173 180l21 65-65 15-84-15z" fill="#6b57aa" stroke="#12324a" stroke-width="5"/>
    <path d="m99 172 21 45 20-45-20 8z" fill="#fff8e5"/><path d="m120 190-17-10v22l17-7 18 7v-22z" fill="#ffbd4b" stroke="#12324a" stroke-width="3"/>
    <path d="m72 193-34 27-16-15m147-10 30 24 20-20" fill="none" stroke="#12324a" stroke-width="18" stroke-linecap="round"/><path d="m72 193-34 27-16-15m147-10 30 24 20-20" fill="none" stroke="#8c79c2" stroke-width="11" stroke-linecap="round"/>
    <circle cx="20" cy="203" r="12" fill="#efb98e" stroke="#12324a" stroke-width="4"/><circle cx="220" cy="196" r="12" fill="#efb98e" stroke="#12324a" stroke-width="4"/>
    <path d="m86 249-7 15m70-15 8 15" stroke="#12324a" stroke-width="14" stroke-linecap="round"/></g>
    <g class="bluff-head"><path d="M62 99 44 75l24 2-9-31 31 15 9-32 22 24 30-24 6 30 30-10-8 29 22 12-23 24z" fill="#fff0ad" stroke="#12324a" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="120" cy="113" rx="61" ry="65" fill="#f6c89e" stroke="#12324a" stroke-width="5"/><circle cx="59" cy="119" r="11" fill="#efb98e" stroke="#12324a" stroke-width="4"/><circle cx="181" cy="119" r="11" fill="#efb98e" stroke="#12324a" stroke-width="4"/>
    <path d="m76 79 26-7m36 0 25 7" stroke="#12324a" stroke-width="7" stroke-linecap="round"/>
    <g fill="#ffffffb8" stroke="#12324a" stroke-width="5"><circle cx="90" cy="104" r="25"/><circle cx="150" cy="104" r="25"/><path d="M115 102h10"/></g>
    <g class="bluff-eyes" fill="#12324a"><ellipse cx="94" cy="105" rx="5" ry="8"/><ellipse cx="146" cy="105" rx="5" ry="8"/></g>
    <path d="m119 110-8 24 16 1" fill="#efb98e" stroke="#12324a" stroke-width="3" stroke-linecap="round"/>
    <path d="M120 140q-23-18-40 8 20 11 40-1 20 12 40 1-18-26-40-8" fill="#fff0ad" stroke="#12324a" stroke-width="3"/>
    <path class="bluff-mouth" d="M105 157q15 15 30 0" fill="#fff" stroke="#12324a" stroke-width="3" stroke-linecap="round"/>
    {mood === 'panic' && <path d="M191 74q19 26 3 30-18-3-3-30" fill="#6acbd1" stroke="#12324a" stroke-width="3"/>}</g>
  </svg>;
}
export function StoryPicture({ motif, animated = false }: { motif: StoryMotif; animated?: boolean }) {
  return <svg class={`kids-story-picture${animated ? ' is-animated' : ''}`} viewBox="0 0 220 140" aria-hidden="true">
    <ellipse cx="110" cy="128" rx="91" ry="8" fill="#12324a15"/>
    <g stroke="#12324a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      {(motif === 'ark' || motif === 'boat') && <g class="story-bob"><path d="M26 87h168l-27 36H58z" fill="#c8884b"/><path d="M42 101h134M62 114h103" fill="none" stroke="#986238"/>{motif === 'ark' ? <><path d="M60 86V42h101v44" fill="#ffd978"/><path d="m48 43 62-28 63 28z" fill="#d76b60"/><path d="M86 86V62h43v24" fill="#fff7da"/><path d="M64 56h12m70 0h12"/><circle cx="94" cy="70" r="7" fill="#f0c78c"/><circle cx="121" cy="70" r="7" fill="#b6d7ac"/><path d="m120 63 1-16 7 3" fill="none"/></> : <><path d="M110 85V19l49 57h-49" fill="#fffdf1"/><path d="M63 81q20-19 42 0" fill="#9c8cc8"/><rect x="54" y="76" width="24" height="12" rx="6" fill="#fff"/></>}<path class="story-waves" d="M10 126q17-12 34 0t34 0 34 0 34 0 34 0 34 0" fill="none" stroke="#328eae"/></g>}
      {motif === 'manger' && <><path d="m52 78 18 38h83l16-38z" fill="#bd874f"/><path d="m69 113-12 17m95-17 12 17"/><path d="m58 76 15-13 17 12 15-15 17 16 17-15 23 16" fill="#ffdc74"/><ellipse cx="116" cy="76" rx="34" ry="18" fill="#f8f1d5"/><circle cx="87" cy="72" r="14" fill="#efb98e"/><path d="m82 71 3 2m7-3 2 2"/><path d="m110 8 5 12 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1z" fill="#ffd362" stroke="#b08121"/></>}
      {motif === 'lion' && <><path d="M48 114q27-42 62 0m15 0q25-42 55 0" fill="#e8b65a"/><circle cx="75" cy="74" r="42" fill="#bc7843"/><circle cx="75" cy="78" r="28" fill="#ffd67c"/><circle cx="152" cy="74" r="42" fill="#bc7843"/><circle cx="152" cy="78" r="28" fill="#ffd67c"/>{[75,152].map(x=><g key={x}><path d={`m${x-14} 73q5-7 10 0m9 0q5-7 10 0`} fill="none"/><path d={`m${x-5} 85h10l-5 6z`} fill="#12324a"/><path d={`M${x} 91v6m-11-1q11 10 22 0`} fill="none"/></g>)}</>}
      {(motif === 'fish' || motif === 'coin') && <><path class="story-bob" d="M45 75q50-65 112 0-62 66-112 0L20 48v54z" fill="#73cfce"/><circle cx="139" cy="69" r="5" fill="#12324a"/><path d="m91 42 20-23 10 23M70 79l19-9-4 19" fill="#54aaa9"/>{motif === 'coin' && <g><circle cx="168" cy="92" r="27" fill="#ffd362"/><circle cx="168" cy="92" r="19" fill="none" stroke="#b18426"/><path d="M168 80v24m-6-22 6-3" stroke="#b18426"/></g>}</>}
      {motif === 'leaf' && <><path d="m63 119 87-89" fill="none" stroke="#418d60" stroke-width="7"/>{[[78,99,-45],[98,79,-45],[119,58,-45],[94,107,45],[115,86,45],[137,65,45]].map(([x,y,a],i)=><ellipse key={i} cx={x} cy={y} rx="13" ry="25" transform={`rotate(${a} ${x} ${y})`} fill={i%2 ? '#8fcd7c' : '#5caf79'}/>)}</>}
      {motif === 'bread' && <><path d="M42 109V77q0-36 46-36t46 36v32z" fill="#df9e50"/><path d="m62 60 12 22m11-27 12 23m13-17 10 19" stroke="#fff0ad" stroke-width="6"/><path d="M126 102q22-36 50 0-28 36-50 0l-17-14v28z" fill="#83d1cf"/><circle cx="165" cy="99" r="3" fill="#12324a"/></>}
      {motif === 'tree' && <><path d="M99 78h26v51H99z" fill="#bd874f"/><path d="M72 91q-45-20-15-53 4-35 40-27 30-21 47 9 44-1 39 37 14 33-25 39z" fill="#8fcd7c"/><path d="m111 103 25-26m-26 11-27-18" fill="none"/></>}
      {motif === 'donkey' && <><path d="m76 55-5-43q7-17 17 0l9 42m28 0 10-42q12-16 16 3l-7 44" fill="#aaa8b6"/><path d="M65 72q0-36 43-36t47 36v30q-44 38-90 0z" fill="#aaa8b6"/><ellipse cx="110" cy="99" rx="46" ry="26" fill="#e4d5c3"/><circle cx="89" cy="72" r="4" fill="#12324a"/><circle cx="131" cy="72" r="4" fill="#12324a"/><path d="m98 102 1 2m23-2-1 2m-18 10q8 5 16 0" fill="none"/></>}
      {motif === 'twins' && <>{[76,146].map(x=><g key={x}><path d={`M${x-27} 125v-30q27-29 54 0v30`} fill="#81cfbd"/><circle cx={x} cy="60" r="26" fill="#efb98e"/><path d={`M${x-26} 58q-5-40 26-32 31-8 26 32l-16-15-10 7-10-7z`} fill="#8e654b"/><path d={`m${x-10} 63 1 1m18-1 1 1m-17 11q7 8 14 0`} fill="none"/></g>)}</>}
      {motif === 'crown' && <><path d="m40 43 33 29 37-48 37 48 33-29-14 69H54z" fill="#ffd362"/><path d="M53 96h114"/><circle cx="110" cy="82" r="9" fill="#e88b9d"/></>}
    </g>
  </svg>;
}
export function Treasure({ pieces, open = false }: { pieces: number; open?: boolean }) {
  return <div class={`kids-treasure${open ? ' is-open' : ''}`} aria-label={`${pieces} von 9 Schatzteilen entdeckt`}>
    <svg viewBox="0 0 300 180" aria-hidden="true"><rect width="300" height="180" fill="#d6eee5"/><circle cx="245" cy="32" r="39" fill="#ffdc74"/><path d="M-10 180Q50 35 150 110 235 50 310 160v30z" fill="#93ceb5"/><path d="M23 104q127-160 254 0" fill="none" stroke="#e7a3ad" stroke-width="17"/><path d="M23 118q127-160 254 0" fill="none" stroke="#ffd362" stroke-width="12"/><path d="M104 95h92v60h-92z" fill="#bb814f" stroke="#12324a" stroke-width="4"/><path d="M104 95q46-55 92 0z" fill="#e7b562" stroke="#12324a" stroke-width="4"/><path d="M147 88h9v68h-9z" fill="#ffd362"/><path d="M150 72C111 47 130 23 150 40c20-17 39 7 0 32" fill="#d55d78"/><circle cx="66" cy="133" r="13" fill="#f0ba8f"/><path d="m48 175 8-25h21l10 25" fill="#6e98cb"/><circle cx="235" cy="133" r="13" fill="#bf815c"/><path d="m215 175 10-25h21l10 25" fill="#b39aca"/></svg>
    <div class="kids-treasure-tiles" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} class={i < pieces ? 'is-found' : ''}>{i < pieces ? '' : '✦'}</span>)}</div>
  </div>;
}
export function ShowScoreboard({ game }: { game: KidsGame }) {
  const s = kidsScores(game); const suspense = game.index === 9 && game.phase !== 'finished';
  return <section class="kids-scoreboard" aria-label="Gemeinsame Punktejagd">
    <div class="kids-team-score"><span>BIBLEBLUFF-TEAM</span><strong data-testid="team-score">{suspense ? '?' : s.team}</strong><div>{(['minis','mittis','maxis'] as const).map(g=><span key={g}>{KIDS_GROUPS[g].name} <b>{s.groups[g]}</b><small>/30</small></span>)}</div></div>
    <div class="kids-race" aria-label={suspense ? 'Superbluff läuft. Endstand gleich!' : `Kinderteam ${s.team}, Professor Bluff ${s.professor}`}>
      <div class="kids-race-lane"><span style={{ left: `${(suspense ? s.team - s.bonus : s.team) * .85}%` }}>♥</span></div><div class="kids-race-lane professor-lane"><span style={{ left: `${s.professor * .85}%` }}>B</span></div><span class="kids-race-chest" aria-hidden="true">✦</span><small>{suspense ? 'Endstand nach dem Superbluff' : `${s.pieces} / 9 Schatzteile · Gemeinsam!`}</small>
    </div>
    <div class="kids-prof-score"><span>PROFESSOR BLUFF</span><strong data-testid="prof-score">{suspense ? '?' : s.professor}</strong><small>{suspense ? '+10 Finalangriff' : '+7 pro Runde'}</small></div>
  </section>;
}
export function ShowControls({ game, act, disabled = false, primaryRef }: { game: KidsGame; act: (action: Exclude<KidsAction, 'tick'>) => void; disabled?: boolean; primaryRef?: RefObject<HTMLButtonElement> }) {
  const action = kidsPrimaryAction(game.phase);
  return <div class={`kids-controls${game.phase === 'judging' ? ' is-judging' : ''}`}>
    {game.phase === 'judging' ? <div class="kids-score-actions" aria-label="Mehrheitsresultat eintragen">
      <button class="kids-button kids-primary" type="button" disabled={disabled} onClick={() => act('correct')}>{game.index === 9 ? 'Gemeinsam gelöst · +10' : 'Mehrheit richtig · +10'}</button>
      {game.index !== 9 && <button class="kids-button" type="button" disabled={disabled} onClick={() => act('participated')}>Mitgemacht · +5</button>}
      <button class="kids-tool" type="button" disabled={disabled} onClick={() => act('none')}>{game.index === 9 ? 'Diesmal nicht gelöst · +0' : 'Keine Teilnahme · +0'}</button>
    </div> : game.phase === 'moving' ? <button type="button" class="kids-button" disabled={disabled} onClick={() => act('pause')}>Ⅱ Pause</button> : action && <button ref={primaryRef} type="button" class="kids-button kids-primary" disabled={disabled} onClick={() => act(action)}>{kidsActionLabel(game)}</button>}
  </div>;
}
