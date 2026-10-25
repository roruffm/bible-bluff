import type { KidsGame } from './kids-game';

/** Ausschnitte aus der von der Spielleitung bereitgestellten Aufnahme „Ready, Set, Solve“. */
export const KIDS_MUSIC_TRACKS = {
  welcome: { label: 'Begrüßung', file: '01-willkommen', start: 0, end: 15.95, loop: true },
  chapter: { label: 'Rundenstart', file: '02-rundenstart', start: 15.95, end: 31.95, loop: true },
  question: { label: 'Frage & Nachdenken', file: '03-nachdenken', start: 47.85, end: 79.75, loop: true },
  answer: { label: 'Antwortzeit', file: '04-antwortzeit', start: 79.75, end: 111.65, loop: true },
  suspense: { label: 'Wertung', file: '05-spannung', start: 111.65, end: 127.6, loop: true },
  reveal: { label: 'Auflösung', file: '06-aufloesung', start: 31.95, end: 47.85, loop: true },
  finale: { label: 'Finalrunde', file: '07-finale', start: 127.6, end: 143.55, loop: true },
  finish: { label: 'Abschluss', file: '08-abschluss', start: 143.55, end: 158.5, loop: false },
} as const;
export type KidsMusicStage = keyof typeof KIDS_MUSIC_TRACKS;
export const kidsMusicUrl = (stage: KidsMusicStage) => `/audio/kids-music/ready-set-solve-${KIDS_MUSIC_TRACKS[stage].file}.mp3`;
export const KIDS_MUSIC_STAGES = Object.keys(KIDS_MUSIC_TRACKS) as KidsMusicStage[];
export const KIDS_MUSIC_URLS = KIDS_MUSIC_STAGES.map(kidsMusicUrl);

/** Der Ablauf wählt die Musik; die Fernbedienung selbst erzeugt keinen Ton. */
export function kidsMusicStage(game: Pick<KidsGame, 'phase' | 'index' | 'introVideo'>): KidsMusicStage | null {
  if (game.introVideo || game.phase === 'paused') return null;
  if (game.phase === 'finished') return 'finish';
  if (game.phase === 'revealed') return 'reveal';
  if (game.phase === 'locked' || game.phase === 'judging') return 'suspense';
  if (game.phase === 'returning') return 'question';
  if (game.index === 9 || game.phase === 'superbluff') return 'finale';
  if (game.phase === 'welcome') return 'welcome';
  if (game.phase === 'chapter') return 'chapter';
  if (game.phase === 'moving') return 'answer';
  return 'question';
}

export interface KidsMusicSettings { enabled: boolean; volume: number }
/** Ruhiger Startpegel; die Spielleitung kann in Schritten von fünf Prozent nachregeln. */
export const KIDS_DEFAULT_MUSIC: Readonly<KidsMusicSettings> = { enabled: true, volume: 25 };
export type KidsMusicAction = 'music-on' | 'music-off' | 'music-louder' | 'music-quieter';
