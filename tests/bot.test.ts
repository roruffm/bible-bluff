import { describe, expect, it } from 'vitest';
import {
  BOT_NAME,
  BOT_ROOM_AWAY_MS,
  BOT_ROOM_CODE,
  BOT_ROOM_FINISHED_MS,
  BOT_ROOM_IDLE_MS,
  BOT_SETTINGS,
} from '../src/shared/rules';
import { BOT_ID, applyAction, createBotRoom, joinRoom, step, tick } from '../src/server/engine';
import { getQuestion } from '../src/server/questions';
import type { Ctx, RoomState } from '../src/server/state';
import { buildView, publicRoom } from '../src/server/view';
import { SAFE_BLUFFS } from '../e2e/bluffs';
import { Clock, seeded } from './helpers';

/** Bot-Raum mit Menschen; online sind Joseph und alle, die nicht ausdrücklich fehlen */
function setup(humans = ['Hanna']) {
  const clock = new Clock();
  const rng = seeded(3);
  const away = new Set<string>();
  const seenAt: Record<string, number> = {};
  const ids = humans.map((_, i) => `h${i}`);
  const ctx = (): Ctx => {
    for (const id of ids) if (!away.has(id)) seenAt[id] = clock.now;
    return { now: clock.now, rng, presence: { ...seenAt, [BOT_ID]: clock.now } };
  };
  let state = createBotRoom(BOT_ROOM_CODE, ctx());
  humans.forEach((name, i) => {
    state = joinRoom(state, { playerId: ids[i], name, tokenHash: `t-${ids[i]}` }, ctx()).state;
  });
  const g = {
    clock,
    ids,
    away,
    ctx,
    get state() {
      return state;
    },
    set state(s: RoomState) {
      state = s;
    },
    act(actor: string, action: Parameters<typeof applyAction>[2]) {
      state = step(state, actor, action, ctx()).state;
      return state;
    },
    run() {
      state = tick(state, ctx()) ?? state;
      return state;
    },
  };
  return g;
}

/** Bluffs, die für keine Frage zu nah an der Wahrheit sind (geprüft in questions.test.ts) */
const bluffFor = (_state: RoomState) => SAFE_BLUFFS.host;

describe('Joseph im Dauerraum', () => {
  it('wartet als Leitung im öffentlichen Raum, und Menschen dürfen starten', () => {
    const g = setup();
    expect(g.state.hostId).toBe(BOT_ID);
    expect(g.state.listed).toBe(true);
    expect(g.state.settings).toEqual(BOT_SETTINGS);
    const view = buildView(g.state, 'h0', g.ctx(), 1);
    expect(view.botRoom).toBe(true);
    expect(view.players.find((p) => p.bot)).toMatchObject({ name: BOT_NAME, online: true, isHost: true });
    expect(publicRoom(g.state, g.ctx())).toMatchObject({ code: BOT_ROOM_CODE, bot: BOT_NAME, people: 2, status: 'lobby' });

    // Leiten im Sinne von Sperren, Entfernen, Schließen bleibt Joseph vorbehalten
    for (const action of [
      { type: 'lock', locked: true },
      { type: 'listed', listed: false },
      { type: 'close' },
      { type: 'kick', playerId: BOT_ID },
      { type: 'settings', settings: { rounds: 4 } },
    ] as const) {
      expect(() => g.act('h0', action)).toThrowError(expect.objectContaining({ code: 'not_host' }));
    }

    g.act('h0', { type: 'start' });
    expect(g.state.status).toBe('playing');
    expect(g.state.game!.questionIds).toHaveLength(BOT_SETTINGS.rounds);
  });

  it('schreibt nach kurzer Bedenkzeit einen Bluff und stimmt ab', () => {
    const g = setup();
    g.act('h0', { type: 'start' });
    g.clock.advance(2000);
    g.run();
    expect(g.state.game!.round.bluffs[BOT_ID]).toBeUndefined();

    g.clock.advance(19_000);
    g.run();
    const bluff = g.state.game!.round.bluffs[BOT_ID];
    expect(bluff?.text).toBeTruthy();
    expect(getQuestion(g.state.game!.round.questionId).bluffs.map((b) => b.toLowerCase())).toContain(bluff!.text.toLowerCase());

    // Sobald der Mensch fertig ist, geht es sofort weiter
    g.act('h0', { type: 'bluff', text: bluffFor(g.state) });
    expect(g.state.game!.phase).toBe('vote');
    const mine = g.state.game!.round.options!.find((o) => o.authorIds.includes('h0'))!;
    const other = g.state.game!.round.options!.find((o) => o.id !== mine.id && !o.authorIds.includes('h0'))!;
    g.act('h0', { type: 'vote', optionId: other.id });
    // Joseph stimmt sofort mit ab, also beginnt die Aufdeckung
    expect(g.state.game!.phase).toBe('reveal');
    const josephVote = g.state.game!.round.votes[BOT_ID];
    const chosen = g.state.game!.round.options!.find((o) => o.id === josephVote)!;
    expect(chosen.authorIds).not.toContain(BOT_ID);
  });

  it('wartet nie auf sich selbst: Wer sofort abgibt, muss nicht auf Joseph warten', () => {
    const g = setup(['Hanna', 'Lea']);
    g.act('h0', { type: 'start' });
    g.act('h0', { type: 'bluff', text: bluffFor(g.state) });
    expect(g.state.game!.phase).toBe('write');
    g.act('h1', { type: 'bluff', text: SAFE_BLUFFS.mirjam });
    expect(g.state.game!.phase).toBe('vote');
    expect(Object.keys(g.state.game!.round.bluffs)).toContain(BOT_ID);
  });

  it('spielt eine ganze Partie mit; Menschen schalten weiter und beginnen neu', () => {
    const g = setup();
    g.act('h0', { type: 'start' });
    for (let round = 0; round < BOT_SETTINGS.rounds; round++) {
      g.act('h0', { type: 'bluff', text: bluffFor(g.state) });
      const pick = g.state.game!.round.options!.find((o) => !o.authorIds.includes('h0'))!;
      g.act('h0', { type: 'vote', optionId: pick.id });
      expect(g.state.game!.phase).toBe('reveal');
      g.clock.advance(60_000);
      g.run();
      expect(g.state.game!.phase).toBe('scores');
      // Joseph verteilt nach kurzer Zeit ein Herz an den Bluff des Menschen
      g.clock.advance(8000);
      g.run();
      const liked = g.state.game!.round.options!.find((o) => o.id === g.state.game!.round.likes?.[BOT_ID]);
      expect(liked?.authorIds).toContain('h0');
      g.act('h0', { type: 'next' });
    }
    expect(g.state.status).toBe('finished');
    const joseph = g.state.players.find((p) => p.id === BOT_ID)!;
    expect(joseph.stats.found + joseph.stats.fellFor).toBe(BOT_SETTINGS.rounds);
    g.act('h0', { type: 'playAgain' });
    expect(g.state.status).toBe('lobby');
  });

  it('räumt sich selbst auf: verlassene Partien, Endstand, Abwesende', () => {
    const g = setup(['Hanna', 'Lea']);
    g.act('h0', { type: 'start' });
    g.away.add('h0').add('h1');
    g.clock.advance(BOT_ROOM_IDLE_MS + 1000);
    g.run();
    expect(g.state.status).toBe('lobby');
    expect(g.state.players).toHaveLength(3);

    // Lea kommt zurück, Hanna bleibt weg und verlässt den Raum nach einer Weile automatisch
    g.away.delete('h1');
    g.clock.advance(BOT_ROOM_AWAY_MS);
    g.run();
    expect(g.state.players.map((p) => p.id)).toEqual([BOT_ID, 'h1']);

    // Nach dem Endstand wartet Joseph wieder auf eine neue Partie
    g.state = { ...g.state, status: 'finished', game: { ...g.state.game!, finishedAt: g.clock.now } } as RoomState;
    g.state.game = g.state.game ?? null;
    g.clock.advance(BOT_ROOM_FINISHED_MS + 1000);
    g.run();
    expect(g.state.status).toBe('lobby');

    // Alle weg: Raum wieder wie neu
    g.away.add('h1');
    g.clock.advance(BOT_ROOM_AWAY_MS + 1000);
    g.run();
    expect(g.state.players.map((p) => p.id)).toEqual([BOT_ID]);
    expect(publicRoom(g.state, g.ctx())).toMatchObject({ people: 1, status: 'lobby', bot: BOT_NAME });
  });

  it('lässt sich nicht als Joseph ausgeben', () => {
    const g = setup();
    expect(() => joinRoom(g.state, { playerId: 'x', name: 'joseph', tokenHash: 't-x' }, g.ctx())).toThrowError(
      expect.objectContaining({ code: 'name_taken' }),
    );
  });
});
