import { describe, expect, it } from 'vitest';
import { SAFE_BLUFFS } from '../e2e/bluffs';
import { BOT_COLOR, BOT_NAME, BOT_SETTINGS } from '../src/shared/rules';
import { BOT_ID, applyAction, createRoom, joinRoom, step, tick } from '../src/server/engine';
import { getQuestion } from '../src/server/questions';
import type { Ctx, RoomState } from '../src/server/state';
import { buildView, publicRoom } from '../src/server/view';
import { Clock, seeded } from './helpers';

/** Eigener Raum mit Joseph; online sind Joseph und alle Menschen */
function setup(guests: string[] = []) {
  const clock = new Clock();
  const rng = seeded(3);
  const ids = ['host', ...guests.map((_, i) => `g${i}`)];
  const ctx = (): Ctx => ({ now: clock.now, rng, presence: Object.fromEntries([...ids, BOT_ID].map((id) => [id, clock.now])) });
  let state = createRoom(
    { code: 'LAMPE7', hostId: 'host', hostName: 'Hanna', tokenHash: 't-host', plays: true, settings: BOT_SETTINGS, withBot: true },
    ctx(),
  );
  guests.forEach((name, i) => {
    state = joinRoom(state, { playerId: `g${i}`, name, tokenHash: `t-g${i}` }, ctx()).state;
  });
  return {
    clock,
    ctx,
    get state() {
      return state;
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
}

describe('Joseph spielt mit', () => {
  it('sitzt im eigenen Raum der Person, die ihn eröffnet – privat und von ihr geleitet', () => {
    const g = setup();
    expect(g.state.hostId).toBe('host');
    expect(g.state.listed).toBe(false);
    expect(g.state.settings).toEqual(BOT_SETTINGS);
    const view = buildView(g.state, 'host', g.ctx(), 1);
    expect(view.players.map((p) => [p.name, p.bot, p.online])).toEqual([
      ['Hanna', false, true],
      [BOT_NAME, true, true],
    ]);
    // Immer dieselbe Farbe, damit die Startseite ihn genauso zeigt wie im Raum
    expect(g.state.players.find((p) => p.id === BOT_ID)!.color).toBe(BOT_COLOR);
    expect(publicRoom(g.state, g.ctx())).toBeNull();
    g.act('host', { type: 'start' });
    expect(g.state.status).toBe('playing');
    expect(g.state.game!.questionIds).toHaveLength(BOT_SETTINGS.rounds);
  });

  it('schreibt nach kurzer Bedenkzeit einen Bluff und stimmt ab', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    g.clock.advance(2000);
    g.run();
    expect(g.state.game!.round.bluffs[BOT_ID]).toBeUndefined();

    g.clock.advance(19_000);
    g.run();
    const bluff = g.state.game!.round.bluffs[BOT_ID];
    expect(bluff?.text).toBeTruthy();
    expect(getQuestion(g.state.game!.round.questionId).bluffs.map((b) => b.toLowerCase())).toContain(bluff!.text.toLowerCase());

    // Sobald der Mensch fertig ist, geht es sofort weiter
    g.act('host', { type: 'bluff', text: SAFE_BLUFFS.host });
    expect(g.state.game!.phase).toBe('vote');
    const other = g.state.game!.round.options!.find((o) => !o.authorIds.includes('host'))!;
    g.act('host', { type: 'vote', optionId: other.id });
    // Joseph stimmt sofort mit ab, also beginnt die Aufdeckung
    expect(g.state.game!.phase).toBe('reveal');
    const chosen = g.state.game!.round.options!.find((o) => o.id === g.state.game!.round.votes[BOT_ID])!;
    expect(chosen.authorIds).not.toContain(BOT_ID);
  });

  it('lässt niemanden warten: Wer sofort abgibt, muss nicht auf Joseph warten', () => {
    const g = setup(['Lea']);
    g.act('host', { type: 'start' });
    g.act('host', { type: 'bluff', text: SAFE_BLUFFS.host });
    expect(g.state.game!.phase).toBe('write');
    g.act('g0', { type: 'bluff', text: SAFE_BLUFFS.mirjam });
    expect(g.state.game!.phase).toBe('vote');
    expect(Object.keys(g.state.game!.round.bluffs)).toContain(BOT_ID);
  });

  it('spielt eine ganze Partie mit und verteilt Herzen', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    for (let round = 0; round < BOT_SETTINGS.rounds; round++) {
      g.act('host', { type: 'bluff', text: SAFE_BLUFFS.host });
      const pick = g.state.game!.round.options!.find((o) => !o.authorIds.includes('host'))!;
      g.act('host', { type: 'vote', optionId: pick.id });
      expect(g.state.game!.phase).toBe('reveal');
      g.clock.advance(60_000);
      g.run();
      expect(g.state.game!.phase).toBe('scores');
      // Joseph verteilt nach kurzer Zeit ein Herz an den Bluff des Menschen
      g.clock.advance(8000);
      g.run();
      const liked = g.state.game!.round.options!.find((o) => o.id === g.state.game!.round.likes?.[BOT_ID]);
      expect(liked?.authorIds).toContain('host');
      g.act('host', { type: 'next' });
    }
    expect(g.state.status).toBe('finished');
    const joseph = g.state.players.find((p) => p.id === BOT_ID)!;
    expect(joseph.stats.found + joseph.stats.fellFor).toBe(BOT_SETTINGS.rounds);
    g.act('host', { type: 'playAgain' });
    expect(g.state.status).toBe('lobby');
  });

  it('kann nie leiten: keine Übergabe an Joseph, und ohne Menschen schließt der Raum', () => {
    const g = setup(['Lea']);
    expect(() => g.act('host', { type: 'makeHost', playerId: BOT_ID })).toThrowError(
      expect.objectContaining({ code: 'bad_target' }),
    );
    // Die Leitung geht beim Verlassen an Lea, nicht an Joseph
    g.act('host', { type: 'leave' });
    expect(g.state.hostId).toBe('g0');
    g.act('g0', { type: 'leave' });
    expect(g.state.status).toBe('closed');
  });

  it('lässt sich nicht als Joseph ausgeben', () => {
    const g = setup();
    expect(() => joinRoom(g.state, { playerId: 'x', name: 'joseph', tokenHash: 't-x' }, g.ctx())).toThrowError(
      expect.objectContaining({ code: 'name_taken' }),
    );
  });

  it('blendet den früheren gemeinsamen Joseph-Raum aus der Liste aus', () => {
    const g = setup();
    const legacy = { ...g.state, code: 'JOSEPH', listed: true, botRoom: true } as RoomState;
    expect(publicRoom(legacy, g.ctx())).toBeNull();
  });
});
