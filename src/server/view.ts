// Gefilterte Sicht auf den Raum: Jede Person bekommt nur, was sie gerade sehen darf.
// Antworten, Bluff-Urheber und Stimmen bleiben bis zur Aufdeckung auf dem Server.

import { POINTS_FAVORITE } from '../shared/rules';
import type {
  AwardView,
  FavoriteOptionView,
  FinalView,
  MeView,
  PersonRef,
  PlayerView,
  RevealStepView,
  RoomView,
  RoundView,
  TalkView,
} from '../shared/types';
import { favoriteLeaders, isOnline, isQuiet, likeCounts, missStats, planLength, votersOf } from './engine';
import { QUESTIONS, getQuestion } from './questions';
import type { Ctx, GameRec, PlayerRec, RoomState, RoundRec } from './state';
import { talkNotes } from './talk';

function personLookup(state: RoomState) {
  const map = new Map<string, PersonRef>();
  for (const k of state.kicked) map.set(k.id, { id: k.id, name: k.name, color: k.color });
  for (const p of state.players) map.set(p.id, { id: p.id, name: p.name, color: p.color });
  return (id: string): PersonRef => map.get(id) ?? { id, name: 'Unbekannt', color: '#888888' };
}

export function buildView(state: RoomState, meId: string | null, ctx: Ctx, version: number): RoomView {
  const me = meId ? state.players.find((p) => p.id === meId) ?? null : null;
  const g = state.game;
  const host = state.players.find((p) => p.id === state.hostId);
  const bonus = favoriteBonus(state);

  const playing = state.status === 'playing' && g ? g : null;
  const players: PlayerView[] = state.players.map((p) => {
    let done = false;
    if (playing) {
      if (playing.phase === 'write') done = Boolean(playing.round.bluffs[p.id]);
      if (playing.phase === 'vote') done = Boolean(playing.round.votes[p.id]);
    }
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      score: p.score + (bonus.get(p.id) ?? 0),
      online: isOnline(ctx, p.id),
      plays: p.plays,
      isHost: p.id === state.hostId,
      done,
      quiet: playing ? isQuiet(p, playing) : false,
    };
  });

  return {
    code: state.code,
    serverNow: ctx.now,
    version,
    status: state.status,
    me: me ? meView(state, me, playing) : null,
    hostId: state.hostId,
    locked: state.locked,
    paused: state.paused,
    settings: state.settings,
    hostPlays: host?.plays ?? true,
    players,
    round: g && (state.status === 'playing' || state.status === 'finished') ? buildRound(state, meId) : null,
    final: state.status === 'finished' ? buildFinal(state) : null,
    poolSize: QUESTIONS.length,
    freshCount: freshCount(state),
  };
}

function meView(state: RoomState, me: PlayerRec, playing: GameRec | null): MeView {
  let quiet: MeView['quiet'] = null;
  if (playing && me.quietRound !== undefined) {
    if (me.quietRound === playing.roundIndex) quiet = 'now';
    else if (me.quietRound === playing.roundIndex + 1) quiet = 'next';
  }
  return { id: me.id, name: me.name, color: me.color, isHost: me.id === state.hostId, plays: me.plays, quiet };
}

/** „Neues für alle“: Fragen, die in diesem Raum noch nicht vorkamen und die niemand hier kennt */
function freshCount(state: RoomState): number {
  const used = new Set(state.usedQuestionIds);
  const seen = state.seenCounts ?? {};
  return QUESTIONS.filter((q) => !used.has(q.id) && !seen[q.id]).length;
}

/**
 * Während der Punkte-Phase steht der Lieblingsbluff noch nicht fest: Die Sicht zeigt den
 * Extrapunkt schon an, gutgeschrieben wird er erst beim Weiterschalten (engine: settleFavorites).
 */
function favoriteBonus(state: RoomState): Map<string, number> {
  const bonus = new Map<string, number>();
  const g = state.game;
  if (state.status !== 'playing' || !g || g.phase !== 'scores') return bonus;
  for (const o of favoriteLeaders(g.round)) {
    for (const id of o.authorIds) if (state.players.some((p) => p.id === id)) bonus.set(id, POINTS_FAVORITE);
  }
  return bonus;
}

function buildFavorites(round: RoundRec, meId: string | null, person: (id: string) => PersonRef): FavoriteOptionView[] {
  const counts = likeCounts(round);
  const leading = new Set(favoriteLeaders(round).map((o) => o.id));
  return (round.options ?? [])
    .filter((o) => o.kind === 'player')
    .map((o) => ({
      optionId: o.id,
      text: o.text,
      authors: o.authorIds.map(person),
      likes: counts.get(o.id) ?? 0,
      mine: meId ? o.authorIds.includes(meId) : false,
      leading: leading.has(o.id),
    }));
}

function buildRound(state: RoomState, meId: string | null): RoundView {
  const g = state.game!;
  const round = g.round;
  const q = getQuestion(round.questionId);
  const phase = g.phase;
  const afterVote = phase === 'reveal' || phase === 'scores';
  const person = personLookup(state);
  const scores = phase === 'scores' && state.status === 'playing';
  const bonus = favoriteBonus(state);
  const gifts = round.gifts ?? {};
  const quietIds = new Set(state.players.filter((p) => p.quietRound === round.index).map((p) => p.id));

  return {
    index: g.roundIndex,
    total: g.questionIds.length,
    phase,
    phaseStartedAt: g.phaseStartedAt,
    deadline: g.deadline,
    question: { id: q.id, book: q.book, group: q.group, difficulty: q.difficulty, prompt: q.prompt },
    myBluff: meId ? round.bluffs[meId]?.text ?? null : null,
    mySuggestion: phase === 'write' && meId ? round.suggestions?.[meId] ?? null : null,
    options:
      phase === 'write' || !round.options
        ? null
        : round.options.map((o) => ({ id: o.id, text: o.text, mine: meId ? o.authorIds.includes(meId) : false })),
    myVote: meId ? round.votes[meId] ?? null : null,
    answer: afterVote ? { text: round.options?.find((o) => o.kind === 'truth')?.text ?? q.answer, ref: q.ref, discovery: q.discovery } : null,
    reveal:
      phase === 'reveal' && round.plan && round.revealStartedAt !== null
        ? { startedAt: round.revealStartedAt, steps: buildSteps(round, person, q.ref), total: planLength(round.plan) }
        : null,
    results:
      phase === 'scores' && round.results
        ? Object.entries(round.results).map(([playerId, r]) => ({
            playerId,
            truth: r.truth,
            bluff: r.bluff,
            foundTruth: r.foundTruth,
            fooled: r.fooled,
            favorite: bonus.get(playerId) ?? 0,
            giftsIn: Object.entries(gifts)
              .filter(([, to]) => to === playerId)
              .map(([from]) => person(from)),
            giftOut: gifts[playerId] ? person(gifts[playerId]) : null,
            quiet: quietIds.has(playerId),
          }))
        : null,
    favorites: scores ? buildFavorites(round, meId, person) : null,
    myLike: scores && meId ? round.likes?.[meId] ?? null : null,
    myGift: scores && meId ? gifts[meId] ?? null : null,
    // Spickzettel: nur die Spielleitung, erst nach der Auflösung
    talk: scores && meId !== null && meId === state.hostId ? talkNotes(q.id) : null,
  };
}

function buildSteps(round: RoundRec, person: (id: string) => PersonRef, ref: string): RevealStepView[] {
  const options = new Map((round.options ?? []).map((o) => [o.id, o]));
  const results = round.results ?? {};
  return (round.plan ?? []).map((step): RevealStepView => {
    switch (step.kind) {
      case 'intro':
        return { kind: 'intro', at: step.at, duration: step.duration };
      case 'bluff': {
        const o = options.get(step.optionId)!;
        const voters = votersOf(round, o.id);
        const counted = o.authorIds.filter((a) => results[a]);
        return {
          kind: 'bluff',
          at: step.at,
          duration: step.duration,
          optionId: o.id,
          text: o.text,
          voters: voters.map(person),
          authors: o.authorIds.map(person),
          pointsPerAuthor: counted.length ? voters.length : 0,
        };
      }
      case 'truth': {
        const o = options.get(step.optionId)!;
        return {
          kind: 'truth',
          at: step.at,
          duration: step.duration,
          optionId: o.id,
          text: o.text,
          voters: votersOf(round, o.id).map(person),
          ref,
        };
      }
      case 'rest':
        return {
          kind: 'rest',
          at: step.at,
          duration: step.duration,
          items: step.optionIds.map((id) => {
            const o = options.get(id)!;
            return { text: o.text, authors: o.authorIds.map(person) };
          }),
        };
    }
  });
}

function buildFinal(state: RoomState): FinalView {
  const g = state.game;
  const people = state.players.filter((p) => p.plays);
  const sorted = [...people].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
  const ranking = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    score: p.score,
    rank: 1 + sorted.filter((o) => o.score > p.score).length,
  }));

  const award = (key: AwardView['key'], title: string, text: string, pick: (p: (typeof people)[number]) => number) => {
    const best = Math.max(0, ...people.map(pick));
    if (best <= 0) return null;
    return {
      key,
      title,
      text,
      value: best,
      players: people.filter((p) => pick(p) === best).map((p) => ({ id: p.id, name: p.name, color: p.color })),
    } satisfies AwardView;
  };

  const awards = [
    award('bluffer', 'Bluff-Meister', 'am meisten Leute reingelegt', (p) => p.stats.fooled),
    award('finder', 'Wahrheitsfinder', 'am häufigsten die Wahrheit erkannt', (p) => p.stats.found),
    award('trusting', 'Gutgläubigste Seele', 'am öftesten auf Bluffs hereingefallen', (p) => p.stats.fellFor),
    favoriteAward(state),
    award('neighbor', 'Nächstenliebe', 'die meisten Punkte verschenkt', (p) => p.stats.gifted ?? 0),
  ].filter((a): a is AwardView => a !== null);

  const discoveries = (g?.history ?? []).map((h) => {
    const q = getQuestion(h.questionId);
    return { questionId: q.id, prompt: q.prompt, answer: q.answer, ref: q.ref, discovery: q.discovery, ...missStats(h) };
  });

  return { ranking, awards, discoveries, recapId: g?.recapId ?? null, talk: g ? buildTalk(g) : null };
}

/** Gespräch nach dem Spiel – für alle sichtbar, die Leitung führt durch die Schritte */
function buildTalk(g: GameRec): TalkView | null {
  if (!g.talk) return null;
  const entry = g.history.find((h) => h.questionId === g.talk!.questionId);
  if (!entry) return null;
  const q = getQuestion(entry.questionId);
  return {
    questionId: q.id,
    step: g.talk.step,
    book: q.book,
    group: q.group,
    prompt: q.prompt,
    answer: q.answer,
    ref: q.ref,
    discovery: q.discovery,
    notes: talkNotes(q.id),
    ...missStats(entry),
  };
}

/** Bester Bluff des Abends: die meisten Herzen in einer Runde; bei Gleichstand der frühere */
function favoriteAward(state: RoomState): AwardView | null {
  let best: { text: string; authorIds: string[]; likes: number } | null = null;
  for (const h of state.game?.history ?? []) {
    for (const f of h.favorites ?? []) if (!best || f.likes > best.likes) best = f;
  }
  if (!best) return null;
  const person = personLookup(state);
  return {
    key: 'favorite',
    title: 'Bester Bluff des Abends',
    text: 'die meisten Herzen bekommen',
    players: best.authorIds.map(person),
    value: best.likes,
    quote: best.text,
  };
}
