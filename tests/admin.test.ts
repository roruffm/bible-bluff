import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { QUESTIONS, getQuestion } from '../src/server/questions';
import { MemoryStore } from '../src/server/store';
import type { BluffCandidateView, RoomView, SessionResponse } from '../src/shared/types';
import { Clock, seeded } from './helpers';

const KEY = 'test-schluessel-fuer-die-freigabe';

function setup(adminKey: string | null = KEY) {
  const clock = new Clock();
  const store = new MemoryStore();
  const api = createApi({ store, now: () => clock.now, rng: seeded(21), adminKey: adminKey ?? undefined });
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
  return { clock, store, call };
}

const BLUFFS = ['Ein Tukan im Iglu', 'Viele Kakteen am Nordpol', 'Ein Pinguin im Kino'];

/** Partie mit vier Fragen über die API; in Runde 1 fallen Jonas und Mirjam auf Rahels Bluff herein. */
async function playGame(t: ReturnType<typeof setup>) {
  const host = (await t.call('POST', '/api/rooms', { name: 'Rahel', settings: { rounds: 4 } })).body as SessionResponse;
  const code = host.code;
  const players = [host];
  for (const name of ['Jonas', 'Mirjam']) players.push((await t.call('POST', `/api/rooms/${code}/join`, { name })).body);
  const view = async (p: SessionResponse) => (await t.call('GET', `/api/rooms/${code}`, undefined, p.token)).body.view as RoomView;
  const act = (p: SessionResponse, action: unknown) => t.call('POST', `/api/rooms/${code}/action`, action, p.token);

  await act(host, { type: 'start' });
  let firstQuestion = '';
  for (let r = 0; r < 4; r++) {
    for (const [i, p] of players.entries()) {
      const res = await act(p, { type: 'bluff', text: `${BLUFFS[i]} ${['Ahoi', 'Moin', 'Servus', 'Tschüss'][r]}` });
      expect(res.status, JSON.stringify(res.body.error)).toBe(200);
    }
    const options = (await view(host)).round!.options!;
    if (r === 0) firstQuestion = (await view(host)).round!.question.id;
    const rahels = options.find((o) => o.text.startsWith(BLUFFS[0]))!;
    for (const p of players) {
      const own = (await view(p)).round!.options!;
      const pick = r === 0 && p !== host ? rahels.id : own.find((o) => !o.mine && o.id !== rahels.id)!.id;
      await act(p, { type: 'vote', optionId: pick });
    }
    const reveal = await view(host);
    t.clock.advance(reveal.round!.deadline! - reveal.serverNow + 1);
    for (const p of players) await view(p);
    await act(host, { type: 'next' });
  }
  expect((await view(host)).status).toBe('finished');
  return { code, players, firstQuestion };
}

describe('Frische Hausbluffs: Freigabe', () => {
  it('ist ohne eingerichteten Schlüssel abgeschaltet und prüft den Schlüssel', async () => {
    const off = setup(null);
    expect((await off.call('GET', '/api/admin/bluffs', undefined, KEY)).body.error.code).toBe('admin_off');
    const t = setup();
    expect((await t.call('GET', '/api/admin/bluffs')).status).toBe(401);
    expect((await t.call('GET', '/api/admin/bluffs', undefined, 'falscher-schluessel-0000')).status).toBe(401);
    const ok = await t.call('GET', '/api/admin/bluffs', undefined, KEY);
    expect(ok.status).toBe(200);
    expect(ok.body.items).toEqual([]);
  });

  it('sammelt starke Bluffs nach der Partie und gibt sie nach Prüfung frei', async () => {
    const t = setup();
    const { firstQuestion } = await playGame(t);
    const list = await t.call('GET', '/api/admin/bluffs?status=new', undefined, KEY);
    const items = list.body.items as BluffCandidateView[];
    const mine = items.find((i) => i.text.startsWith(BLUFFS[0]))!;
    expect(mine).toMatchObject({ questionId: firstQuestion, fooled: 2, likes: 0, times: 1, status: 'new' });
    expect(mine.question!.answer).toBe(getQuestion(firstQuestion).answer);
    expect(mine.question!.houseBluffs).toEqual(getQuestion(firstQuestion).bluffs);
    // Keine Namen gespeichert
    expect(JSON.stringify(items)).not.toMatch(/Rahel|Jonas|Mirjam/);

    const decide = (body: Record<string, unknown>) =>
      t.call('POST', '/api/admin/bluffs', { questionId: mine.questionId, key: mine.key, ...body }, KEY);
    expect((await decide({ status: 'approved', text: getQuestion(firstQuestion).answer })).body.error.code).toBe('too_close');
    expect((await decide({ status: 'approved', text: getQuestion(firstQuestion).bluffs[0] })).body.error.code).toBe('duplicate');
    expect((await decide({ status: 'bogus', text: mine.text })).status).toBe(400);
    expect((await t.call('POST', '/api/admin/bluffs', { questionId: mine.questionId, key: 'gibt-es-nicht', status: 'approved', text: mine.text }, KEY)).status).toBe(404);

    const ok = await decide({ status: 'approved', text: `${mine.text}!` });
    expect(ok.status).toBe(200);
    expect(await t.store.approvedBluffs()).toEqual({ [firstQuestion]: [mine.text] });
    const approved = (await t.call('GET', '/api/admin/bluffs?status=approved', undefined, KEY)).body.items as BluffCandidateView[];
    expect(approved.map((i) => i.text)).toEqual([mine.text]);

    // Derselbe Bluff in einer weiteren Partie zählt hoch und bleibt freigegeben
    await t.store.addBluffCandidates([{ questionId: mine.questionId, key: mine.key, text: mine.text, fooled: 3, likes: 1 }], t.clock.now);
    const again = (await t.call('GET', '/api/admin/bluffs?status=approved', undefined, KEY)).body.items[0] as BluffCandidateView;
    expect(again).toMatchObject({ fooled: 5, likes: 1, times: 2, status: 'approved' });
  });
});

describe('Neues für alle über die API', () => {
  it('übernimmt beim Eröffnen und Beitreten gemeldete Fragen in die Lobby-Anzeige', async () => {
    const t = setup();
    const ids = QUESTIONS.slice(0, 6).map((q) => q.id);
    const created = (await t.call('POST', '/api/rooms', { name: 'Rahel', seen: ids.slice(0, 4) })).body as SessionResponse;
    expect(created.view.freshCount).toBe(QUESTIONS.length - 4);
    const joined = (await t.call('POST', `/api/rooms/${created.code}/join`, { name: 'Jonas', seen: ids.slice(2) })).body as SessionResponse;
    expect(joined.view.freshCount).toBe(QUESTIONS.length - 6);
  });
});
