import { GameEngine } from '../client/gluehwein/engine.js';
import type { GlühweinStore } from './gluehwein-store';

const MAX_BYTES = 512 * 1024;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
class RequestError extends Error { constructor(message: string, public status = 400) { super(message); } }
const hash = async (token: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(x => x.toString(16).padStart(2, '0')).join('');
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new RequestError('JSON erwartet.', 415);
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) throw new RequestError('Die Runde ist zu groß.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError('Die Runde fehlt.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new RequestError('Die Runde ist zu groß.', 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const result: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('Die Runde konnte nicht gelesen werden.');
  } finally { reader.releaseLock(); }
}
export function createGlühweinApi(store: GlühweinStore, now: () => number) {
  return async (request: Request, parts: string[]) => {
    try {
      const url = new URL(request.url), method = request.method;
      if (parts.length !== 3 || !['runs', 'highscores'].includes(parts[2])) return json({ error: { message: 'Nicht gefunden.' } }, 404);
      if (method === 'GET' && parts[2] === 'highscores') return json({ entries: await store.top() });
      if (method !== 'POST') return new Response(null, { status: 405, headers: { Allow: parts[2] === 'highscores' ? 'GET, POST' : 'POST' } });
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) throw new RequestError('Bitte direkt im Spiel eintragen.', 403);
      if (parts[2] === 'runs') {
        const createdAt = now(), id = crypto.randomUUID(), token = crypto.randomUUID() + crypto.randomUUID();
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        await store.cleanup(createdAt);
        await store.createRun({ id, tokenHash: await hash(token), seed, createdAt, expiresAt: createdAt + 86_400_000 });
        return json({ id, token, seed }, 201);
      }
      const data = await body(request);
      if (typeof data.runId !== 'string' || data.runId.length > 50 || typeof data.token !== 'string' || data.token.length > 100) throw new RequestError('Diese Runde ist ungültig.');
      if (typeof data.name !== 'string') throw new RequestError('Bitte gib einen Spitznamen ein.');
      const name = data.name.normalize('NFC').trim().replace(/\s+/gu, ' ');
      if ([...name].length < 2 || [...name].length > 20 || !/^[\p{L}\p{M}\p{N} ._'’!-]+$/u.test(name)) throw new RequestError('Bitte nutze 2–20 Zeichen: Buchstaben, Zahlen, Leerzeichen oder . _ ’ ! -');
      const run = await store.run(data.runId);
      if (!run || run.expiresAt <= now() || await hash(data.token) !== run.tokenHash) throw new RequestError('Diese Runde ist abgelaufen. Spiele bitte noch einmal.', 403);
      const existing = await store.entry(run.id);
      if (existing) return json({ entry: existing, rank: await store.rank(existing), entries: await store.top() });
      if (!Array.isArray(data.history) || data.history.length === 0 || data.history.length > 20_000) throw new RequestError('Die Spielaufzeichnung fehlt oder ist zu lang.');
      const game = new GameEngine(); game.start(run.seed);
      for (const step of data.history) {
        if (typeof step === 'number') {
          if (!Number.isFinite(step) || step <= 0 || step > .1 || game.state !== 'playing') throw new RequestError('Die Spielaufzeichnung ist ungültig.');
          game.update(step);
        } else if (Array.isArray(step) && step.length === 2 && step[0] === 'b' && Number.isInteger(step[1])) {
          if (!game.beginCharge(step[1])) throw new RequestError('Die Spielaufzeichnung ist ungültig.');
        } else if (Array.isArray(step) && step.length === 1 && step[0] === 'r') {
          if (!game.releaseCharge()) throw new RequestError('Die Spielaufzeichnung ist ungültig.');
        } else if (Array.isArray(step) && step.length === 1 && step[0] === 'c') game.cancelCharge();
        else throw new RequestError('Die Spielaufzeichnung ist ungültig.');
      }
      if (game.state !== 'finished' || game.score <= 0 || game.elapsed * 1000 > now() - run.createdAt + 3000) throw new RequestError('Nur abgeschlossene Runden mit Punkten können eingetragen werden.');
      await store.save({ id: run.id, name, score: game.score, served: game.served, createdAt: now() });
      const entry = (await store.entry(run.id))!;
      return json({ entry, rank: await store.rank(entry), entries: await store.top() }, 201);
    } catch (error) {
      if (!(error instanceof RequestError)) console.error('Glühwein-Rangliste:', error);
      return json({ error: { message: error instanceof RequestError ? error.message : 'Die Rangliste ist gerade nicht erreichbar. Bitte versuche es gleich erneut.' } }, error instanceof RequestError ? error.status : 503);
    }
  };
}
