import type { KidsGame, KidsAction } from './kids-game';
import { KIDS_SCENE_MS } from './kids-scenes';

export type KidsRemoteAction = Exclude<KidsAction, 'tick'>;
export interface KidsRemoteView {
  id: string;
  version: number;
  serverNow: number;
  expiresAt: number;
  easy: boolean;
  game: KidsGame;
}
export interface KidsCredentials { id: string; token: string; remoteToken?: string }
export interface KidsRemoteCreated extends KidsRemoteView { ownerToken: string; remoteToken: string }

/** Nur IDs und Antwortreihenfolge; der Server holt Texte und richtige Antworten aus seinem Pool. */
export function packKidsGame(game: KidsGame, now: number) {
  return {
    rounds: game.rounds.map((r) => ({ id: r.question.sourceId, answers: r.answers })),
    index: game.index,
    phase: game.phase,
    remainingMs: game.phase === 'moving' ? Math.max(0, (game.deadline ?? now) - now) : game.remainingMs,
    results: game.results,
    cueSeq: game.cueSeq,
    voiceSeq: game.voiceSeq ?? 0,
    voicePlaying: game.voicePlaying ?? false,
    voiceCue: game.voiceCue ?? null,
    sceneRemainingMs: game.phase === 'scene' ? Math.min(KIDS_SCENE_MS, Math.max(0, (game.deadline ?? now) - now)) : undefined,
  };
}
