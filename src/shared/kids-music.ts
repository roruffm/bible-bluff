import type { KidsGame } from './kids-game';

/** Originalaufnahmen der Spielleitung, je eine für die fünf gewünschten Sequenzen. */
export const KIDS_MUSIC_TRACKS = {
  intro: { label: 'Erklärung', file: 'erklaervideo-2026-10-26', loop: true },
  round: { label: 'Runde & Vorlesen', file: 'rundenmusik-2026-10-26', loop: true },
  countdown: { label: 'Countdown', file: 'countdown-2026-10-26', loop: true },
  reveal: { label: 'Auflösung', file: 'aufloesung-2026-10-26', loop: true },
  outro: { label: 'Verabschiedung', file: 'outro-2026-10-26', loop: false },
} as const;
export type KidsMusicStage = keyof typeof KIDS_MUSIC_TRACKS;
export const kidsMusicUrl = (stage: KidsMusicStage) => `/audio/kids-music/${KIDS_MUSIC_TRACKS[stage].file}.mp3`;
export const KIDS_MUSIC_STAGES = Object.keys(KIDS_MUSIC_TRACKS) as KidsMusicStage[];
export const KIDS_MUSIC_URLS = KIDS_MUSIC_STAGES.map(kidsMusicUrl);

type MusicGame = Pick<KidsGame, 'phase' | 'index' | 'introVideo' | 'voicePlaying' | 'voiceKind' | 'voiceClip' | 'voiceCue' | 'voiceSeq'>;

/** Nur die Beamer-Seite spielt Musik, einschließlich Vorbereitung und Rückweg nach „Stopp“. */
export function kidsMusicStage(game: MusicGame | null): KidsMusicStage | null {
  if (!game) return 'reveal';
  if (game.introVideo) return game.introVideo.playing ? 'intro' : null;
  if (game.phase === 'paused') return null;
  if (game.phase === 'moving') return 'countdown';
  if (game.phase === 'finished') return 'outro';
  if (game.phase === 'revealed') return 'reveal';
  if (['locked', 'returning', 'judging'].includes(game.phase)) return 'intro';
  if (game.phase === 'welcome') return 'reveal';
  if (game.voicePlaying && game.voiceKind === 'interjection' && game.voiceClip === 'finale-parents'
      && game.voiceCue === `${game.phase}:${game.index}`) return 'intro';
  if (['chapter', 'superbluff', 'reading', 'scene'].includes(game.phase)) return 'round';
  return null;
}

/** Vorlesen startet die laufende Rundenmusik nicht neu; jede neue Erklärung beginnt von vorne. */
export function kidsMusicCue(game: MusicGame | null, stage: KidsMusicStage): string {
  if (!game || game.phase === 'welcome' && !game.introVideo) return `welcome:${stage}`;
  if (stage === 'intro') {
    if (game.introVideo) return `video:${game.introVideo.sequence}`;
    if (['locked', 'returning', 'judging'].includes(game.phase)) return `${game.index}:after-stop`;
    return `parents:${game.voiceSeq}`;
  }
  return `${game.index}:${stage}`;
}

export interface KidsMusicSettings { enabled: boolean; volume: number }
/** Ruhiger Startpegel; die Spielleitung kann in Schritten von fünf Prozent nachregeln. */
export const KIDS_DEFAULT_MUSIC: Readonly<KidsMusicSettings> = { enabled: true, volume: 25 };
export type KidsMusicAction = 'music-on' | 'music-off' | 'music-louder' | 'music-quieter';
