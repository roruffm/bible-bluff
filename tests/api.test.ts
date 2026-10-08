import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { MemoryStore } from '../src/server/store';
import type { RoomView, SessionResponse, ViewResponse } from '../src/shared/types';
import { Clock, seeded } from './helpers';

function setup() {
  const clock = new Clock();
  const store = new MemoryStore();
  const api = createApi({ store, now: () => clock.now, rng: seeded(11) });
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await api(
      new Request(`http://test${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return { status: res.status, body: (await res.json()) as any };
  };
  return { clock, store, call };
}

async function roomWithPlayers(t: ReturnType<typeof setup>, names: string[]) {
  const created = await t.call('POST', '/api/rooms', { name: names[0], settings: { rounds: 4 } });
  expect(created.status).toBe(201);
  const host = created.body as SessionResponse;
  const others: SessionResponse[] = [];
  for (const name of names.slice(1)) {
    const joined = await t.call('POST', `/api/rooms/${host.code.toLowerCase()}/join`, { name });
    expect(joined.status).toBe(200);
    others.push(joined.body as SessionResponse);
  }
  return { host, others, code: host.code };
}

describe('API', () => {
  it('eröffnet Räume mit lesbarem Code und gibt Token aus', async () => {
    const t = setup();
    const { host } = await roomWithPlayers(t, ['Rahel']);
    expect(host.code).toMatch(/^[A-Z]+[2-9]{1,2}$/);
    expect(host.token.length).toBeGreaterThan(20);
    expect(host.view.me).toMatchObject({ name: 'Rahel', isHost: true, plays: true });
    expect(host.view.settings.rounds).toBe(4);
  });

  it('liefert persönliche Sicht mit Token und neutrale Leinwand-Sicht ohne', async () => {
    const t = setup();
    const { host, others, code } = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    const mine = await t.call('GET', `/api/rooms/${code}`, undefined, others[0].token);
    expect((mine.body as ViewResponse).view.me!.name).toBe('Jonas');
    const tv = await t.call('GET', `/api/rooms/${code}`);
    expect((tv.body as ViewResponse).view.me).toBeNull();
    expect((tv.body as ViewResponse).view.players.map((p) => p.name)).toEqual(['Rahel', 'Jonas']);
    expect(host.view.players[0].online).toBe(true);
  });

  it('meldet unbekannte Räume, falsche Tokens und entfernte Personen verständlich', async () => {
    const t = setup();
    expect((await t.call('GET', '/api/rooms/NIRGENDS9')).status).toBe(404);
    const { host, others, code } = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    const bad = await t.call('POST', `/api/rooms/${code}/action`, { type: 'start' }, 'x'.repeat(32));
    expect(bad.status).toBe(401);
    const notHost = await t.call('POST', `/api/rooms/${code}/action`, { type: 'start' }, others[0].token);
    expect(notHost.status).toBe(403);
    await t.call('POST', `/api/rooms/${code}/action`, { type: 'kick', playerId: others[0].playerId }, host.token);
    const kicked = await t.call('GET', `/api/rooms/${code}`, undefined, others[0].token);
    expect(kicked.status).toBe(403);
    expect(kicked.body.error.code).toBe('kicked');
    const unknown = await t.call('POST', `/api/rooms/${code}/action`, { type: 'tanzen' }, host.token);
    expect(unknown.status).toBe(400);
  });

  it('verliert keine gleichzeitig abgegebenen Bluffs und Stimmen', async () => {
    const t = setup();
    const names = ['Rahel', 'Jonas', 'Mirjam', 'Tobias', 'Lea', 'Samuel', 'Hanna', 'Elias'];
    const { host, others, code } = await roomWithPlayers(t, names);
    const all = [host, ...others];
    await t.call('POST', `/api/rooms/${code}/action`, { type: 'start' }, host.token);
    // Alle zählen als online
    await Promise.all(all.map((p) => t.call('GET', `/api/rooms/${code}`, undefined, p.token)));

    const results = await Promise.all(
      all.map((p, i) => t.call('POST', `/api/rooms/${code}/action`, { type: 'bluff', text: `Erfindung Nummer ${i} von ${names[i]}` }, p.token)),
    );
    for (const r of results) expect(r.status).toBe(200);

    const after = (await t.call('GET', `/api/rooms/${code}`, undefined, host.token)).body.view as RoomView;
    expect(after.round!.phase).toBe('vote');
    expect(after.round!.options!.length).toBe(names.length + 1);

    const votes = await Promise.all(
      all.map((p) => {
        const option = after.round!.options!.find((o) => !o.text.includes(p.view.me!.name))!;
        return t.call('POST', `/api/rooms/${code}/action`, { type: 'vote', optionId: option.id }, p.token);
      }),
    );
    for (const v of votes) expect(v.status).toBe(200);
    const reveal = (await t.call('GET', `/api/rooms/${code}`, undefined, host.token)).body.view as RoomView;
    expect(reveal.round!.phase).toBe('reveal');
    expect(reveal.round!.reveal!.steps.length).toBeGreaterThan(1);
  });

  it('erlaubt den Wiedereinstieg unter dem eigenen Namen, wenn das Gerät gewechselt wurde', async () => {
    const t = setup();
    const { code, others } = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    const clash = await t.call('POST', `/api/rooms/${code}/join`, { name: 'jonas' });
    expect(clash.status).toBe(409);
    expect(clash.body.error.code).toBe('name_taken');

    t.clock.advance(60_000);
    const offline = await t.call('POST', `/api/rooms/${code}/join`, { name: 'Jonas' });
    expect(offline.body.error.code).toBe('name_offline');
    const reclaimed = await t.call('POST', `/api/rooms/${code}/join`, { name: 'Jonas', reclaim: true });
    expect(reclaimed.status).toBe(200);
    expect(reclaimed.body.playerId).toBe(others[0].playerId);
    // altes Token gilt nicht mehr
    expect((await t.call('GET', `/api/rooms/${code}`, undefined, others[0].token)).status).toBe(401);
  });

  it('liefert Bluff-Vorschläge nur der fragenden Person', async () => {
    const t = setup();
    const { host, others, code } = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    await t.call('POST', `/api/rooms/${code}/action`, { type: 'start' }, host.token);
    const res = await t.call('POST', `/api/rooms/${code}/action`, { type: 'suggest', n: 0 }, others[0].token);
    expect(res.status).toBe(200);
    expect(typeof res.body.suggestion).toBe('string');
    expect(res.body.view.round.myBluff).toBeNull();
  });

  it('weist zu große Anfragen ab', async () => {
    const t = setup();
    const res = await t.call('POST', '/api/rooms', { name: 'x'.repeat(10_000) });
    expect(res.status).toBe(413);
  });
});
