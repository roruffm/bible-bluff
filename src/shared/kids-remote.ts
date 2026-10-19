import { KIDS_ANSWER_MS, type KidsGame, type KidsAction, type KidsPhase, type KidsResult } from './kids-game';
import { KIDS_SCENE_MS } from './kids-scenes';
import { KIDS_SHOW_QUESTIONS } from './kids-show-questions';
import { professorInterjection } from './professor-interjections';

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
    voiceKind: game.voiceKind ?? 'quote',
    voiceClip: game.voiceClip ?? null,
    sceneRemainingMs: game.phase === 'scene' ? Math.min(KIDS_SCENE_MS, Math.max(0, (game.deadline ?? now) - now)) : undefined,
  };
}

const PHASES: KidsPhase[] = ['welcome', 'chapter', 'superbluff', 'reading', 'scene', 'moving', 'paused', 'locked', 'returning', 'judging', 'revealed', 'finished'];
class InvalidKidsGame extends Error {}
function invalid(): never { throw new InvalidKidsGame(); }

/** Gegenstück zu packKidsGame für Server und gesicherten Spielstand: Texte kommen aus dem Pool, ungültige Stände ergeben null. */
export function unpackKidsGame(value: unknown, now: number): KidsGame | null {
  try { return unpack(value, now); } catch (error) { if (error instanceof InvalidKidsGame) return null; throw error; }
}
function unpack(value: unknown, now: number): KidsGame {
  if (!value || typeof value !== 'object') return invalid();
  const game = value as Record<string, unknown>;
  if (!Array.isArray(game.rounds) || game.rounds.length !== 10 || !Number.isInteger(game.index) || Number(game.index) < 0 || Number(game.index) >= game.rounds.length || !PHASES.includes(game.phase as KidsPhase) || typeof game.remainingMs !== 'number' || !Number.isFinite(game.remainingMs) || game.remainingMs < 0 || game.remainingMs > KIDS_ANSWER_MS) return invalid();
  const used = new Set<string>();
  const rounds = game.rounds.map((raw: unknown, index: number) => {
    if (!raw || typeof raw !== 'object') return invalid();
    const r = raw as Record<string, unknown>;
    const question = KIDS_SHOW_QUESTIONS[index];
    if (r.id !== question.sourceId || used.has(question.sourceId) || !Array.isArray(r.answers) || r.answers.length !== 3 || new Set(r.answers).size !== 3 || ![question.answer, ...question.distractors].every((a) => r.answers instanceof Array && r.answers.includes(a))) return invalid();
    used.add(question.sourceId);
    return { question, answers: r.answers as string[], correctIndex: r.answers.indexOf(question.answer) };
  });
  let phase = game.phase as KidsPhase;
  const index = Number(game.index);
  if (!Array.isArray(game.results) || game.results.length !== 10) return invalid();
  // Nur vor dem Finale darf auf einen gewerteten Anfang eine ungespielte Folge kommen.
  const skippedFrom = index === 9 ? game.results.slice(0, 9).indexOf(null) : -1;
  if (!game.results.every((r,i)=>{
    const scored=['correct','participated','none'].includes(r);
    if (i < index) return skippedFrom >= 0 && i >= skippedFrom ? r === null : scored;
    if (i > index) return r === null;
    return phase === 'finished' ? r === null || scored : phase === 'revealed' ? scored : r === null;
  })) return invalid();
  if ((phase === 'welcome' && index !== 0) || (phase === 'chapter' && (index === 9 || index % 3 !== 0)) || (phase === 'superbluff' && index !== 9)) return invalid();
  if (!Number.isSafeInteger(game.cueSeq) || Number(game.cueSeq) < 0 || Number(game.cueSeq) > 1000) return invalid();
  const voiceSeq = game.voiceSeq ?? 0, voicePlaying = game.voicePlaying ?? false, voiceCue = game.voiceCue ?? null, voiceKind = game.voiceKind ?? 'quote';
  const voiceClip = game.voiceClip ?? null;
  if (!Number.isSafeInteger(voiceSeq) || Number(voiceSeq) < 0 || Number(voiceSeq) > 1000000 || typeof voicePlaying !== 'boolean' || !['quote','question','answers','interjection'].includes(voiceKind as string)) return invalid();
  if ((voiceClip !== null && !professorInterjection(voiceClip)) || (voiceKind === 'interjection' && !professorInterjection(voiceClip))) return invalid();
  if (voiceCue !== null && (typeof voiceCue !== 'string' || !/^[a-z]+:[0-9]$/.test(voiceCue) || !PHASES.includes(voiceCue.split(':')[0] as KidsPhase))) return invalid();
  let sceneRemainingMs=0;
  if (phase === 'scene') {
    if (!rounds[index].question.scene || typeof game.sceneRemainingMs !== 'number' || !Number.isFinite(game.sceneRemainingMs) || game.sceneRemainingMs < 0 || game.sceneRemainingMs > KIDS_SCENE_MS) return invalid();
    sceneRemainingMs=game.sceneRemainingMs;
    if (sceneRemainingMs === 0) phase='reading';
  }
  if (game.remainingMs === 0 && (phase === 'moving' || phase === 'paused')) phase = 'locked';
  const remainingMs = ['welcome', 'chapter', 'superbluff', 'reading', 'scene'].includes(phase) ? KIDS_ANSWER_MS : ['locked', 'returning', 'judging', 'revealed', 'finished'].includes(phase) ? 0 : game.remainingMs;
  return { rounds, index, phase, remainingMs, deadline: phase === 'scene' ? now + sceneRemainingMs : phase === 'moving' ? now + remainingMs : null, results: game.results as (KidsResult | null)[], cueSeq: Number(game.cueSeq), voiceSeq: Number(voiceSeq), voicePlaying, voiceCue: voiceCue as string|null, voiceKind:voiceKind as KidsGame['voiceKind'], voiceClip: voiceClip as KidsGame['voiceClip'] };
}
