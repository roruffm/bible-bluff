export const KIDS_MUSIC_URL = '/audio/kids-music/biblebluff-kids-background.mp3';
export interface KidsMusicSettings { enabled: boolean; volume: number }
/** Ruhiger Startpegel; die Spielleitung kann in Schritten von fünf Prozent nachregeln. */
export const KIDS_DEFAULT_MUSIC: Readonly<KidsMusicSettings> = { enabled: true, volume: 25 };
export type KidsMusicAction = 'music-on' | 'music-off' | 'music-louder' | 'music-quieter';
