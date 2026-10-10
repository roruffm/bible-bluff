// HTTP-API (Web-Standard Request/Response) – läuft im Cloudflare Worker und im lokalen Node-Server.
//
//   POST /api/rooms                  Raum eröffnen
//   GET  /api/rooms                  offene Räume für die Startseite (nur öffentlich angezeigte)
//   POST /api/rooms/:code/join       beitreten
//   GET  /api/rooms/:code            Spielstand (mit Token: persönliche Sicht, ohne: Leinwand)
//   POST /api/rooms/:code/action     Aktion ausführen
//   POST /api/rooms/:code/recap      Entdeckungen-Seite einer beendeten Partie anlegen (idempotent)
//   GET  /api/recaps/:id             Entdeckungen-Seite lesen
//   GET  /api/admin/bluffs           Kandidaten für frische Hausbluffs (nur mit ADMIN_KEY)
//   POST /api/admin/bluffs           Kandidaten freigeben oder ablehnen (nur mit ADMIN_KEY)

import { BLUFF_MAX, BOT_ROOM_CODE, PRESENCE_TOUCH_MS, ROOM_TTL_MS, normalizeCode } from '../shared/rules';
import type {
  Action,
  ApiErrorBody,
  BluffListResponse,
  BluffStatus,
  PublicRoomsResponse,
  RecapCreatedResponse,
  RecapResponse,
  SessionResponse,
  Settings,
  ViewResponse,
} from '../shared/types';
import { randomCode } from './codes';
import { candidatesFromGame, candidateView } from './bluff-pool';
import { botPresence, createBotRoom, createRoom, formatAnswer, joinRoom, step, tick } from './engine';
import { getQuestion, hasQuestion } from './questions';
import { buildRecap, isRecapId, randomRecapId } from './recap';
import { GameError, type Ctx, type PlayerRec, type RoomState } from './state';
import type { RoomRecord, RoomStore } from './store';
import { isDuplicate, isTooCloseToTruth } from './text';
import { buildView, publicRoom } from './view';

export interface ApiDeps {
  store: RoomStore;
  now?: () => number;
  rng?: () => number;
  /** Schlüssel für die Freigabe-Seite /admin; ohne ihn ist die Freigabe abgeschaltet */
  adminKey?: string;
}

const MAX_BODY = 8 * 1024;
const MAX_ATTEMPTS = 10;
/** Freigegebene Bluffs werden je Worker-Instanz so lange zwischengespeichert */
const APPROVED_TTL_MS = 5 * 60 * 1000;
const BLUFF_STATUSES: BluffStatus[] = ['new', 'approved', 'rejected'];
/** Liste offener Räume: so lange je Worker-Instanz zwischengespeichert, damit viele Besucher wenig kosten */
const PUBLIC_TTL_MS = 4000;
const PUBLIC_MAX = 12;

const ACTION_TYPES = new Set<Action['type']>([
  'start', 'settings', 'bluff', 'suggest', 'vote', 'like', 'gift', 'quiet', 'talk', 'talkStep', 'talkEnd',
  'pause', 'resume', 'skipPhase', 'swapQuestion', 'revealNext', 'next', 'kick', 'makeHost', 'lock', 'listed', 'close',
  'playAgain', 'leave',
]);

export function cryptoRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

function randomToken(bytes = 24): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bin = '';
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomPlayerId(): string {
  return 'p' + randomToken(9).replace(/[-_]/g, 'x').slice(0, 11);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
      'x-content-type-options': 'nosniff',
    },
  });
}

function errorResponse(err: unknown): Response {
  if (err instanceof GameError) {
    const body: ApiErrorBody = { error: { code: err.code, message: err.message } };
    return json(body, err.status);
  }
  console.error('Unerwarteter Fehler', err);
  const body: ApiErrorBody = { error: { code: 'internal', message: 'Da ist etwas schiefgelaufen. Bitte nochmal versuchen.' } };
  return json(body, 500);
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > MAX_BODY) throw new GameError('too_large', 'Anfrage zu groß.', 413);
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('kein Objekt');
    return parsed as Record<string, unknown>;
  } catch {
    throw new GameError('bad_json', 'Ungültige Anfrage.', 400);
  }
}

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+([A-Za-z0-9_-]{16,128})$/.exec(header.trim());
  return match ? match[1] : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApi(deps: ApiDeps) {
  const now = deps.now ?? (() => Date.now());
  const rng = deps.rng ?? cryptoRng;
  const { store } = deps;

  const makeCtx = (presence: Record<string, number>, extraBluffs?: Record<string, string[]>): Ctx => ({
    now: now(),
    rng,
    presence: { ...presence },
    extraBluffs,
  });

  // Freigegebene Bluffs aus echten Partien – selten geändert, darum zwischengespeichert
  let approved: { at: number; data: Record<string, string[]> } | null = null;
  async function approvedBluffs(): Promise<Record<string, string[]>> {
    const t = now();
    if (approved && t - approved.at < APPROVED_TTL_MS) return approved.data;
    try {
      approved = { at: t, data: await store.approvedBluffs() };
    } catch (err) {
      console.error('Freigegebene Bluffs nicht lesbar', err);
      approved = { at: t, data: approved?.data ?? {} };
    }
    return approved.data;
  }

  /** Nach einer Partie: starke Bluffs (ohne Namen) als Kandidaten für frische Hausbluffs ablegen */
  async function collectBluffs(state: RoomState, at: number) {
    try {
      await store.addBluffCandidates(candidatesFromGame(state), at);
    } catch (err) {
      console.error('Bluff-Kandidaten nicht gespeichert', err);
    }
  }

  async function loadRoom(code: string): Promise<RoomRecord> {
    let rec = await store.load(code);
    // Josephs Dauerraum gibt es immer – nach langer Ruhe (und dem Aufräumen) entsteht er neu
    if (!rec && code === BOT_ROOM_CODE) {
      await store.insert(code, createBotRoom(code, { now: now(), rng, presence: {} }), now());
      rec = await store.load(code);
    }
    if (!rec) throw new GameError('not_found', 'Diesen Raum gibt es nicht (mehr). Prüfe den Code.', 404);
    return rec;
  }

  /** Bots sind immer verbunden */
  function presenceOf(rec: RoomRecord, at: number): Record<string, number> {
    return { ...rec.presence, ...botPresence(rec.state, at) };
  }

  /** Spieler zum Token suchen – entfernte Personen bekommen eine eigene Meldung. */
  function identify(state: RoomState, tokenHash: string | null): PlayerRec | null {
    if (!tokenHash) return null;
    const p = state.players.find((x) => x.tokenHash === tokenHash);
    if (p) return p;
    if (state.kicked.some((k) => k.tokenHash === tokenHash)) {
      throw new GameError('kicked', 'Die Spielleitung hat dich aus diesem Raum entfernt.', 403);
    }
    throw new GameError('unknown_session', 'Deine Sitzung ist abgelaufen. Bitte tritt erneut bei.', 401);
  }

  /**
   * Lesen → Engine → bedingt schreiben. Bei Konflikt von vorn, damit kein Zug verloren geht.
   */
  async function mutate<T>(
    code: string,
    fn: (rec: RoomRecord, ctx: Ctx) => { next: RoomState | null; meId: string | null; extra?: T },
  ) {
    const extraBluffs = await approvedBluffs();
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const rec = await loadRoom(code);
      const ctx = makeCtx(rec.presence, extraBluffs);
      Object.assign(ctx.presence, botPresence(rec.state, ctx.now));
      const out = fn(rec, ctx);
      if (!out.next) return { state: rec.state, version: rec.version, ctx, ...out };
      if (await store.update(code, out.next, rec.version, ctx.now)) {
        // Genau ein Schreibvorgang beendet die Partie – dann die starken Bluffs einsammeln
        if (out.next.status === 'finished' && rec.state.status !== 'finished') await collectBluffs(out.next, ctx.now);
        return { state: out.next, version: rec.version + 1, ctx, ...out };
      }
      await sleep(3 + rng() * 15 * (attempt + 1));
    }
    throw new GameError('busy', 'Gerade ist viel los – bitte nochmal versuchen.', 503);
  }

  async function touchIfStale(code: string, playerId: string, presence: Record<string, number>, at: number) {
    const last = presence[playerId];
    if (last === undefined || at - last >= PRESENCE_TOUCH_MS) await store.touch(code, playerId, at);
  }

  // Offene Räume für die Startseite – Joseph zuerst, dann wartende Räume, dann laufende Partien
  let publicCache: { at: number; data: PublicRoomsResponse } | null = null;
  async function publicRoomsRoute(): Promise<Response> {
    const t = now();
    if (!publicCache || t - publicCache.at >= PUBLIC_TTL_MS) {
      const records = await store.listedRooms(PUBLIC_MAX * 3);
      if (!records.some((rec) => rec.state.code === BOT_ROOM_CODE)) records.push(await loadRoom(BOT_ROOM_CODE));
      const rooms = records
        .map((rec) => {
          const ctx: Ctx = { now: t, rng, presence: presenceOf(rec, t) };
          // So, wie der Raum beim nächsten Abruf aussähe (z. B. verlassene Partie schon zurückgesetzt)
          return publicRoom(tick(rec.state, ctx) ?? rec.state, ctx);
        })
        .filter((r) => r !== null)
        .sort(
          (a, b) =>
            Number(!a.bot) - Number(!b.bot) ||
            Number(a.status === 'playing') - Number(b.status === 'playing') ||
            (a.round ?? 0) - (b.round ?? 0),
        )
        .slice(0, PUBLIC_MAX);
      publicCache = { at: t, data: { rooms } };
    }
    return json(publicCache.data);
  }

  async function createRoomRoute(request: Request): Promise<Response> {
    const body = await readJson(request);
    const token = randomToken();
    const tokenHash = await hashToken(token);
    const hostId = randomPlayerId();
    const t = now();
    if (rng() < 0.2) await store.cleanup(t - ROOM_TTL_MS);

    for (let attempt = 0; attempt < 16; attempt++) {
      const code = randomCode(rng, attempt < 8 ? 1 : 2);
      const ctx: Ctx = { now: t, rng, presence: { [hostId]: t } };
      const state = createRoom(
        {
          code,
          hostId,
          hostName: String(body.name ?? ''),
          tokenHash,
          plays: body.plays !== false,
          settings: (body.settings && typeof body.settings === 'object' ? body.settings : undefined) as Partial<Settings> | undefined,
          seen: body.seen,
        },
        ctx,
      );
      if (await store.insert(code, state, t)) {
        await store.touch(code, hostId, t);
        const res: SessionResponse = { code, playerId: hostId, token, view: buildView(state, hostId, ctx, 1) };
        return json(res, 201);
      }
    }
    throw new GameError('busy', 'Kein freier Raumcode gefunden. Bitte nochmal versuchen.', 503);
  }

  async function joinRoute(request: Request, code: string): Promise<Response> {
    const body = await readJson(request);
    const token = randomToken();
    const tokenHash = await hashToken(token);
    const newId = randomPlayerId();
    const result = await mutate(code, (rec, ctx) => {
      const base = tick(rec.state, ctx) ?? rec.state;
      const joined = joinRoom(
        base,
        { playerId: newId, name: String(body.name ?? ''), tokenHash, reclaim: body.reclaim === true, seen: body.seen },
        ctx,
      );
      ctx.presence[joined.playerId] = ctx.now;
      return { next: joined.state, meId: joined.playerId };
    });
    await store.touch(code, result.meId!, result.ctx.now);
    const res: SessionResponse = {
      code,
      playerId: result.meId!,
      token,
      view: buildView(result.state, result.meId, result.ctx, result.version),
    };
    return json(res, 200);
  }

  async function stateRoute(request: Request, code: string): Promise<Response> {
    const token = bearer(request);
    const tokenHash = token ? await hashToken(token) : null;
    const result = await mutate(code, (rec, ctx) => {
      const me = identify(rec.state, tokenHash);
      if (me) ctx.presence[me.id] = ctx.now;
      return { next: tick(rec.state, ctx), meId: me?.id ?? null, extra: rec.presence };
    });
    if (result.meId) await touchIfStale(code, result.meId, result.extra ?? {}, result.ctx.now);
    const res: ViewResponse = { view: buildView(result.state, result.meId, result.ctx, result.version) };
    return json(res);
  }

  async function actionRoute(request: Request, code: string): Promise<Response> {
    const token = bearer(request);
    if (!token) throw new GameError('unknown_session', 'Bitte tritt dem Raum zuerst bei.', 401);
    const tokenHash = await hashToken(token);
    const body = await readJson(request);
    if (typeof body.type !== 'string' || !ACTION_TYPES.has(body.type as Action['type'])) {
      throw new GameError('bad_action', 'Unbekannte Aktion.', 400);
    }
    const action = body as unknown as Action;
    const result = await mutate(code, (rec, ctx) => {
      const me = identify(rec.state, tokenHash)!;
      ctx.presence[me.id] = ctx.now;
      const out = step(rec.state, me.id, action, ctx);
      return { next: out.changed ? out.state : null, meId: me.id, extra: { suggestion: out.suggestion, presence: rec.presence } };
    });
    const meStillHere = result.state.players.some((p) => p.id === result.meId);
    if (meStillHere) await touchIfStale(code, result.meId!, result.extra?.presence ?? {}, result.ctx.now);
    const res: ViewResponse = {
      view: buildView(result.state, meStillHere ? result.meId : null, result.ctx, result.version),
    };
    if (result.extra?.suggestion) res.suggestion = result.extra.suggestion;
    return json(res);
  }

  /**
   * Entdeckungen-Seite anlegen. Erst die ID im Raum festschreiben, dann die Seite speichern:
   * So entsteht pro Partie genau eine Seite, auch wenn mehrere Geräte gleichzeitig fragen.
   */
  async function recapRoute(code: string): Promise<Response> {
    const fresh = randomRecapId();
    const result = await mutate(code, (rec) => {
      const g = rec.state.game;
      if (rec.state.status !== 'finished' || !g) {
        throw new GameError('not_finished', 'Die Entdeckungen gibt es, sobald die Partie beendet ist.');
      }
      if (g.recapId) return { next: null, meId: null };
      return { next: { ...rec.state, game: { ...g, recapId: fresh } }, meId: null };
    });
    const id = result.state.game!.recapId!;
    if (!(await store.loadRecap(id))) await store.saveRecap(buildRecap(result.state, id), result.ctx.now);
    const res: RecapCreatedResponse = { id };
    return json(res, 201);
  }

  async function readRecapRoute(id: string): Promise<Response> {
    const recap = isRecapId(id) ? await store.loadRecap(id) : null;
    if (!recap) throw new GameError('not_found', 'Diese Seite gibt es nicht. Prüfe den Link.', 404);
    const res: RecapResponse = { recap };
    // Die Seite ändert sich nie mehr
    return json(res, 200, 'public, max-age=86400, immutable');
  }

  /** Freigabe-Seite: nur mit dem Schlüssel aus der Umgebungsvariable ADMIN_KEY */
  async function requireAdmin(request: Request) {
    if (!deps.adminKey) throw new GameError('admin_off', 'Die Freigabe ist noch nicht eingerichtet.', 404);
    const header = (request.headers.get('authorization') ?? '').trim();
    const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    // Über Hashes vergleichen, damit die Laufzeit nichts über den Schlüssel verrät
    if (!given || given.length > 200 || (await hashToken(given)) !== (await hashToken(deps.adminKey))) {
      throw new GameError('admin_denied', 'Dieser Schlüssel passt nicht.', 401);
    }
  }

  async function listBluffsRoute(request: Request, url: URL): Promise<Response> {
    await requireAdmin(request);
    const status = (url.searchParams.get('status') ?? 'new') as BluffStatus;
    if (!BLUFF_STATUSES.includes(status)) throw new GameError('bad_status', 'Unbekannter Status.', 400);
    const rows = await store.listBluffs(status, 200);
    const res: BluffListResponse = { items: rows.map(candidateView) };
    return json(res);
  }

  async function decideBluffRoute(request: Request): Promise<Response> {
    await requireAdmin(request);
    const body = await readJson(request);
    const questionId = String(body.questionId ?? '');
    const key = String(body.key ?? '');
    const status = body.status as BluffStatus;
    if (!BLUFF_STATUSES.includes(status)) throw new GameError('bad_status', 'Unbekannter Status.', 400);
    if (!hasQuestion(questionId) || !key) throw new GameError('not_found', 'Diesen Kandidaten gibt es nicht.', 404);
    const text = formatAnswer(typeof body.text === 'string' ? body.text : '');
    if (!text || text.length > BLUFF_MAX) throw new GameError('bad_text', `Der Bluff braucht 1 bis ${BLUFF_MAX} Zeichen.`, 400);
    if (status === 'approved') {
      const q = getQuestion(questionId);
      if (isTooCloseToTruth(text, q)) {
        throw new GameError('too_close', 'Das ist zu nah an der richtigen Antwort – so würde der Bluff die Wahrheit verraten.', 422);
      }
      if (q.bluffs.some((house) => isDuplicate(house, text))) {
        throw new GameError('duplicate', 'Diesen Bluff gibt es schon als Hausbluff.', 409);
      }
    }
    if (!(await store.decideBluff(questionId, key, status, text, now()))) {
      throw new GameError('not_found', 'Diesen Kandidaten gibt es nicht.', 404);
    }
    approved = null; // gleich mit der neuen Liste spielen
    return json({ ok: true });
  }

  return async function handleApi(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean); // ['api', ...]
    try {
      if (parts[0] !== 'api') throw new GameError('not_found', 'Nicht gefunden.', 404);
      const method = request.method.toUpperCase();

      if (parts.length === 2 && parts[1] === 'health' && method === 'GET') return json({ ok: true });
      if (parts.length === 2 && parts[1] === 'rooms' && method === 'POST') return await createRoomRoute(request);
      if (parts.length === 2 && parts[1] === 'rooms' && method === 'GET') return await publicRoomsRoute();

      if (parts[1] === 'rooms' && parts.length >= 3) {
        const code = normalizeCode(decodeURIComponent(parts[2]));
        if (!code) throw new GameError('not_found', 'Diesen Raum gibt es nicht.', 404);
        if (parts.length === 3 && method === 'GET') return await stateRoute(request, code);
        if (parts.length === 4 && parts[3] === 'join' && method === 'POST') return await joinRoute(request, code);
        if (parts.length === 4 && parts[3] === 'action' && method === 'POST') return await actionRoute(request, code);
        if (parts.length === 4 && parts[3] === 'recap' && method === 'POST') return await recapRoute(code);
      }
      if (parts[1] === 'recaps' && parts.length === 3 && method === 'GET') {
        return await readRecapRoute(decodeURIComponent(parts[2]));
      }
      if (parts[1] === 'admin' && parts[2] === 'bluffs' && parts.length === 3) {
        if (method === 'GET') return await listBluffsRoute(request, url);
        if (method === 'POST') return await decideBluffRoute(request);
      }
      throw new GameError('not_found', 'Nicht gefunden.', 404);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
