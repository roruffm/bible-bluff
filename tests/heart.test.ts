import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { applyAction, createRoom, joinRoom, sanitizeSettings, step, tick } from '../src/server/engine';
import { MemoryStore } from '../src/server/store';
import { buildRecap } from '../src/server/recap';
import type { RoomState } from '../src/server/state';
import { buildView } from '../src/server/view';
import { HEART_MAX, HEART_QUESTIONS, HEART_SECONDS, HEART_SHOW_SECONDS, heartRoundAhead } from '../src/shared/rules';
import type { Settings } from '../src/shared/types';
import { Clock, ctxFor, seeded } from './helpers';

const IDS = ['host', 'anna', 'ben'];

function setup(opts: { names?: string[]; settings?: Partial<Settings>; withBot?: boolean } = {}) {
  const names = opts.names ?? ['Host', 'Anna', 'Ben'];
  const clock = new Clock();
  const rng = seeded(11);
  const online = () => [...IDS.slice(0, names.length), 'bot-joseph'];
  const ctx = () => ctxFor(clock, online(), rng);
  let state: RoomState = createRoom(
    { code: 'HERZ7', hostId: 'host', hostName: names[0], tokenHash: 'h-host', plays: true, settings: { rounds: 4, ...opts.settings }, withBot: opts.withBot },
    ctx(),
  );
  for (let i = 1; i < names.length; i++) {
    state = joinRoom(state, { playerId: IDS[i], name: names[i], tokenHash: `h-${IDS[i]}` }, ctx()).state;
  }
  const g = {
    clock,
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
    view(id: string | null) {
      return buildView(state, id, ctx(), 1);
    },
    /** Alle Spielrunden über die Leitung durchschalten, bis die Partie die letzte Runde hinter sich hat */
    playRounds() {
      if (state.status === 'lobby') g.act('host', { type: 'start' });
      for (let guard = 0; guard < 40 && state.status === 'playing' && !state.game!.phase.startsWith('heart'); guard++) {
        g.act('host', { type: 'skipPhase' });
      }
      return state;
    },
  };
  return g;
}

describe('Herzensrunde', () => {
  it('ist beim Eröffnen eingeschaltet und lässt sich ausschalten; mit Joseph ist sie aus', () => {
    expect(setup().state.settings.heartRound).toBe(true);
    expect(setup({ settings: { heartRound: false } }).state.settings.heartRound).toBe(false);
    expect(() => sanitizeSettings({ heartRound: 'ja' as unknown as boolean })).toThrowError(expect.objectContaining({ code: 'bad_settings' }));
    const g = setup();
    g.act('host', { type: 'settings', settings: { heartRound: false } });
    expect(g.state.settings.heartRound).toBe(false);
  });

  it('folgt auf die letzte Runde – erst danach kommt der Endstand', () => {
    const g = setup();
    g.playRounds();
    const game = g.state.game!;
    expect(g.state.status).toBe('playing');
    expect(game.phase).toBe('heart');
    expect(game.history).toHaveLength(4);
    expect(game.deadline).toBe(g.clock.now + HEART_SECONDS * 1000);
    const view = g.view('anna');
    expect(view.heart).toMatchObject({ phase: 'write', mine: null, canSwap: true, answers: null });
    expect(HEART_QUESTIONS).toContain(view.heart!.question);
    expect(view.final).toBeNull();
  });

  it('nimmt ehrliche Antworten an – oder „Diesmal nicht“ – und prüft sie', () => {
    const g = setup();
    g.playRounds();
    expect(() => g.act('anna', { type: 'heart', text: '   ' })).toThrowError(expect.objectContaining({ code: 'empty' }));
    expect(() => g.act('anna', { type: 'heart', text: 'x'.repeat(HEART_MAX + 1) })).toThrowError(expect.objectContaining({ code: 'too_long' }));
    g.act('anna', { type: 'heart', text: '  Dass er  Zachäus zuerst gesehen hat. ' });
    g.act('ben', { type: 'heart', text: null });
    expect(g.view('anna').heart!.mine).toEqual({ text: 'Dass er Zachäus zuerst gesehen hat.' });
    expect(g.view('ben').heart!.mine).toEqual({ text: null });
    // Fertig ist fertig – ob geschrieben oder ausgesetzt, verrät die Sicht nicht
    const done = Object.fromEntries(g.view('host').players.map((p) => [p.id, p.done]));
    expect(done).toEqual({ host: false, anna: true, ben: true });
    // Ändern geht, solange geschrieben wird
    g.act('anna', { type: 'heart', text: 'Dass er Zachäus beim Namen gerufen hat.' });
    expect(g.view('anna').heart!.mine!.text).toBe('Dass er Zachäus beim Namen gerufen hat.');
  });

  it('zeigt die Antworten gemischt und ohne Namen, sobald alle fertig sind – und vergisst, wer was schrieb', () => {
    const g = setup();
    g.playRounds();
    g.act('anna', { type: 'heart', text: 'Dass er Zeit für Kinder hatte.' });
    g.act('ben', { type: 'heart', text: null });
    expect(g.state.game!.phase).toBe('heart');
    g.act('host', { type: 'heart', text: 'Dass er Petrus nicht aufgegeben hat.' });
    const game = g.state.game!;
    expect(game.phase).toBe('heartShow');
    expect(game.heart!.answers).toEqual({});
    expect([...game.heart!.shown!].sort()).toEqual(['Dass er Petrus nicht aufgegeben hat.', 'Dass er Zeit für Kinder hatte.']);
    const view = g.view('ben');
    expect(view.heart).toMatchObject({ phase: 'show', mine: null, canSwap: false });
    expect([...view.heart!.answers!].sort()).toEqual([...game.heart!.shown!].sort());
    // Nirgends in der Sicht steht, wer was geschrieben hat
    expect(JSON.stringify(view.heart)).not.toMatch(/anna|host|Anna|Host/);
  });

  it('endet mit dem Endstand; die Antworten sind danach nicht mehr gespeichert und fehlen im Rückblick', () => {
    const g = setup();
    g.playRounds();
    g.act('anna', { type: 'heart', text: 'Ganz persönlicher Gedanke' });
    g.act('host', { type: 'skipPhase' });
    expect(g.state.game!.phase).toBe('heartShow');
    expect(() => g.act('anna', { type: 'next' })).toThrowError(expect.objectContaining({ code: 'not_host' }));
    g.act('host', { type: 'next' });
    expect(g.state.status).toBe('finished');
    expect(g.state.game!.heart).toBeNull();
    expect(JSON.stringify(g.state)).not.toContain('Ganz persönlicher Gedanke');
    expect(JSON.stringify(buildRecap(g.state, 'abcdefghjk'))).not.toContain('Ganz persönlicher Gedanke');
    expect(g.view('anna').heart).toBeNull();
    expect(g.view('anna').final!.ranking).toHaveLength(3);
  });

  it('läuft auch ohne Zutun weiter: nach der Schreibzeit zeigen, nach einer Weile zum Endstand', () => {
    const g = setup();
    g.playRounds();
    g.act('anna', { type: 'heart', text: 'Danke für diesen Abend' });
    g.clock.advance(HEART_SECONDS * 1000);
    g.run();
    expect(g.state.game!.phase).toBe('heartShow');
    expect(g.state.game!.heart!.shown).toEqual(['Danke für diesen Abend']);
    g.clock.advance(HEART_SHOW_SECONDS * 1000);
    g.run();
    expect(g.state.status).toBe('finished');
  });

  it('lässt die Leitung die Frage wechseln, solange noch niemand fertig ist', () => {
    const g = setup();
    g.playRounds();
    const first = g.state.game!.heart!.question;
    expect(() => g.act('anna', { type: 'heartSwap' })).toThrowError(expect.objectContaining({ code: 'not_host' }));
    g.clock.advance(30_000);
    g.act('host', { type: 'heartSwap' });
    expect(g.state.game!.heart!.question).toBe((first + 1) % HEART_QUESTIONS.length);
    expect(g.state.game!.deadline).toBe(g.clock.now + HEART_SECONDS * 1000);
    g.act('ben', { type: 'heart', text: null });
    expect(g.view('host').heart!.canSwap).toBe(false);
    expect(() => g.act('host', { type: 'heartSwap' })).toThrowError(expect.objectContaining({ code: 'bad_state' }));
  });

  it('wartet nicht auf alle, die gegangen sind, und nimmt deren Antwort mit', () => {
    const g = setup();
    g.playRounds();
    g.act('ben', { type: 'heart', text: 'Ich gehe gleich' });
    g.act('ben', { type: 'leave' });
    expect(g.state.game!.heart!.answers.ben).toBeUndefined();
    g.act('anna', { type: 'heart', text: null });
    g.act('host', { type: 'heart', text: null });
    expect(g.state.game!.phase).toBe('heartShow');
    expect(g.state.game!.heart!.shown).toEqual([]);
  });

  it('macht aus einer ruhigen Minute in der letzten Runde keine Ausnahme: Alle dürfen mitschreiben', () => {
    const g = setup();
    g.act('host', { type: 'start' });
    for (let i = 0; i < 12 && g.state.game!.roundIndex < 3; i++) g.act('host', { type: 'skipPhase' });
    g.act('anna', { type: 'quiet', on: true });
    expect(g.state.players.find((p) => p.id === 'anna')!.quietRound).toBe(3);
    g.playRounds();
    expect(g.state.game!.phase).toBe('heart');
    expect(g.state.players.find((p) => p.id === 'anna')!.quietRound).toBeUndefined();
    g.act('anna', { type: 'heart', text: 'Ich war gerade beim Beten.' });
    expect(() => g.act('ben', { type: 'quiet', on: true })).toThrowError(expect.objectContaining({ code: 'last_round' }));
  });

  it('entfällt, wenn sie ausgeschaltet ist oder nur ein Mensch mitspielt', () => {
    const off = setup({ settings: { heartRound: false } });
    off.playRounds();
    expect(off.state.status).toBe('finished');

    // Allein mit Joseph: „ohne Namen“ ergäbe keinen Sinn
    const solo = setup({ names: ['Host'], withBot: true, settings: { heartRound: true } });
    expect(heartRoundAhead(solo.state.settings, solo.state.players)).toBe(false);
    solo.playRounds();
    expect(solo.state.status).toBe('finished');
  });

  it('nimmt nur Antworten von Mitspielenden an, nicht von einer Leitung, die nur zuschaut', () => {
    const g = setup();
    g.act('host', { type: 'settings', hostPlays: false });
    g.playRounds();
    expect(g.state.game!.phase).toBe('heart');
    expect(() => g.act('host', { type: 'heart', text: 'Hallo' })).toThrowError(expect.objectContaining({ code: 'not_playing' }));
    g.act('anna', { type: 'heart', text: 'A' });
    g.act('ben', { type: 'heart', text: 'B' });
    expect(g.state.game!.phase).toBe('heartShow');
  });
});

describe('Herzensrunde über die Schnittstelle', () => {
  it('nimmt Antworten und den Fragenwechsel als Aktionen an', async () => {
    const clock = new Clock();
    const api = createApi({ store: new MemoryStore(), now: () => clock.now, rng: seeded(5) });
    const call = async (method: string, path: string, body?: unknown, token?: string) => {
      const res = await api(
        new Request(`http://test${path}`, {
          method,
          headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      );
      return { status: res.status, body: (await res.json()) as any };
    };
    const host = (await call('POST', '/api/rooms', { name: 'Rahel', settings: { rounds: 4 } })).body;
    const anna = (await call('POST', `/api/rooms/${host.code}/join`, { name: 'Anna' })).body;
    const act = (who: { token: string }, action: unknown) => call('POST', `/api/rooms/${host.code}/action`, action, who.token);
    expect((await act(host, { type: 'start' })).status).toBe(200);
    let phase = '';
    for (let i = 0; i < 30 && phase !== 'heart'; i++) {
      const res = await act(host, { type: 'skipPhase' });
      phase = res.body.view.round.phase;
    }
    expect(phase).toBe('heart');
    expect((await act(host, { type: 'heartSwap' })).status).toBe(200);
    const res = await act(anna, { type: 'heart', text: 'Danke für diese Runde' });
    expect(res.status).toBe(200);
    expect(res.body.view.heart.mine).toEqual({ text: 'Danke für diese Runde' });
    const shown = await act(host, { type: 'heart', text: null });
    expect(shown.body.view.heart).toMatchObject({ phase: 'show', answers: ['Danke für diese Runde'] });
  });
});
