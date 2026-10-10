import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { MemoryStore } from '../src/server/store';
import { BOT_NAME, BOT_ROOM_CODE, LISTED_ALIVE_MS } from '../src/shared/rules';
import type { PublicRoom, RoomView, SessionResponse, ViewResponse } from '../src/shared/types';
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
    const res = await t.call('POST', `/api/rooms/${code}/action`, { type: 'suggest' }, others[0].token);
    expect(res.status).toBe(200);
    expect(typeof res.body.suggestion).toBe('string');
    expect(res.body.view.round.myBluff).toBeNull();
    expect(res.body.view.round.mySuggestion).toBe(res.body.suggestion);
    // Ein Vorschlag pro Runde – auch alte Clients, die weiterzählen, bekommen denselben
    const again = await t.call('POST', `/api/rooms/${code}/action`, { type: 'suggest', n: 5 }, others[0].token);
    expect(again.body.suggestion).toBe(res.body.suggestion);
    const hostView = (await t.call('GET', `/api/rooms/${code}`, undefined, host.token)).body.view;
    expect(hostView.round.mySuggestion).toBeNull();
  });

  it('weist zu große Anfragen ab', async () => {
    const t = setup();
    const res = await t.call('POST', '/api/rooms', { name: 'x'.repeat(10_000) });
    expect(res.status).toBe(413);
  });
});

describe('Öffentliche Räume', () => {
  /** Räume der Menschen auf der Startseite (ohne Josephs Dauerraum) – nach Ablauf des Zwischenspeichers */
  async function publicList(t: ReturnType<typeof setup>) {
    t.clock.advance(5000);
    const res = await t.call('GET', '/api/rooms');
    expect(res.status).toBe(200);
    return (res.body.rooms as PublicRoom[]).filter((r) => !r.bot);
  }
  const act = (t: ReturnType<typeof setup>, code: string, token: string, action: unknown) =>
    t.call('POST', `/api/rooms/${code}/action`, action, token);

  it('zeigt Räume erst, wenn die Leitung sie freigibt – und ohne Namen', async () => {
    const t = setup();
    const { host, others, code } = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    expect(await publicList(t)).toEqual([]);

    const denied = await act(t, code, others[0].token, { type: 'listed', listed: true });
    expect(denied.status).toBe(403);

    const res = await act(t, code, host.token, { type: 'listed', listed: true });
    expect(res.status).toBe(200);
    expect((res.body as ViewResponse).view.listed).toBe(true);
    const mine = await t.call('GET', `/api/rooms/${code}`, undefined, others[0].token);
    expect((mine.body as ViewResponse).view.listed).toBe(true);

    t.clock.advance(5000); // Zwischenspeicher der Liste abgelaufen
    const raw = await t.call('GET', '/api/rooms');
    expect((raw.body.rooms as PublicRoom[]).filter((r) => !r.bot)).toEqual([
      { code, people: 2, free: 10, status: 'lobby', round: null, rounds: 4, difficulty: 'gemischt', bot: null },
    ]);
    expect(JSON.stringify(raw.body)).not.toMatch(/Rahel|Jonas/);

    await act(t, code, host.token, { type: 'listed', listed: false });
    expect(await publicList(t)).toEqual([]);
  });

  it('blendet gesperrte, volle, beendete und verlassene Räume aus', async () => {
    const t = setup();
    const { host, code } = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    await act(t, code, host.token, { type: 'listed', listed: true });

    await act(t, code, host.token, { type: 'lock', locked: true });
    expect(await publicList(t)).toEqual([]);
    await act(t, code, host.token, { type: 'lock', locked: false });
    expect((await publicList(t)).map((r) => r.code)).toEqual([code]);

    // Handy im Hintergrund oder gesperrt: Der Raum bleibt eine Weile stehen …
    t.clock.advance(5 * 60 * 1000);
    expect((await publicList(t)).map((r) => r.code)).toEqual([code]);
    // … verschwindet aber, wenn lange niemand mehr da war, und kommt mit der Leitung zurück
    t.clock.advance(LISTED_ALIVE_MS);
    expect(await publicList(t)).toEqual([]);
    await t.call('GET', `/api/rooms/${code}`, undefined, host.token);
    expect((await publicList(t)).map((r) => r.code)).toEqual([code]);

    for (let i = 3; i <= 12; i++) {
      expect((await t.call('POST', `/api/rooms/${code}/join`, { name: `Gast ${i}` })).status).toBe(200);
    }
    expect(await publicList(t)).toEqual([]);

    const other = await roomWithPlayers(t, ['Mirjam', 'Silas']);
    await act(t, other.code, other.host.token, { type: 'listed', listed: true });
    expect((await publicList(t)).map((r) => r.code)).toEqual([other.code]);
    await act(t, other.code, other.host.token, { type: 'close' });
    expect(await publicList(t)).toEqual([]);
  });

  it('zeigt laufende Partien mit Runde, und man kann mitten hinein beitreten', async () => {
    const t = setup();
    const waiting = await roomWithPlayers(t, ['Rahel', 'Jonas']);
    const running = await roomWithPlayers(t, ['Mirjam', 'Silas']);
    await act(t, waiting.code, waiting.host.token, { type: 'listed', listed: true });
    await act(t, running.code, running.host.token, { type: 'listed', listed: true });
    expect((await act(t, running.code, running.host.token, { type: 'start' })).status).toBe(200);

    const rooms = await publicList(t);
    // Wartende Räume stehen vorn
    expect(rooms.map((r) => r.code)).toEqual([waiting.code, running.code]);
    expect(rooms[1]).toMatchObject({ status: 'playing', round: 1, rounds: 4, people: 2 });

    const late = await t.call('POST', `/api/rooms/${running.code}/join`, { name: 'Hanna' });
    expect(late.status).toBe(200);
    expect((late.body as SessionResponse).view.status).toBe('playing');
  });
});

describe('Joseph', () => {
  it('wartet immer als erster offener Raum und entsteht bei Bedarf neu', async () => {
    const t = setup();
    const list = await t.call('GET', '/api/rooms');
    expect(list.body.rooms[0]).toMatchObject({ code: BOT_ROOM_CODE, bot: BOT_NAME, people: 1, status: 'lobby' });

    // Auch nach dem Aufräumen ist der Raum direkt erreichbar
    await t.store.cleanup(t.clock.now + 1);
    const tv = await t.call('GET', `/api/rooms/${BOT_ROOM_CODE}`);
    expect(tv.status).toBe(200);
    expect((tv.body as ViewResponse).view.players.map((p) => p.name)).toEqual([BOT_NAME]);
  });

  it('spielt mit Menschen, die selbst starten – Joseph ist dabei immer verbunden', async () => {
    const t = setup();
    const joined = await t.call('POST', `/api/rooms/${BOT_ROOM_CODE.toLowerCase()}/join`, { name: 'Hanna' });
    expect(joined.status).toBe(200);
    const me = joined.body as SessionResponse;
    expect(me.view.botRoom).toBe(true);
    expect(me.view.players.find((p) => p.bot)).toMatchObject({ name: BOT_NAME, online: true });

    const started = await t.call('POST', `/api/rooms/${BOT_ROOM_CODE}/action`, { type: 'start' }, me.token);
    expect(started.status).toBe(200);
    expect((started.body as ViewResponse).view.status).toBe('playing');

    const bluff = await t.call('POST', `/api/rooms/${BOT_ROOM_CODE}/action`, { type: 'bluff', text: 'Ein Zylinderhut aus Quarzglas' }, me.token);
    // Joseph zieht sofort nach, also beginnt die Abstimmung
    expect((bluff.body as ViewResponse).view.round!.phase).toBe('vote');

    // Niemand darf Joseph hinauswerfen oder den Raum schließen
    const kick = await t.call('POST', `/api/rooms/${BOT_ROOM_CODE}/action`, { type: 'close' }, me.token);
    expect(kick.status).toBe(403);
  });
});
