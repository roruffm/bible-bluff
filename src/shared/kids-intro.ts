export const KIDS_INTRO_URL = '/kids-video/so-spielt-ihr-mit-forscher.mp4';
export const KIDS_INTRO_DURATION_MS = 53_146;
export interface KidsIntroVideo {
  playing: boolean;
  positionMs: number;
  startedAt: number | null;
  sequence: number;
  fromStart: boolean;
}
export function kidsIntroPosition(video: KidsIntroVideo, now: number): number {
  return Math.min(KIDS_INTRO_DURATION_MS, Math.max(0, video.positionMs + (video.playing && video.startedAt !== null ? Math.max(0, now - video.startedAt) : 0)));
}
