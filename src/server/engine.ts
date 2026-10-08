// Spiel-Engine: reine Zustandsübergänge. Kein Netzwerk, keine Datenbank, keine Uhr.
// Zeit, Zufall und Präsenz kommen über den Ctx herein.

import {
  BLUFF_MAX,
  DEFAULT_SETTINGS,
  DIFFICULTY_OPTIONS,
  HOST_TAKEOVER_MS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ONLINE_WINDOW_MS,
  PLAYER_COLORS,
  POINTS_PER_FOOLED,
  POINTS_TRUTH,
  REVEAL_BLUFF_MS,
  REVEAL_INTRO_MS,
  REVEAL_REST_MS,
  REVEAL_TRUTH_MS,
  ROUND_OPTIONS,
  SCORES_SECONDS,
  VOTE_OPTIONS,
  WRITE_OPTIONS,
  cleanBluff,
  cleanName,
} from '../shared/rules';
import type { Action, Difficulty, Settings } from '../shared/types';
import { QUESTIONS, getQuestion, type Question } from './questions';
import {
  GameError,
  type Ctx,
  type GameRec,
  type OptionRec,
  type PlayerRec,
  type ResultRec,
  type RoomState,
  type RoundRec,
  type StepRec,
} from './state';
import { isDuplicate, isTooCloseToTruth, normalize } from './text';

const MIN_OPTIONS = 4;
const SPARE_QUESTIONS = 4;
const MAX_NUMBER_QUESTIONS = 2;

const DIFFICULTY_WEIGHTS: Record<Difficulty, Record<1 | 2 | 3, number>> = {
  leicht: { 1: 10, 2: 1, 3: 0 },
  mittel: { 1: 2, 2: 2, 3: 1 },
  schwer: { 1: 0, 2: 1, 3: 6 },
  gemischt: { 1: 3, 2: 1, 3: 3 },
};

// ───────────────────────── Hilfen ─────────────────────────

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isOnline(ctx: Ctx, playerId: string): boolean {
  const seen = ctx.presence[playerId];
  return seen !== undefined && ctx.now - seen < ONLINE_WINDOW_MS;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomId(rng: () => number, length = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(rng() * chars.length)];
  return out;
}

/** Erster Buchstabe groß, Schlusspunkt weg – damit die Wahrheit nicht am Stil auffällt. */
export function formatAnswer(text: string): string {
  const t = cleanBluff(text).replace(/[.!]+$/u, '').trim();
  return t ? t.charAt(0).toLocaleUpperCase('de-DE') + t.slice(1) : t;
}

function player(state: RoomState, id: string): PlayerRec | undefined {
  return state.players.find((p) => p.id === id);
}

function requirePlayer(state: RoomState, id: string): PlayerRec {
  const p = player(state, id);
  if (!p) throw new GameError('not_in_room', 'Du bist nicht (mehr) in diesem Raum.', 403);
  return p;
}

function players(state: RoomState): PlayerRec[] {
  return state.players.filter((p) => p.plays);
}

function requireHost(state: RoomState, actorId: string) {
  if (state.hostId !== actorId) {
    throw new GameError('not_host', 'Das darf nur die Spielleitung.', 403);
  }
}

function requireGame(state: RoomState): GameRec {
  if (state.status !== 'playing' || !state.game) {
    throw new GameError('not_playing', 'Gerade läuft keine Runde.');
  }
  return state.game;
}

function freshStats() {
  return { found: 0, fooled: 0, fellFor: 0 };
}

function nextColor(state: RoomState): string {
  const used = new Set(state.players.map((p) => p.color));
  return PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[state.players.length % PLAYER_COLORS.length];
}

export function sanitizeSettings(input: Partial<Settings> | undefined, base: Settings = DEFAULT_SETTINGS): Settings {
  const s = { ...base };
  if (!input) return s;
  if (input.rounds !== undefined) {
    if (!(ROUND_OPTIONS as readonly number[]).includes(input.rounds)) throw new GameError('bad_settings', 'Ungültige Rundenzahl.', 400);
    s.rounds = input.rounds;
  }
  if (input.writeSeconds !== undefined) {
    if (!(WRITE_OPTIONS as readonly number[]).includes(input.writeSeconds)) throw new GameError('bad_settings', 'Ungültige Schreibzeit.', 400);
    s.writeSeconds = input.writeSeconds;
  }
  if (input.voteSeconds !== undefined) {
    if (!(VOTE_OPTIONS as readonly number[]).includes(input.voteSeconds)) throw new GameError('bad_settings', 'Ungültige Abstimmzeit.', 400);
    s.voteSeconds = input.voteSeconds;
  }
  if (input.difficulty !== undefined) {
    if (!DIFFICULTY_OPTIONS.some((d) => d.value === input.difficulty)) throw new GameError('bad_settings', 'Ungültige Schwierigkeit.', 400);
    s.difficulty = input.difficulty;
  }
  return s;
}

// ───────────────────────── Raum & Beitritt ─────────────────────────

export interface NewRoomInput {
  code: string;
  hostId: string;
  hostName: string;
  tokenHash: string;
  plays: boolean;
  settings?: Partial<Settings>;
}

export function createRoom(input: NewRoomInput, ctx: Ctx): RoomState {
  const name = cleanName(input.hostName);
  if (!name) throw new GameError('bad_name', 'Bitte gib einen Spitznamen ein.', 400);
  return {
    v: 1,
    code: input.code,
    createdAt: ctx.now,
    status: 'lobby',
    hostId: input.hostId,
    locked: false,
    settings: sanitizeSettings(input.settings),
    players: [
      {
        id: input.hostId,
        name,
        color: PLAYER_COLORS[0],
        tokenHash: input.tokenHash,
        joinedAt: ctx.now,
        plays: input.plays,
        score: 0,
        stats: freshStats(),
      },
    ],
    kicked: [],
    game: null,
    usedQuestionIds: [],
    paused: null,
  };
}

export interface JoinInput {
  playerId: string;
  name: string;
  tokenHash: string;
  /** Wiedereinstieg unter einem bestehenden, gerade nicht verbundenen Namen */
  reclaim?: boolean;
}

export function joinRoom(state: RoomState, input: JoinInput, ctx: Ctx): { state: RoomState; playerId: string } {
  if (state.status === 'closed') throw new GameError('closed', 'Dieser Raum wurde geschlossen.', 410);
  const name = cleanName(input.name);
  if (!name) throw new GameError('bad_name', 'Bitte gib einen Spitznamen ein.', 400);

  const s = clone(state);
  const key = normalize(name);
  const existing = s.players.find((p) => normalize(p.name) === key);
  if (existing) {
    if (isOnline(ctx, existing.id)) {
      throw new GameError('name_taken', `„${existing.name}“ ist schon dabei. Wähle einen anderen Namen.`);
    }
    if (!input.reclaim) {
      throw new GameError('name_offline', `„${existing.name}“ ist gerade nicht verbunden. Bist du das?`);
    }
    existing.tokenHash = input.tokenHash;
    return { state: s, playerId: existing.id };
  }

  if (s.locked) throw new GameError('locked', 'Die Spielleitung hat den Raum für neue Teilnehmende gesperrt.', 403);
  if (players(s).length >= MAX_PLAYERS) throw new GameError('full', `Der Raum ist voll (höchstens ${MAX_PLAYERS}).`, 403);

  s.players.push({
    id: input.playerId,
    name,
    color: nextColor(s),
    tokenHash: input.tokenHash,
    joinedAt: ctx.now,
    plays: true,
    score: 0,
    stats: freshStats(),
  });
  return { state: s, playerId: input.playerId };
}

// ───────────────────────── Fragenauswahl ─────────────────────────

export function pickQuestions(
  difficulty: Difficulty,
  used: Set<string>,
  count: number,
  rng: () => number,
): { main: string[]; spare: string[] } {
  const weights = DIFFICULTY_WEIGHTS[difficulty];
  let pool = QUESTIONS.filter((q) => !used.has(q.id));
  if (pool.length < count + SPARE_QUESTIONS) pool = [...QUESTIONS];

  // Gewichtetes Ziehen ohne Zurücklegen (Efraimidis–Spirakis)
  const ranked = pool
    .map((q) => {
      const w = weights[q.difficulty];
      return { q, key: w > 0 ? Math.pow(rng(), 1 / w) : -1 - rng() };
    })
    .sort((a, b) => b.key - a.key)
    .map((x) => x.q);

  const chosen: Question[] = [];
  const books = new Set<string>();
  let numbers = 0;
  const want = count + SPARE_QUESTIONS;
  for (const strict of [true, false]) {
    for (const q of ranked) {
      if (chosen.length >= want) break;
      if (chosen.includes(q)) continue;
      if (strict && (books.has(q.book) || (q.number && numbers >= MAX_NUMBER_QUESTIONS))) continue;
      chosen.push(q);
      books.add(q.book);
      if (q.number) numbers++;
    }
  }

  const main = chosen.slice(0, count);
  if (difficulty === 'gemischt') main.sort((a, b) => a.difficulty - b.difficulty);
  return { main: main.map((q) => q.id), spare: chosen.slice(count).map((q) => q.id) };
}

// ───────────────────────── Phasen ─────────────────────────

function newRound(index: number, questionId: string): RoundRec {
  return {
    index,
    questionId,
    bluffs: {},
    options: null,
    votes: {},
    results: null,
    revealStartedAt: null,
    plan: null,
  };
}

function startGame(s: RoomState, ctx: Ctx) {
  if (players(s).length < MIN_PLAYERS) {
    throw new GameError('too_few', `Es braucht mindestens ${MIN_PLAYERS} Mitspielende.`);
  }
  const { main, spare } = pickQuestions(s.settings.difficulty, new Set(s.usedQuestionIds), s.settings.rounds, ctx.rng);
  for (const p of s.players) {
    p.score = 0;
    p.stats = freshStats();
  }
  s.status = 'playing';
  s.paused = null;
  s.game = {
    questionIds: main,
    spareIds: spare,
    roundIndex: 0,
    phase: 'write',
    phaseStartedAt: ctx.now,
    deadline: null,
    round: newRound(0, main[0]),
    history: [],
  };
  startRound(s, 0, ctx);
}

function markUsed(s: RoomState, questionId: string) {
  if (!s.usedQuestionIds.includes(questionId)) s.usedQuestionIds.push(questionId);
  // Liste nicht endlos wachsen lassen
  if (s.usedQuestionIds.length > QUESTIONS.length) s.usedQuestionIds = s.usedQuestionIds.slice(-QUESTIONS.length);
}

function startRound(s: RoomState, index: number, ctx: Ctx) {
  const g = s.game!;
  const questionId = g.questionIds[index];
  markUsed(s, questionId);
  g.roundIndex = index;
  g.round = newRound(index, questionId);
  g.phase = 'write';
  g.phaseStartedAt = ctx.now;
  g.deadline = ctx.now + s.settings.writeSeconds * 1000;
}

function startVote(s: RoomState, ctx: Ctx) {
  const g = s.game!;
  const round = g.round;
  const q = getQuestion(round.questionId);

  // Bluffs der noch anwesenden Mitspielenden, in Abgabe-Reihenfolge, Duplikate zusammengeführt
  const entries = Object.entries(round.bluffs)
    .filter(([id]) => player(s, id)?.plays)
    .sort((a, b) => a[1].at - b[1].at);
  const groups: { text: string; authorIds: string[] }[] = [];
  for (const [authorId, bluff] of entries) {
    const same = groups.find((grp) => isDuplicate(grp.text, bluff.text));
    if (same) same.authorIds.push(authorId);
    else groups.push({ text: bluff.text, authorIds: [authorId] });
  }

  const options: OptionRec[] = [
    { id: '', text: formatAnswer(q.answer), kind: 'truth', authorIds: [] },
    ...groups.map((grp) => ({ id: '', text: grp.text, kind: 'player' as const, authorIds: grp.authorIds })),
  ];

  // Mit Hausbluffs auffüllen, damit es immer etwas zu raten gibt
  for (const decoy of shuffle(q.bluffs, ctx.rng)) {
    if (options.length >= MIN_OPTIONS) break;
    if (options.some((o) => isDuplicate(o.text, decoy))) continue;
    options.push({ id: '', text: formatAnswer(decoy), kind: 'house', authorIds: [] });
  }

  const ids = new Set<string>();
  round.options = shuffle(options, ctx.rng).map((o) => {
    let id = randomId(ctx.rng);
    while (ids.has(id)) id = randomId(ctx.rng);
    ids.add(id);
    return { ...o, id };
  });
  round.votes = {};
  g.phase = 'vote';
  g.phaseStartedAt = ctx.now;
  g.deadline = ctx.now + s.settings.voteSeconds * 1000;
}

export function votersOf(round: RoundRec, optionId: string): string[] {
  return Object.entries(round.votes)
    .filter(([, o]) => o === optionId)
    .map(([voterId]) => voterId);
}

function computeResults(s: RoomState, round: RoundRec): Record<string, ResultRec> {
  const results: Record<string, ResultRec> = {};
  for (const p of players(s)) {
    results[p.id] = { truth: 0, bluff: 0, foundTruth: false, fooled: 0, fellFor: null };
  }
  for (const [voterId, optionId] of Object.entries(round.votes)) {
    const voter = results[voterId];
    const option = round.options?.find((o) => o.id === optionId);
    if (!voter || !option) continue;
    if (option.kind === 'truth') {
      voter.truth += POINTS_TRUTH;
      voter.foundTruth = true;
      continue;
    }
    voter.fellFor = option.id;
    for (const authorId of option.authorIds) {
      const author = results[authorId];
      if (!author || authorId === voterId) continue;
      author.bluff += POINTS_PER_FOOLED;
      author.fooled += 1;
    }
  }
  return results;
}

export function buildPlan(round: RoundRec): StepRec[] {
  const options = round.options ?? [];
  const count = (o: OptionRec) => votersOf(round, o.id).length;
  const chosen = options
    .filter((o) => o.kind !== 'truth' && count(o) > 0)
    // Spannung aufbauen: der erfolgreichste Bluff kommt zuletzt
    .sort((a, b) => count(a) - count(b) || (a.kind === 'house' ? -1 : 0) - (b.kind === 'house' ? -1 : 0));
  const unchosen = options.filter((o) => o.kind !== 'truth' && count(o) === 0);
  const truth = options.find((o) => o.kind === 'truth');

  const steps: StepRec[] = [];
  let at = 0;
  steps.push({ kind: 'intro', at, duration: REVEAL_INTRO_MS });
  at += REVEAL_INTRO_MS;
  for (const o of chosen) {
    steps.push({ kind: 'bluff', at, duration: REVEAL_BLUFF_MS, optionId: o.id });
    at += REVEAL_BLUFF_MS;
  }
  if (truth) {
    steps.push({ kind: 'truth', at, duration: REVEAL_TRUTH_MS, optionId: truth.id });
    at += REVEAL_TRUTH_MS;
  }
  if (unchosen.length) {
    steps.push({ kind: 'rest', at, duration: REVEAL_REST_MS, optionIds: unchosen.map((o) => o.id) });
  }
  return steps;
}

export function planLength(plan: StepRec[]): number {
  const last = plan[plan.length - 1];
  return last ? last.at + last.duration : 0;
}

function startReveal(s: RoomState, ctx: Ctx) {
  const g = s.game!;
  const round = g.round;
  round.results = computeResults(s, round);
  round.plan = buildPlan(round);
  round.revealStartedAt = ctx.now;
  g.phase = 'reveal';
  g.phaseStartedAt = ctx.now;
  g.deadline = ctx.now + planLength(round.plan) + 400;
}

function startScores(s: RoomState, ctx: Ctx) {
  const g = s.game!;
  const round = g.round;
  const results = round.results ?? computeResults(s, round);
  round.results = results;
  for (const p of s.players) {
    const r = results[p.id];
    if (!r) continue;
    p.score += r.truth + r.bluff;
    if (r.foundTruth) p.stats.found += 1;
    p.stats.fooled += r.fooled;
    if (r.fellFor) p.stats.fellFor += 1;
  }
  g.history.push({ questionId: round.questionId, results });
  g.phase = 'scores';
  g.phaseStartedAt = ctx.now;
  g.deadline = ctx.now + SCORES_SECONDS * 1000;
}

function afterScores(s: RoomState, ctx: Ctx) {
  const g = s.game!;
  if (g.roundIndex + 1 < g.questionIds.length) {
    startRound(s, g.roundIndex + 1, ctx);
  } else {
    s.status = 'finished';
    g.deadline = null;
    s.paused = null;
  }
}

function eligibleOnline(s: RoomState, ctx: Ctx): PlayerRec[] {
  return players(s).filter((p) => isOnline(ctx, p.id));
}

function everyoneWrote(s: RoomState, ctx: Ctx): boolean {
  const eligible = eligibleOnline(s, ctx);
  const round = s.game!.round;
  return eligible.length > 0 && eligible.every((p) => round.bluffs[p.id]);
}

function everyoneVoted(s: RoomState, ctx: Ctx): boolean {
  const eligible = eligibleOnline(s, ctx);
  const round = s.game!.round;
  return eligible.length > 0 && eligible.every((p) => round.votes[p.id]);
}

function advancePhase(s: RoomState, ctx: Ctx) {
  const g = s.game!;
  switch (g.phase) {
    case 'write':
      return startVote(s, ctx);
    case 'vote':
      return startReveal(s, ctx);
    case 'reveal':
      return startScores(s, ctx);
    case 'scores':
      return afterScores(s, ctx);
  }
}

// ───────────────────────── Takt ─────────────────────────

/**
 * Wird bei jedem Abruf ausgeführt: Zeitlimits prüfen, Phasen weiterschalten,
 * verwaiste Spielleitung übergeben. Gibt null zurück, wenn sich nichts ändert.
 */
export function tick(state: RoomState, ctx: Ctx): RoomState | null {
  const s = clone(state);
  let changed = false;

  if (s.status !== 'closed') {
    const host = player(s, s.hostId);
    const hostSeen = ctx.presence[s.hostId];
    const hostGone = !host || hostSeen === undefined || ctx.now - hostSeen > HOST_TAKEOVER_MS;
    if (hostGone && s.players.length) {
      const byAge = [...s.players].sort((a, b) => a.joinedAt - b.joinedAt);
      const candidate =
        byAge.find((p) => p.id !== s.hostId && isOnline(ctx, p.id)) ?? (host ? undefined : byAge[0]);
      if (candidate && candidate.id !== s.hostId) {
        s.hostId = candidate.id;
        changed = true;
      }
    }
  }

  if (s.status === 'playing' && s.game && !s.paused) {
    for (let guard = 0; guard < 6 && s.status === 'playing'; guard++) {
      const g = s.game;
      const due = g.deadline !== null && ctx.now >= g.deadline;
      const early =
        (g.phase === 'write' && everyoneWrote(s, ctx)) || (g.phase === 'vote' && everyoneVoted(s, ctx));
      if (!due && !early) break;
      advancePhase(s, ctx);
      changed = true;
    }
  }

  return changed ? s : null;
}

// ───────────────────────── Aktionen ─────────────────────────

export interface ActionResult {
  state: RoomState;
  suggestion?: string;
}

export function applyAction(state: RoomState, actorId: string, action: Action, ctx: Ctx): ActionResult {
  if (state.status === 'closed') throw new GameError('closed', 'Dieser Raum wurde geschlossen.', 410);
  const s = clone(state);
  const actor = requirePlayer(s, actorId);

  switch (action.type) {
    case 'start': {
      requireHost(s, actorId);
      if (s.status !== 'lobby') throw new GameError('bad_state', 'Die Partie läuft bereits.');
      startGame(s, ctx);
      return { state: s };
    }

    case 'settings': {
      requireHost(s, actorId);
      if (s.status !== 'lobby') throw new GameError('bad_state', 'Einstellungen nur vor dem Start änderbar.');
      s.settings = sanitizeSettings(action.settings, s.settings);
      if (typeof action.hostPlays === 'boolean') {
        if (action.hostPlays && !actor.plays && players(s).length >= MAX_PLAYERS) {
          throw new GameError('full', 'Der Raum ist schon voll.');
        }
        actor.plays = action.hostPlays;
      }
      return { state: s };
    }

    case 'bluff': {
      const g = requireGame(s);
      if (g.phase !== 'write') throw new GameError('phase_over', 'Die Schreibzeit ist vorbei.');
      if (!actor.plays) throw new GameError('not_playing', 'Du leitest nur – mitschreiben geht nicht.');
      const text = formatAnswer(typeof action.text === 'string' ? action.text : '');
      if (!text) throw new GameError('empty', 'Schreib zuerst einen Bluff.', 400);
      if (text.length > BLUFF_MAX) throw new GameError('too_long', `Höchstens ${BLUFF_MAX} Zeichen.`, 400);
      const q = getQuestion(g.round.questionId);
      if (isTooCloseToTruth(text, q)) {
        throw new GameError(
          'too_close',
          'Das ist zu nah an der richtigen Antwort – oder stimmt sogar. Erfinde etwas eindeutig Falsches!',
          422,
        );
      }
      g.round.bluffs[actorId] = { text, at: ctx.now };
      return { state: s };
    }

    case 'suggest': {
      const g = requireGame(s);
      if (g.phase !== 'write') throw new GameError('phase_over', 'Die Schreibzeit ist vorbei.');
      if (!actor.plays) throw new GameError('not_playing', 'Du leitest nur – mitschreiben geht nicht.');
      return { state, suggestion: suggestBluff(s, actorId, Number(action.n) || 0) };
    }

    case 'vote': {
      const g = requireGame(s);
      if (g.phase !== 'vote') throw new GameError('phase_over', 'Die Abstimmung ist vorbei.');
      if (!actor.plays) throw new GameError('not_playing', 'Du leitest nur – abstimmen geht nicht.');
      const option = g.round.options?.find((o) => o.id === action.optionId);
      if (!option) throw new GameError('bad_option', 'Diese Antwort gibt es nicht.', 400);
      if (option.authorIds.includes(actorId)) {
        throw new GameError('own_bluff', 'Deinen eigenen Bluff kannst du nicht wählen.', 400);
      }
      g.round.votes[actorId] = option.id;
      return { state: s };
    }

    case 'pause': {
      requireHost(s, actorId);
      requireGame(s);
      if (!s.paused) s.paused = { at: ctx.now };
      return { state: s };
    }

    case 'resume': {
      requireHost(s, actorId);
      resume(s, ctx);
      return { state: s };
    }

    case 'skipPhase': {
      requireHost(s, actorId);
      requireGame(s);
      resume(s, ctx);
      advancePhase(s, ctx);
      return { state: s };
    }

    case 'swapQuestion': {
      requireHost(s, actorId);
      const g = requireGame(s);
      if (g.phase !== 'write') throw new GameError('bad_state', 'Fragen lassen sich nur beim Schreiben tauschen.');
      resume(s, ctx);
      let next = g.spareIds.shift();
      if (!next) {
        const used = new Set([...s.usedQuestionIds, ...g.questionIds]);
        next = pickQuestions(s.settings.difficulty, used, 1, ctx.rng).main[0];
      }
      g.questionIds[g.roundIndex] = next;
      startRound(s, g.roundIndex, ctx);
      return { state: s };
    }

    case 'revealNext': {
      requireHost(s, actorId);
      const g = requireGame(s);
      if (g.phase !== 'reveal' || !g.round.plan || g.round.revealStartedAt === null) {
        throw new GameError('bad_state', 'Gerade wird nichts aufgedeckt.');
      }
      resume(s, ctx);
      const plan = g.round.plan;
      const elapsed = ctx.now - g.round.revealStartedAt;
      const nextStep = plan.find((step) => step.at > elapsed);
      if (!nextStep) {
        startScores(s, ctx);
      } else {
        g.round.revealStartedAt = ctx.now - nextStep.at;
        g.deadline = g.round.revealStartedAt + planLength(plan) + 400;
      }
      return { state: s };
    }

    case 'next': {
      requireHost(s, actorId);
      const g = requireGame(s);
      if (g.phase !== 'scores') throw new GameError('bad_state', 'Erst nach der Auflösung geht es weiter.');
      resume(s, ctx);
      afterScores(s, ctx);
      return { state: s };
    }

    case 'kick': {
      requireHost(s, actorId);
      if (action.playerId === actorId) throw new GameError('bad_target', 'Du kannst dich nicht selbst entfernen.', 400);
      const target = requirePlayerTarget(s, action.playerId);
      removePlayer(s, target.id);
      s.kicked.push({ id: target.id, name: target.name, color: target.color, tokenHash: target.tokenHash });
      return { state: s };
    }

    case 'makeHost': {
      requireHost(s, actorId);
      const target = requirePlayerTarget(s, action.playerId);
      s.hostId = target.id;
      return { state: s };
    }

    case 'lock': {
      requireHost(s, actorId);
      s.locked = Boolean(action.locked);
      return { state: s };
    }

    case 'close': {
      requireHost(s, actorId);
      s.status = 'closed';
      s.paused = null;
      return { state: s };
    }

    case 'playAgain': {
      requireHost(s, actorId);
      if (s.status !== 'finished') throw new GameError('bad_state', 'Die Partie läuft noch.');
      s.status = 'lobby';
      s.game = null;
      s.paused = null;
      for (const p of s.players) {
        p.score = 0;
        p.stats = freshStats();
      }
      return { state: s };
    }

    case 'leave': {
      removePlayer(s, actorId);
      if (s.hostId === actorId) {
        const successor = [...s.players].sort((a, b) => a.joinedAt - b.joinedAt).find((p) => isOnline(ctx, p.id)) ??
          s.players[0];
        if (successor) s.hostId = successor.id;
      }
      if (!s.players.length) s.status = 'closed';
      return { state: s };
    }

    default:
      throw new GameError('bad_action', 'Unbekannte Aktion.', 400);
  }
}

function requirePlayerTarget(s: RoomState, id: string): PlayerRec {
  const target = player(s, id);
  if (!target) throw new GameError('bad_target', 'Diese Person ist nicht im Raum.', 404);
  return target;
}

function removePlayer(s: RoomState, id: string) {
  s.players = s.players.filter((p) => p.id !== id);
  const round = s.game?.round;
  if (!round) return;
  if (s.game!.phase === 'write') delete round.bluffs[id];
  if (s.game!.phase === 'vote') delete round.votes[id];
}

function resume(s: RoomState, ctx: Ctx) {
  if (!s.paused) return;
  const delta = ctx.now - s.paused.at;
  s.paused = null;
  const g = s.game;
  if (!g) return;
  g.phaseStartedAt += delta;
  if (g.deadline !== null) g.deadline += delta;
  if (g.round.revealStartedAt !== null) g.round.revealStartedAt += delta;
}

function suggestBluff(s: RoomState, actorId: string, n: number): string {
  const g = s.game!;
  const q = getQuestion(g.round.questionId);
  const position = Math.max(0, players(s).findIndex((p) => p.id === actorId));
  const others = Object.entries(g.round.bluffs)
    .filter(([id]) => id !== actorId)
    .map(([, b]) => b.text);
  for (let i = 0; i < q.bluffs.length; i++) {
    const candidate = q.bluffs[(position + n + i) % q.bluffs.length];
    if (!others.some((t) => isDuplicate(t, candidate))) return candidate;
  }
  return q.bluffs[(position + n) % q.bluffs.length];
}

/**
 * Ein vollständiger Zug: erst fällige Phasenwechsel, dann die Aktion, dann sofortige Folgen
 * (z. B. Abstimmung starten, sobald der letzte Bluff eingegangen ist).
 * `changed` ist false, wenn sich am gespeicherten Zustand nichts ändert.
 */
export function step(state: RoomState, actorId: string, action: Action, ctx: Ctx): ActionResult & { changed: boolean } {
  const ticked = tick(state, ctx);
  const base = ticked ?? state;
  const out = applyAction(base, actorId, action, ctx);
  const after = tick(out.state, ctx);
  const next = after ?? out.state;
  return { state: next, suggestion: out.suggestion, changed: next !== state };
}
