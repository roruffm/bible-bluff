import { KidsGroupName } from './KidsGroupName';
import { kidsRoundReaction } from '../lib/kids-reactions';
import { AnswerMotifArt } from './KidsAnswerArt';
import type { ProfessorMotion } from '../lib/professor-motion';
import type { RefObject } from 'preact';
import { kidsActionLabel, kidsCanScore, kidsGroupResults, kidsOvertook, kidsPrimaryAction, kidsResultPoints, kidsScores, type KidsAction, type KidsGame } from '../../shared/kids-game';
import { KIDS_GROUPS, type KidsGroup, type StoryMotif } from '../../shared/kids-show-questions';

export type ProfessorMood = 'confident' | 'nervous' | 'panic' | 'defeated' | 'victory' | 'startled' | 'kind';
export function professorMood(game: KidsGame): ProfessorMood {
  const s = kidsScores(game);
  if (game.phase === 'revealed') return kidsRoundReaction(game).mood;
  if (game.phase === 'finished') return 'kind';
  if (game.phase === 'superbluff') return 'panic';
  if (s.team >= s.professor && s.playedRounds > 3) return 'panic';
  return s.team >= s.professor && s.playedRounds > 0 ? 'nervous' : 'confident';
}
/** In diesen Phasen steht Professor Bluffs Behauptung zur laufenden Aufgabe am Beamer. */
export function kidsClaimPhase(phase: KidsGame['phase']): boolean { return ['reading','moving','paused','locked'].includes(phase); }
export function professorSays(game: KidsGame): string {
  if (game.phase === 'welcome') return 'Ha! Drei Detektivteams gegen MEIN Superhirn? Das wird ja heiter!';
  if (game.phase === 'superbluff') return 'ALARM! Mein Superbluff! Zehn Punkte für mich … aber ihr könnt sie auch holen!';
  if (game.phase === 'finished') return kidsScores(game).team > kidsScores(game).professor ? 'Ihr habt meinen Bluff geknackt! Hut ab, ihr großartigen Detektive. Es war wunderbar mit euch!' : 'Meine Punkte kann ich zählen. Euer Zusammenhalt ist unbezahlbar! Danke, ihr großartigen Detektive!';
  if (game.phase === 'revealed') return kidsRoundReaction(game).quote;
  if (kidsClaimPhase(game.phase)) return `„${game.rounds[game.index].question.bluff.claim}“`;
  if (game.index >= 6) return 'Nur noch ein Kapitel! Meine Knie zittern? Das ist mein Denk-Tanz!';
  if (game.index >= 3) return 'Das war nur die Aufwärmrunde. Jetzt wird geblufft!';
  return 'Ich bin Professor Bluff. Mein Spezialgebiet? Mich selbst überschätzen!';
}
export function ProfessorBluff({ mood = 'confident', motion }: { mood?: ProfessorMood; motion?: ProfessorMotion }) {
  return <svg class={`bluff-professor mood-${mood}${motion ? ` professor-showcase motion-${motion}` : ''}`} data-motion={motion} viewBox={motion ? '-28 -38 296 326' : '0 0 240 280'} role="img" aria-label={`Professor Bluff${mood === 'startled' ? ' erschrickt über eure Punkte' : mood === 'kind' ? ' macht euch Mut' : mood === 'panic' ? ' ist aufgeregt' : mood === 'defeated' ? ' staunt über das Kinderteam' : ''}`}>
    <svg class="bluff-canvas" x="0" y="0" width="240" height="280" viewBox="0 0 240 280" overflow="visible">
    <ellipse class="bluff-shadow" cx="120" cy="267" rx="78" ry="9" fill="#12324a20" />
    <g class="bluff-performer"><g class="bluff-body"><path d="M67 180Q120 153 173 180l21 65-65 15-84-15z" fill="#6b57aa" stroke="#12324a" stroke-width="5"/>
    <path d="m99 172 21 45 20-45-20 8z" fill="#fff8e5"/><path d="m120 190-17-10v22l17-7 18 7v-22z" fill="#ffbd4b" stroke="#12324a" stroke-width="3"/>
    <g class="bluff-arm bluff-arm-left"><path d="m72 193-34 27-16-15" fill="none" stroke="#12324a" stroke-width="18" stroke-linecap="round"/><path d="m72 193-34 27-16-15" fill="none" stroke="#8c79c2" stroke-width="11" stroke-linecap="round"/><circle cx="20" cy="203" r="12" fill="#efb98e" stroke="#12324a" stroke-width="4"/></g>
    <g class="bluff-arm bluff-arm-right"><path d="m169 195 30 24 20-20" fill="none" stroke="#12324a" stroke-width="18" stroke-linecap="round"/><path d="m169 195 30 24 20-20" fill="none" stroke="#8c79c2" stroke-width="11" stroke-linecap="round"/><circle cx="220" cy="196" r="12" fill="#efb98e" stroke="#12324a" stroke-width="4"/></g>
    <path class="bluff-legs" d="m86 249-7 15m70-15 8 15" stroke="#12324a" stroke-width="14" stroke-linecap="round"/></g>
    <BluffHead mood={mood}/>
    </g>
    </svg>
  </svg>;
}
function BluffHead({ mood }: { mood: ProfessorMood }) {
  return <g class="bluff-head"><path d="M62 99 44 75l24 2-9-31 31 15 9-32 22 24 30-24 6 30 30-10-8 29 22 12-23 24z" fill="#fff0ad" stroke="#12324a" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="120" cy="113" rx="61" ry="65" fill="#f6c89e" stroke="#12324a" stroke-width="5"/><circle cx="59" cy="119" r="11" fill="#efb98e" stroke="#12324a" stroke-width="4"/><circle cx="181" cy="119" r="11" fill="#efb98e" stroke="#12324a" stroke-width="4"/>
    <path class="bluff-brows" d={mood==='kind' ? 'M76 78q13-8 26-3m36 0q13-5 25 3' : 'm76 79 26-7m36 0 25 7'} stroke="#12324a" stroke-width="7" stroke-linecap="round"/>
    <g class="bluff-glasses" fill="#fff" fill-opacity=".72" stroke="#12324a" stroke-width="5"><circle cx="90" cy="104" r="25"/><circle cx="150" cy="104" r="25"/><path d="M115 102h10"/></g>
    <g class="bluff-eyes" fill="#12324a">{mood==='kind' ? <path d="M86 106q8-10 16 0m36 0q8-10 16 0" fill="none" stroke="#12324a" stroke-width="4" stroke-linecap="round"/> : <><ellipse cx="94" cy="105" rx={mood==='startled' ? 4 : 5} ry={mood==='startled' ? 11 : 8}/><ellipse cx="146" cy="105" rx={mood==='startled' ? 4 : 5} ry={mood==='startled' ? 11 : 8}/></>}</g>
    <path d="m119 110-8 24 16 1" fill="#efb98e" stroke="#12324a" stroke-width="3" stroke-linecap="round"/>
    <path class="bluff-moustache" d="M120 140q-23-18-40 8 20 11 40-1 20 12 40 1-18-26-40-8" fill="#fff0ad" stroke="#12324a" stroke-width="3"/>
    {mood==='startled' ? <ellipse class="bluff-mouth" cx="120" cy="159" rx="8" ry="11" fill="#fff" stroke="#12324a" stroke-width="3"/> : <path class="bluff-mouth" d="M105 157q15 15 30 0" fill="#fff" stroke="#12324a" stroke-width="3" stroke-linecap="round"/>}
    {mood === 'panic' && <path d="M191 74q19 26 3 30-18-3-3-30" fill="#6acbd1" stroke="#12324a" stroke-width="3"/>}</g>;
}
export function ProfessorHead({ mood = 'confident' }: { mood?: ProfessorMood }) {
  return <svg class={`bluff-professor-head mood-${mood}`} viewBox="35 22 175 166" role="img" aria-label="Professor Bluffs Kopf"><BluffHead mood={mood}/></svg>;
}
export function StoryPicture({ motif, animated = false }: { motif: StoryMotif; animated?: boolean }) {
  return <svg class={`kids-story-picture${animated ? ' is-animated' : ''}`} viewBox="0 0 220 140" aria-hidden="true" data-motif={motif}>
    <ellipse cx="110" cy="128" rx="91" ry="8" fill="#12324a15"/>
    <g stroke="#12324a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <AnswerMotifArt motif={motif}/>
      {(motif === 'ark' || motif === 'boat') && <g class="story-bob"><path d="M26 87h168l-27 36H58z" fill="#c8884b"/><path d="M42 101h134M62 114h103" fill="none" stroke="#986238"/>{motif === 'ark' ? <><path d="M60 86V42h101v44" fill="#ffd978"/><path d="m48 43 62-28 63 28z" fill="#d76b60"/><path d="M86 86V62h43v24" fill="#fff7da"/><path d="M64 56h12m70 0h12"/><circle cx="94" cy="70" r="7" fill="#f0c78c"/><circle cx="121" cy="70" r="7" fill="#b6d7ac"/><path d="m120 63 1-16 7 3" fill="none"/></> : <><path d="M110 85V19l49 57h-49" fill="#fffdf1"/><path d="M63 81q20-19 42 0" fill="#9c8cc8"/><rect x="54" y="76" width="24" height="12" rx="6" fill="#fff"/></>}<path class="story-waves" d="M10 126q17-12 34 0t34 0 34 0 34 0 34 0 34 0" fill="none" stroke="#328eae"/></g>}
      {motif === 'manger' && <><path d="m52 78 18 38h83l16-38z" fill="#bd874f"/><path d="m69 113-12 17m95-17 12 17"/><path d="m58 76 15-13 17 12 15-15 17 16 17-15 23 16" fill="#ffdc74"/><ellipse cx="116" cy="76" rx="34" ry="18" fill="#f8f1d5"/><circle cx="87" cy="72" r="14" fill="#efb98e"/><path d="m82 71 3 2m7-3 2 2"/><path d="m110 8 5 12 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1z" fill="#ffd362" stroke="#b08121"/></>}
      {motif === 'lion' && <><path d="M48 114q27-42 62 0m15 0q25-42 55 0" fill="#e8b65a"/><circle cx="75" cy="74" r="42" fill="#bc7843"/><circle cx="75" cy="78" r="28" fill="#ffd67c"/><circle cx="152" cy="74" r="42" fill="#bc7843"/><circle cx="152" cy="78" r="28" fill="#ffd67c"/>{[75,152].map(x=><g key={x}><path d={`m${x-14} 73q5-7 10 0m9 0q5-7 10 0`} fill="none"/><path d={`m${x-5} 85h10l-5 6z`} fill="#12324a"/><path d={`M${x} 91v6m-11-1q11 10 22 0`} fill="none"/></g>)}</>}
      {(motif === 'fish' || motif === 'coin') && <><path class="story-bob" d="M45 75q50-65 112 0-62 66-112 0L20 48v54z" fill="#73cfce"/><circle cx="139" cy="69" r="5" fill="#12324a"/><path d="m91 42 20-23 10 23M70 79l19-9-4 19" fill="#54aaa9"/>{motif === 'coin' && <g><circle cx="168" cy="92" r="27" fill="#ffd362"/><circle cx="168" cy="92" r="19" fill="none" stroke="#b18426"/><path d="M168 80v24m-6-22 6-3" stroke="#b18426"/></g>}</>}
      {motif === 'leaf' && <><path d="m63 119 87-89" fill="none" stroke="#418d60" stroke-width="7"/>{[[78,99,-45],[98,79,-45],[119,58,-45],[94,107,45],[115,86,45],[137,65,45]].map(([x,y,a],i)=><ellipse key={i} cx={x} cy={y} rx="13" ry="25" transform={`rotate(${a} ${x} ${y})`} fill={i%2 ? '#8fcd7c' : '#5caf79'}/>)}</>}
      {motif === 'bread' && <><path d="M42 109V77q0-36 46-36t46 36v32z" fill="#df9e50"/><path d="m62 60 12 22m11-27 12 23m13-17 10 19" stroke="#fff0ad" stroke-width="6"/></>}
      {motif === 'tree' && <><path d="M99 78h26v51H99z" fill="#bd874f"/><path d="M72 91q-45-20-15-53 4-35 40-27 30-21 47 9 44-1 39 37 14 33-25 39z" fill="#8fcd7c"/><path d="m111 103 25-26m-26 11-27-18" fill="none"/></>}
      {motif === 'donkey' && <><path d="m76 55-5-43q7-17 17 0l9 42m28 0 10-42q12-16 16 3l-7 44" fill="#aaa8b6"/><path d="M65 72q0-36 43-36t47 36v30q-44 38-90 0z" fill="#aaa8b6"/><ellipse cx="110" cy="99" rx="46" ry="26" fill="#e4d5c3"/><circle cx="89" cy="72" r="4" fill="#12324a"/><circle cx="131" cy="72" r="4" fill="#12324a"/><path d="m98 102 1 2m23-2-1 2m-18 10q8 5 16 0" fill="none"/></>}
      {motif === 'twins' && <>{[76,146].map(x=><g key={x}><path d={`M${x-27} 125v-30q27-29 54 0v30`} fill="#81cfbd"/><circle cx={x} cy="60" r="26" fill="#efb98e"/><path d={`M${x-26} 58q-5-40 26-32 31-8 26 32l-16-15-10 7-10-7z`} fill="#8e654b"/><path d={`m${x-10} 63 1 1m18-1 1 1m-17 11q7 8 14 0`} fill="none"/></g>)}</>}
      {motif === 'crown' && <><path d="m40 43 33 29 37-48 37 48 33-29-14 69H54z" fill="#ffd362"/><path d="M53 96h114"/><circle cx="110" cy="82" r="9" fill="#e88b9d"/></>}
    </g>
  </svg>;
}
/** Jede Gruppe lädt ihr Symbol auf: drei Leuchtpunkte (voll = 10, halb = 5) und ein wachsendes Leuchten. Kein Kind muss Zahlen lesen. */
function GroupCharge({ game, group, points, hiddenIndex, charging }: { game: KidsGame; group: Exclude<KidsGroup,'all'>; points: number; hiddenIndex: number; charging: boolean }) {
  const results = kidsGroupResults(game, group, hiddenIndex), max = results.length * 10;
  return <span class={`kids-group-charge charge-${group}${charging ? ' is-charging' : ''}`} style={{ '--charge': points / max }}>
    <KidsGroupName group={group}/>
    <span class="kids-charge-pips" role="img" aria-label={`${KIDS_GROUPS[group].name}: ${points} von ${max} Punkten`}>{results.map((result, i) => <i key={i} class={result === 'correct' ? 'is-full' : result === 'participated' ? 'is-half' : undefined}/>)}</span>
  </span>;
}
/** hiddenIndex hält eine Wertung zurück, solange der Trommelwirbel läuft. */
export function ShowScoreboard({ game, hiddenIndex = -1 }: { game: KidsGame; hiddenIndex?: number }) {
  const s = kidsScores(game, hiddenIndex);
  const shown = game.phase === 'revealed' && hiddenIndex !== game.index;
  const scored = shown && kidsResultPoints(game.results[game.index]) > 0 ? game.rounds[game.index].question.group : null;
  const overtook = shown && kidsOvertook(game);
  return <section class="kids-scoreboard" aria-label="Gemeinsame Punktejagd">
    <div class="kids-team-score"><span>BIBLEBLUFF-TEAM</span><strong data-testid="team-score">{s.team}</strong><div class="kids-group-charges">{(['minis','mittis','maxis'] as const).map(g=><GroupCharge key={g} game={game} group={g} points={s.groups[g]} hiddenIndex={hiddenIndex} charging={scored === g || scored === 'all'}/>)}</div></div>
    <div class={`kids-race${overtook ? ' is-overtaking' : ''}`} aria-label={`Kinderteam ${s.team}, Professor Bluff ${s.professor}`}>
      <div class="kids-race-lane"><span style={{ left: `${s.team * .85}%` }}>♥</span>{overtook && <b class="kids-race-overtake">Überholt!</b>}</div><div class="kids-race-lane professor-lane"><span style={{ left: `${s.professor * .85}%` }}><ProfessorHead mood={hiddenIndex === game.index ? 'nervous' : professorMood(game)}/></span></div><small>{s.playedRounds} {s.playedRounds === 1 ? 'Aufgabe gewertet' : 'Aufgaben gewertet'} · Gemeinsam!</small>
    </div>
    <div class="kids-prof-score"><span>PROFESSOR BLUFF</span><strong data-testid="prof-score">{s.professor}</strong><small>+7 je Aufgabe · Finale +10</small></div>
  </section>;
}
export function ShowControls({ game, act, disabled = false, primaryRef }: { game: KidsGame; act: (action: Exclude<KidsAction, 'tick'>) => void; disabled?: boolean; primaryRef?: RefObject<HTMLButtonElement> }) {
  const action = kidsPrimaryAction(game), scoring = kidsCanScore(game);
  return <div class={`kids-controls${scoring ? ' is-judging' : ''}`}>
    {scoring ? <div class="kids-score-actions" aria-label="Mehrheitsresultat eintragen">
      <button class="kids-button kids-primary" type="button" disabled={disabled} onClick={() => act('correct')}>Mehrheit richtig · +10</button>
      <button class="kids-button" type="button" disabled={disabled} onClick={() => act('participated')}>Mindestens ein Kind richtig · +5</button>
      <button class="kids-tool" type="button" disabled={disabled} onClick={() => act('none')}>Keiner richtig · +0</button>
    </div> : game.phase === 'moving' ? <button type="button" class="kids-button" disabled={disabled} onClick={() => act('pause')}>Ⅱ Pause</button> : action && <button ref={primaryRef} type="button" class="kids-button kids-primary" disabled={disabled} onClick={() => act(action)}>{kidsActionLabel(game)}</button>}
  </div>;
}
