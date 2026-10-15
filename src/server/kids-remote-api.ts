import { updateKidsGame, type KidsGame, type KidsPhase, type KidsResult } from '../shared/kids-game';
import { KIDS_SCENE_MS } from '../shared/kids-scenes';
import { KIDS_SHOW_QUESTIONS } from '../shared/kids-show-questions';
import { packKidsGame, type KidsRemoteAction, type KidsRemoteView } from '../shared/kids-remote';
import { GameError } from './state';
import type { KidsRemoteRecord, KidsRemoteStore } from './kids-remote-store';

export const KIDS_REMOTE_TTL = 6 * 60 * 60 * 1000;
const PHASES: KidsPhase[] = ['welcome', 'chapter', 'superbluff', 'reading', 'scene', 'moving', 'paused', 'locked', 'returning', 'judging', 'revealed', 'finished'];
const ACTIONS: KidsRemoteAction[] = ['start', 'pause', 'resume', 'return', 'ready', 'correct', 'participated', 'none', 'next', 'scene', 'end-scene', 'finish', 'speak', 'stop-speech'];
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const token = (bytes = 24) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), (b) => b.toString(16).padStart(2, '0')).join(''); }
function sameHash(a: string, b: string) { let diff = a.length ^ b.length; for (let i = 0; i < 64; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return diff === 0; }
function badRequest(): never { throw new GameError('bad_kids_remote', 'Die Fernbedienungs-Anfrage ist ungültig.', 400); }

async function body(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  let length = 0;
  const chunks: Uint8Array[] = [];
  if (reader) for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); throw new GameError('too_large', 'Anfrage zu groß.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  try { const value: unknown = JSON.parse(new TextDecoder().decode(bytes)); if (!value || typeof value !== 'object' || Array.isArray(value)) badRequest(); return value as Record<string, unknown>; } catch { return badRequest(); }
}

function unpack(value: unknown, now: number): KidsGame {
  if (!value || typeof value !== 'object') return badRequest();
  const game = value as Record<string, unknown>;
  if (!Array.isArray(game.rounds) || game.rounds.length !== 10 || !Number.isInteger(game.index) || Number(game.index) < 0 || Number(game.index) >= game.rounds.length || !PHASES.includes(game.phase as KidsPhase) || typeof game.remainingMs !== 'number' || !Number.isFinite(game.remainingMs) || game.remainingMs < 0 || game.remainingMs > 30000) return badRequest();
  const used = new Set<string>();
  const rounds = game.rounds.map((raw: unknown, index: number) => {
    if (!raw || typeof raw !== 'object') return badRequest();
    const r = raw as Record<string, unknown>;
    const question = KIDS_SHOW_QUESTIONS[index];
    if (r.id !== question.sourceId || used.has(question.sourceId) || !Array.isArray(r.answers) || r.answers.length !== 3 || new Set(r.answers).size !== 3 || ![question.answer, ...question.distractors].every((a) => r.answers instanceof Array && r.answers.includes(a))) return badRequest();
    used.add(question.sourceId);
    return { question, answers: r.answers as string[], correctIndex: r.answers.indexOf(question.answer) };
  });
  let phase = game.phase as KidsPhase;
  const index = Number(game.index);
  if (!Array.isArray(game.results) || game.results.length !== 10 || !game.results.every((r,i)=>{
    const scored=['correct','participated','none'].includes(r);
    if (i < index) return scored;
    if (i > index) return r === null;
    return phase === 'finished' ? r === null || scored : phase === 'revealed' ? scored : r === null;
  })) return badRequest();
  if ((phase === 'welcome' && index !== 0) || (phase === 'chapter' && (index === 9 || index % 3 !== 0)) || (phase === 'superbluff' && index !== 9)) return badRequest();
  if (!Number.isSafeInteger(game.cueSeq) || Number(game.cueSeq) < 0 || Number(game.cueSeq) > 1000) return badRequest();
  const voiceSeq = game.voiceSeq ?? 0, voicePlaying = game.voicePlaying ?? false;
  if (!Number.isSafeInteger(voiceSeq) || Number(voiceSeq) < 0 || Number(voiceSeq) > 1000000 || typeof voicePlaying !== 'boolean') return badRequest();
  let sceneRemainingMs=0;
  if (phase === 'scene') {
    if (!rounds[index].question.scene || typeof game.sceneRemainingMs !== 'number' || !Number.isFinite(game.sceneRemainingMs) || game.sceneRemainingMs < 0 || game.sceneRemainingMs > KIDS_SCENE_MS) return badRequest();
    sceneRemainingMs=game.sceneRemainingMs;
    if (sceneRemainingMs === 0) phase='reading';
  }
  if (game.remainingMs === 0 && (phase === 'moving' || phase === 'paused')) phase = 'locked';
  const remainingMs = ['welcome', 'chapter', 'superbluff', 'reading', 'scene'].includes(phase) ? 30000 : ['locked', 'returning', 'judging', 'revealed', 'finished'].includes(phase) ? 0 : game.remainingMs;
  return { rounds, index, phase, remainingMs, deadline: phase === 'scene' ? now + sceneRemainingMs : phase === 'moving' ? now + remainingMs : null, results: game.results as (KidsResult | null)[], cueSeq: Number(game.cueSeq), voiceSeq: Number(voiceSeq), voicePlaying };
}

export function createKidsRemoteApi(store: KidsRemoteStore, now: () => number) {
  const view = (rec: KidsRemoteRecord, at: number): KidsRemoteView => ({ id: rec.id, version: rec.version, easy: rec.easy, expiresAt: rec.expiresAt, serverNow: at, game: unpack(packKidsGame(updateKidsGame(rec.game, 'tick', at), at), at) });
  return async (request: Request, parts: string[]): Promise<Response> => {
    if (parts.length === 2 && request.method === 'POST') {
      const data = await body(request); const at = now();
      if (typeof data.easy !== 'boolean') return badRequest();
      const game = unpack(data.game, at);
      const ownerToken = token(); const remoteToken = token();
      const ownerHash = await hash(ownerToken); const remoteHash = await hash(remoteToken);
      await store.cleanup(at);
      for (let i = 0; i < 3; i++) {
        const rec: KidsRemoteRecord = { id: token(16), game, easy: data.easy, version: 1, ownerHash, remoteHash, expiresAt: at + KIDS_REMOTE_TTL };
        if (await store.insert(rec)) return response({ ...view(rec, at), ownerToken, remoteToken }, 201);
      }
      throw new GameError('busy', 'Bitte versuche es noch einmal.', 503);
    }
    const id = parts[2];
    if (!id || !/^[a-f0-9]{32}$/.test(id) || parts.length > 4) throw new GameError('not_found', 'Diese Fernbedienung gibt es nicht mehr.', 404);
    const key = /^Bearer ([a-f0-9]{48})$/.exec(request.headers.get('authorization') ?? '')?.[1];
    if (!key) throw new GameError('remote_denied', 'Bitte scanne den QR-Code der Spielleitung erneut.', 401);
    const rec = await store.load(id); const at = now();
    if (!rec || rec.expiresAt <= at) throw new GameError('remote_expired', 'Die Verbindung wurde beendet oder ist abgelaufen.', 410);
    const digest = await hash(key); const owner = sameHash(digest, rec.ownerHash);
    if (!owner && !sameHash(digest, rec.remoteHash)) throw new GameError('remote_denied', 'Dieser Fernbedienungs-Link passt nicht.', 403);
    if (parts.length === 3 && request.method === 'GET') return response(view(rec, at));
    if (parts.length === 3 && request.method === 'DELETE') {
      if (!owner) throw new GameError('remote_denied', 'Die Verbindung kann nur am Beamer beendet werden.', 403);
      await store.delete(id); return response({ ok: true });
    }
    if (parts.length === 4 && parts[3] === 'action' && request.method === 'POST') {
      const data = await body(request);
      const actionNow = now();
      if (!ACTIONS.includes(data.action as KidsRemoteAction) || !Number.isInteger(data.version)) return badRequest();
      if (data.version !== rec.version) throw new GameError('remote_conflict', 'Der Spielstand hat sich geändert. Bitte noch einmal tippen.', 409);
      const current = updateKidsGame(rec.game, 'tick', actionNow);
      const next = updateKidsGame(current, data.action as KidsRemoteAction, actionNow);
      if (next === current) throw new GameError('remote_phase', 'Dieser Schritt ist jetzt noch nicht möglich.', 409);
      if (!await store.update(id, rec.version, next, rec.easy)) throw new GameError('remote_conflict', 'Der Spielstand hat sich geändert. Bitte noch einmal tippen.', 409);
      return response(view({ ...rec, game: next, version: rec.version + 1 }, actionNow));
    }
    throw new GameError('not_found', 'Nicht gefunden.', 404);
  };
}
