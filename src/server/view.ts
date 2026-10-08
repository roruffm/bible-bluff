// Gefilterte Sicht auf den Raum: Jede Person bekommt nur, was sie gerade sehen darf.
// Antworten, Bluff-Urheber und Stimmen bleiben bis zur Aufdeckung auf dem Server.

import type {
  AwardView,
  FinalView,
  PersonRef,
  PlayerView,
  RevealStepView,
  RoomView,
  RoundView,
} from '../shared/types';
import { isOnline, planLength, votersOf } from './engine';
import { QUESTIONS, getQuestion } from './questions';
import type { Ctx, RoomState, RoundRec } from './state';

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

  const players: PlayerView[] = state.players.map((p) => {
    let done = false;
    if (state.status === 'playing' && g) {
      if (g.phase === 'write') done = Boolean(g.round.bluffs[p.id]);
      if (g.phase === 'vote') done = Boolean(g.round.votes[p.id]);
    }
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      score: p.score,
      online: isOnline(ctx, p.id),
      plays: p.plays,
      isHost: p.id === state.hostId,
      done,
    };
  });

  return {
    code: state.code,
    serverNow: ctx.now,
    version,
    status: state.status,
    me: me
      ? { id: me.id, name: me.name, color: me.color, isHost: me.id === state.hostId, plays: me.plays }
      : null,
    hostId: state.hostId,
    locked: state.locked,
    paused: state.paused,
    settings: state.settings,
    hostPlays: host?.plays ?? true,
    players,
    round: g && (state.status === 'playing' || state.status === 'finished') ? buildRound(state, meId) : null,
    final: state.status === 'finished' ? buildFinal(state) : null,
    poolSize: QUESTIONS.length,
  };
}

function buildRound(state: RoomState, meId: string | null): RoundView {
  const g = state.game!;
  const round = g.round;
  const q = getQuestion(round.questionId);
  const phase = g.phase;
  const afterVote = phase === 'reveal' || phase === 'scores';
  const person = personLookup(state);

  return {
    index: g.roundIndex,
    total: g.questionIds.length,
    phase,
    phaseStartedAt: g.phaseStartedAt,
    deadline: g.deadline,
    question: { id: q.id, book: q.book, group: q.group, difficulty: q.difficulty, prompt: q.prompt },
    myBluff: meId ? round.bluffs[meId]?.text ?? null : null,
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
          }))
        : null,
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
  ].filter((a): a is AwardView => a !== null);

  const discoveries = (g?.history ?? []).map((h) => {
    const q = getQuestion(h.questionId);
    return { prompt: q.prompt, answer: q.answer, ref: q.ref, discovery: q.discovery };
  });

  return { ranking, awards, discoveries };
}
