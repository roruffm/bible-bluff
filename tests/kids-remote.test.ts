import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { MemoryStore } from '../src/server/store';
import { D1KidsRemoteStore, MemoryKidsRemoteStore, type KidsRemoteStore } from '../src/server/kids-remote-store';
import { KIDS_REMOTE_TTL } from '../src/server/kids-remote-api';
import type { D1Like, D1PreparedLike } from '../src/server/d1-store';
import { createKidsGame, kidsScores, updateKidsGame } from '../src/shared/kids-game';
import { packKidsGame, type KidsRemoteCreated } from '../src/shared/kids-remote';
import { Clock } from './helpers';

class Statement implements D1PreparedLike {
  constructor(private db: DatabaseSync, private sql: string, private values: SQLInputValue[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.db, this.sql, values.map((v) => { if (v === null || typeof v === 'string' || typeof v === 'number') return v; throw Error('Invalid binding'); })); }
  async first<T>() { return this.db.prepare(this.sql).get(...this.values) as T ?? null; }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...this.values) as T[] }; }
  async run() { return { meta: { changes: Number(this.db.prepare(this.sql).run(...this.values).changes) } }; }
}
const reading = () => updateKidsGame(updateKidsGame(createKidsGame(), 'next', 0), 'next', 0);
function setup(store: KidsRemoteStore = new MemoryKidsRemoteStore()) {
  const clock = new Clock();
  let api = createApi({ store: new MemoryStore(), kidsRemoteStore: store, now: () => clock.now });
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await api(new Request(`https://test${path}`, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }));
    return { status: res.status, body: await res.json() as KidsRemoteCreated & { error?: { code: string } } };
  };
  const create = async (game = reading()) => (await call('POST', '/api/kids-remotes', { easy: true, game: packKidsGame(game, clock.now) })).body;
  return { clock, call, create, reboot: (next: KidsRemoteStore = store) => { api = createApi({ store: new MemoryStore(), kidsRemoteStore: next, now: () => clock.now }); } };
}

describe('Kids-Fernbedienung', () => {
  it('überspringt den Countdown nur mit Bedienungszugang und synchronisiert Stopp statt einer vorzeitigen Wertung', async () => {
    for (const short of [false, true]) {
      const t = setup();
      let game = createKidsGame(Math.random, { short });
      game = updateKidsGame(updateKidsGame(game, 'next', t.clock.now), 'next', t.clock.now);
      game = updateKidsGame(updateKidsGame(game, 'start', t.clock.now), 'interjection:signal-countdown', t.clock.now);
      const made = await t.create(game), path = `/api/kids-remotes/${made.id}`;
      expect((await t.call('POST', path + '/action', { action: 'skip-countdown', version: 1 })).status).toBe(401);
      const stopped = await t.call('POST', path + '/action', { action: 'skip-countdown', version: 1 }, made.remoteToken);
      expect(stopped.status).toBe(200);
      expect(stopped.body.game).toMatchObject({ phase: 'locked', remainingMs: 0, deadline: null, voicePlaying: false, voiceCue: null });
      expect(kidsScores(stopped.body.game)).toEqual(kidsScores(game));
      expect((await t.call('POST', path + '/action', { action: 'skip-countdown', version: 1 }, made.ownerToken)).status).toBe(409);
      t.reboot();
      const display = await t.call('GET', path, undefined, made.ownerToken);
      expect(display.body.game).toEqual(stopped.body.game);
      let version = 2;
      if (!short) {
        expect((await t.call('POST', path + '/action', { action: 'correct', version }, made.remoteToken)).status).toBe(409);
        for (const action of ['return', 'ready']) {
          expect((await t.call('POST', path + '/action', { action, version: version++ }, made.ownerToken)).status).toBe(200);
        }
      }
      const scored = await t.call('POST', path + '/action', { action: 'correct', version }, made.remoteToken);
      expect(scored.status).toBe(200);
      expect(scored.body.game.phase).toBe('revealed');
      expect(kidsScores(scored.body.game)).toMatchObject({ team: 10, professor: short ? 6 : 7, playedRounds: 1 });
    }
  });
  it('springt mit erhaltenen Punkten ins Finale, stellt übersprungene Aufgaben wieder her und wertet das Finale genau einmal', async () => {
    const t=setup(), base=reading();
    const game={...base,index:2,results:['correct','participated',...Array(8).fill(null)]};
    const made=await t.create(game),path=`/api/kids-remotes/${made.id}`;
    const jump=await t.call('POST',path+'/action',{action:'jump-final',version:1},made.remoteToken);
    expect(jump.status).toBe(200);
    expect(jump.body.game).toMatchObject({index:9,phase:'superbluff',deadline:null,voicePlaying:false});
    expect(kidsScores(jump.body.game)).toMatchObject({team:15,professor:14,playedRounds:2});
    expect(jump.body.game.results.slice(2)).toEqual(Array(8).fill(null));
    t.reboot();
    const saved=await t.call('GET',path,undefined,made.ownerToken);
    expect(saved.body.game).toEqual(jump.body.game);
    expect((await t.create(saved.body.game)).game.results).toEqual(jump.body.game.results);
    expect((await t.call('POST',path+'/action',{action:'jump-final',version:1},made.remoteToken)).status).toBe(409);
    let version=2;
    for(const action of ['next','start','return','ready','correct','next']) {
      if(action==='return') t.clock.advance(30000);
      const r=await t.call('POST',path+'/action',{action,version:version++},made.remoteToken);
      expect(r.status,action).toBe(200);
    }
    const end=await t.call('GET',path,undefined,made.ownerToken);
    expect(end.body.game.phase).toBe('finished');
    expect(kidsScores(end.body.game)).toMatchObject({team:35,professor:14,playedRounds:3});
    expect((await t.call('POST',path+'/action',{action:'jump-final',version},made.ownerToken)).status).toBe(409);
  });
  it('akzeptiert vor dem Finale nur einen gewerteten Anfang mit anschließendem ungespielten Rest', async () => {
    const t=setup(),base=reading();
    const game=packKidsGame({...base,index:9,phase:'superbluff',results:['correct',null,'correct',...Array(7).fill(null)]},t.clock.now);
    expect((await t.call('POST','/api/kids-remotes',{easy:false,game})).status).toBe(400);
  });
  it('korrigiert per Smartphone die letzte Wertung auch während der nächsten Runde und nach Neustart', async () => {
    const t=setup(), base=reading();
    const game={...base,index:1,phase:'reading' as const,results:base.results.map((_,i)=>i===0 ? 'none' as const : null)};
    const made=await t.create(game), path=`/api/kids-remotes/${made.id}`;
    await t.call('POST',path+'/action',{action:'start',version:1},made.remoteToken);
    const corrected=await t.call('POST',path+'/action',{action:'correct-last',version:2},made.remoteToken);
    expect(corrected.status).toBe(200);
    expect(corrected.body.game).toMatchObject({index:1,phase:'moving',deadline:t.clock.now+30000});
    expect(kidsScores(corrected.body.game)).toMatchObject({team:10,professor:7,playedRounds:1});
    expect(corrected.body.game.results[1]).toBeNull();
    t.reboot();
    const restored=await t.call('GET',path,undefined,made.ownerToken);
    expect(restored.body.game.results[0]).toBe('correct');
    expect((await t.call('POST',path+'/action',{action:'none-last',version:2},made.remoteToken)).status).toBe(409);
  });
  it('überträgt freie Ansagen auch beim Rückweg und lehnt unbekannte Aufnahmen ab', async () => {
    const t=setup(),made=await t.create({...reading(),phase:'returning'}),path=`/api/kids-remotes/${made.id}`;
    const spoken=await t.call('POST',path+'/action',{action:'interjection:cheer',version:1},made.remoteToken);
    expect(spoken.status).toBe(200);
    expect(spoken.body.game).toMatchObject({phase:'returning',voiceKind:'interjection',voiceClip:'cheer',voicePlaying:true,voiceSeq:1});
    expect(kidsScores(spoken.body.game)).toEqual(kidsScores(made.game));
    t.reboot();
    const restored=await t.call('GET',path,undefined,made.ownerToken);
    expect(restored.body.game.voiceClip).toBe('cheer');
    expect((await t.call('POST',path+'/action',{action:'interjection:unknown',version:2},made.remoteToken)).status).toBe(400);
    const stopped=await t.call('POST',path+'/action',{action:'stop-speech',version:2},made.remoteToken);
    expect(stopped.body.game.voicePlaying).toBe(false);
    const invalid=packKidsGame(reading(),t.clock.now);
    Object.assign(invalid,{voiceKind:'interjection',voiceClip:'../../other'});
    expect((await t.call('POST','/api/kids-remotes',{easy:true,game:invalid})).status).toBe(400);
  });
  it('überträgt Frage vorlesen als eigenen manuellen Sprachbefehl, ohne den Timer zu starten',async()=>{
    const t=setup(),made=await t.create(),path=`/api/kids-remotes/${made.id}`;
    const read=await t.call('POST',path+'/action',{action:'read-question',version:1},made.remoteToken);
    expect(read.status).toBe(200);expect(read.body.game).toMatchObject({voiceKind:'question',voiceCue:'reading:0',voiceSeq:1,remainingMs:30000,deadline:null,phase:'reading'});
    const quote=await t.call('POST',path+'/action',{action:'speak',version:2},made.ownerToken);
    expect(quote.body.game.voiceKind).toBe('quote');
    await t.call('POST',path+'/action',{action:'start',version:3},made.ownerToken);
    expect((await t.call('POST',path+'/action',{action:'read-question',version:4},made.remoteToken)).status).toBe(409);
  });
  it('überträgt manuelles Abspielen und Stoppen ohne den Countdown oder Punkte zu ändern', async () => {
    const t=setup(), made=await t.create(), path=`/api/kids-remotes/${made.id}`;
    const play=await t.call('POST',path+'/action',{action:'speak',version:1},made.remoteToken);
    expect(play.status).toBe(200);expect(play.body.game).toMatchObject({phase:'reading',remainingMs:30000,voiceSeq:1,voicePlaying:true,voiceCue:'reading:0'});
    expect(kidsScores(play.body.game)).toEqual(kidsScores(made.game));
    const read=await t.call('GET',path,undefined,made.ownerToken);expect(read.body.game.voiceSeq).toBe(1);
    const stop=await t.call('POST',path+'/action',{action:'stop-speech',version:2},made.remoteToken);
    expect(stop.body.game).toMatchObject({voiceSeq:2,voicePlaying:false,phase:'reading',remainingMs:30000});
    expect((await t.call('POST',path+'/action',{action:'speak',version:2},made.remoteToken)).status).toBe(409);
    const scene=await t.call('POST',path+'/action',{action:'scene',version:3},made.remoteToken);
    expect(scene.status).toBe(200);expect((await t.call('POST',path+'/action',{action:'speak',version:4},made.remoteToken)).status).toBe(409);
  });
  it('behält die laufende Frage und erlaubt nur den beiden Schlüsseln Zugriff', async () => {
    const t = setup();
    let game = updateKidsGame(reading(), 'start', t.clock.now);
    t.clock.advance(12345); game = updateKidsGame(game, 'pause', t.clock.now);
    const made = await t.create(game); const path = `/api/kids-remotes/${made.id}`;
    expect(made.game.phase).toBe('paused');
    expect(made.game.remainingMs).toBe(17655);
    expect(made.game.rounds.map((r) => r.answers)).toEqual(game.rounds.map((r) => r.answers));
    expect((await t.call('GET', path)).status).toBe(401);
    expect((await t.call('GET', path, undefined, 'a'.repeat(48))).status).toBe(403);
    for (const key of [made.ownerToken, made.remoteToken]) {
      const read = await t.call('GET', path, undefined, key);
      expect(read.status).toBe(200);
      expect(read.body.game.index).toBe(game.index);
      expect(read.body.ownerToken).toBeUndefined();
      expect(read.body.remoteToken).toBeUndefined();
    }
  });
  it('synchronisiert Start, Pause, Fortsetzen, Stopp und Aufdecken ohne verfrühte Auflösung', async () => {
    const t = setup(); const made = await t.create(); const path = `/api/kids-remotes/${made.id}`;
    const action = (action: string, version: number, key = made.remoteToken) => t.call('POST', `${path}/action`, { action, version }, key);
    expect((await action('correct', 1)).status).toBe(409);
    expect((await action('start', 1)).body.version).toBe(2);
    t.clock.advance(10000);
    expect((await action('pause', 2, made.ownerToken)).body.game.remainingMs).toBe(20000);
    t.clock.advance(100000);
    expect((await t.call('GET', path, undefined, made.remoteToken)).body.game.phase).toBe('paused');
    expect((await action('resume', 3)).body.version).toBe(4);
    t.clock.advance(19999); expect((await action('correct', 4)).status).toBe(409);
    t.clock.advance(1);
    const stopped = await t.call('GET', path, undefined, made.ownerToken);
    expect(stopped.body.game.phase).toBe('locked'); expect(stopped.body.version).toBe(4);
    expect((await action('return', 4)).body.game.phase).toBe('returning');
    expect((await action('correct', 5)).status).toBe(409);
    expect((await action('ready', 5)).body.game.phase).toBe('judging');
    expect((await action('correct', 6)).body.game.phase).toBe('revealed');
    const next = await action('next', 7);
    expect(next.body.game.index).toBe(1); expect(next.body.game.phase).toBe('reading');
  });
  it('führt Doppelklicks und gleichzeitige Befehle nur einmal aus', async () => {
    const t = setup(); const made = await t.create(); const path = `/api/kids-remotes/${made.id}`;
    const responses = await Promise.all([made.ownerToken, made.remoteToken].map((token) => t.call('POST', `${path}/action`, { action: 'start', version: 1 }, token)));
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const read = await t.call('GET', path, undefined, made.ownerToken);
    expect(read.body.version).toBe(2); expect(read.body.game.index).toBe(0);
  });
  it('wertet konkurrierende Mehrheitsmeldungen einmal und bewahrt das Ergebnis beim Wiederverbinden', async () => {
    const t = setup();
    const made = await t.create({ ...reading(), phase: 'judging', remainingMs: 0 });
    const path = `/api/kids-remotes/${made.id}`;
    const responses = await Promise.all([
      t.call('POST', `${path}/action`, { action: 'correct', version: 1 }, made.ownerToken),
      t.call('POST', `${path}/action`, { action: 'participated', version: 1 }, made.remoteToken),
    ]);
    expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
    t.reboot();
    const saved = (await t.call('GET', path, undefined, made.remoteToken)).body.game;
    expect(saved.phase).toBe('revealed');
    expect(['correct','participated']).toContain(saved.results[0]);
    expect(saved.results.filter(r=>r!==null)).toHaveLength(1);
  });
  it('lässt nur den Beamer die Verbindung trennen und beendet abgelaufene Sitzungen', async () => {
    const t = setup(); const made = await t.create(); const path = `/api/kids-remotes/${made.id}`;
    expect((await t.call('DELETE', path, undefined, made.remoteToken)).status).toBe(403);
    expect((await t.call('DELETE', path, undefined, made.ownerToken)).status).toBe(200);
    expect((await t.call('GET', path, undefined, made.remoteToken)).status).toBe(410);
    const expired = await t.create(); t.clock.advance(KIDS_REMOTE_TTL);
    expect((await t.call('GET', `/api/kids-remotes/${expired.id}`, undefined, expired.ownerToken)).status).toBe(410);
  });
  it('prüft fremde Fragen, manipulierte Antworten, Duplikate und zu große Eingaben', async () => {
    const t = setup();
    for (const change of [
      (g: ReturnType<typeof packKidsGame>) => { g.rounds[0].id = 'unbekannt'; },
      (g: ReturnType<typeof packKidsGame>) => { g.rounds[0].answers = ['frei', 'erfunden', 'unsicher']; },
      (g: ReturnType<typeof packKidsGame>) => { g.rounds[1] = g.rounds[0]; },
      (g: ReturnType<typeof packKidsGame>) => { g.remainingMs = -1; },
      (g: ReturnType<typeof packKidsGame>) => { g.results[0] = 'correct'; },
    ]) {
      const game = packKidsGame(reading(), t.clock.now); change(game);
      expect((await t.call('POST', '/api/kids-remotes', { game, easy: true })).status).toBe(400);
    }
    expect((await t.call('POST', '/api/kids-remotes', { long: 'x'.repeat(9000) })).status).toBe(413);
  });
  it('synchronisiert die Szene, stellt sie zeitgenau wieder her und startet danach keine Antwortzeit', async () => {
    const t=setup(), made=await t.create(), path=`/api/kids-remotes/${made.id}`;
    const scene=await t.call('POST',path+'/action',{action:'scene',version:1},made.remoteToken);
    expect(scene.body.game).toMatchObject({phase:'scene',cueSeq:1,remainingMs:30000,deadline:t.clock.now+10000});
    expect((await t.call('POST',path+'/action',{action:'start',version:2},made.ownerToken)).status).toBe(409);
    t.clock.advance(4200);t.reboot();
    const saved=await t.call('GET',path,undefined,made.ownerToken);
    expect(saved.body.game.deadline).toBe(scene.body.game.deadline);
    const restored=await t.create(saved.body.game);
    expect(restored.game.deadline).toBe(scene.body.game.deadline);
    expect(restored.game.rounds.map(r=>r.answers)).toEqual(made.game.rounds.map(r=>r.answers));
    t.clock.advance(5800);
    const after=await t.call('GET',path,undefined,made.remoteToken);
    expect(after.body.game).toMatchObject({phase:'reading',remainingMs:30000,deadline:null});
    const replay=await t.call('POST',path+'/action',{action:'scene',version:2},made.remoteToken);
    expect(replay.body.game.cueSeq).toBe(2);
    const skipped=await t.call('POST',path+'/action',{action:'end-scene',version:3},made.remoteToken);
    expect(skipped.body.game).toMatchObject({phase:'reading',remainingMs:30000,deadline:null});
  });
  it('weist Szenen ohne passende Frage oder mit ungültiger Restzeit zurück', async () => {
    const t=setup();
    for(const value of [undefined,-1,10001,NaN]) {
      const game=packKidsGame(updateKidsGame(reading(),'scene',t.clock.now),t.clock.now);
      game.sceneRemainingMs=value;
      expect((await t.call('POST','/api/kids-remotes',{easy:false,game})).status).toBe(400);
    }
    const game=packKidsGame(updateKidsGame(reading(),'scene',t.clock.now),t.clock.now);
    game.index=1;game.results[0]='correct';
    expect((await t.call('POST','/api/kids-remotes',{easy:false,game})).status).toBe(400);
  });
  for(const scoredCurrent of [false,true]) it(`schließt vorzeitig ab und stellt den Endstand wieder her, aktuelle Aufgabe gewertet: ${scoredCurrent}`, async () => {
    const t=setup();
    const results=['correct','participated',scoredCurrent ? 'none' : null,...Array(7).fill(null)];
    const game={...reading(),index:2,phase:scoredCurrent ? 'revealed' as const : 'moving' as const,results,deadline:scoredCurrent ? null : t.clock.now+30000};
    const made=await t.create(game), path=`/api/kids-remotes/${made.id}`;
    const ended=await t.call('POST',path+'/action',{action:'finish',version:1},made.remoteToken);
    expect(ended.status).toBe(200);expect(ended.body.game).toMatchObject({index:2,phase:'finished',deadline:null,remainingMs:0,results});
    expect(kidsScores(ended.body.game)).toMatchObject({team:15,professor:scoredCurrent ? 21 : 14,playedRounds:scoredCurrent ? 3 : 2});
    t.clock.advance(100000);t.reboot();
    const saved=await t.call('GET',path,undefined,made.ownerToken);
    expect(saved.body.game).toEqual(ended.body.game);
    for(const action of ['next','start','correct','finish'])expect((await t.call('POST',path+'/action',{action,version:2},made.ownerToken)).status).toBe(409);
    const restored=await t.create(saved.body.game);expect(restored.game).toEqual(saved.body.game);
  });
  it('beendet beim gleichzeitigen Abschluss beider Geräte genau einmal', async () => {
    const t=setup(), made=await t.create();
    const responses=await Promise.all([made.ownerToken,made.remoteToken].map(token=>t.call('POST',`/api/kids-remotes/${made.id}/action`,{action:'finish',version:1},token)));
    expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
    const saved=await t.call('GET',`/api/kids-remotes/${made.id}`,undefined,made.ownerToken);
    expect(saved.body.version).toBe(2);expect(saved.body.game.phase).toBe('finished');expect(kidsScores(saved.body.game).playedRounds).toBe(0);
  });
  it('akzeptiert keine Lücken oder vorzeitig erfundenen Resultate im Endstand', async () => {
    const t=setup();
    for(const results of [
      ['correct',null,null,...Array(7).fill(null)],
      ['correct','participated','unbekannt',...Array(7).fill(null)],
      ['correct','participated',null,'correct',...Array(6).fill(null)],
    ]) {
      const game=packKidsGame({...reading(),index:2,phase:'finished',results},t.clock.now);
      expect((await t.call('POST','/api/kids-remotes',{easy:false,game})).status).toBe(400);
    }
  });
  it('beendet die Show ohne Revanche und akzeptiert keine Familienjoker', async () => {
    const t = setup();
    const game = { ...reading(), phase: 'finished' as const, index: 9, remainingMs: 0, results: Array(10).fill('correct') };
    const made = await t.create(game);
    for (const action of ['restart','joker']) {
      expect((await t.call('POST', `/api/kids-remotes/${made.id}/action`, { action, version: 1 }, made.remoteToken)).status).toBe(400);
    }
    const saved=await t.call('GET', `/api/kids-remotes/${made.id}`, undefined, made.ownerToken);
    expect(saved.body.game.phase).toBe('finished');
    expect(saved.body.version).toBe(1);
  });
  it('verwendet nach einem Update auch für bestehende Sitzungen die aktuellen Antwortbilder', async () => {
    const store=new MemoryKidsRemoteStore(), t=setup(store), made=await t.create();
    const record=(await store.load(made.id))!;
    record.game.rounds[5].question.pictures=['donkey','leaf','ark'];
    await store.update(made.id,record.version,record.game,true);
    const read=await t.call('GET',`/api/kids-remotes/${made.id}`,undefined,made.remoteToken);
    expect(read.body.game.rounds[5].question.pictures).toEqual(['donkey','raven','camel']);
    expect(read.body.game.rounds.map(r=>r.answers)).toEqual(made.game.rounds.map(r=>r.answers));
  });
  it('vergibt im Finale zehn Punkte für mindestens ein richtiges Kind und bewahrt sie beim Neuladen', async () => {
    const t = setup();
    const game = { ...reading(), index: 9, phase: 'judging' as const, remainingMs: 0, results: [...Array(9).fill('none'), null] };
    const made = await t.create(game);
    const path = `/api/kids-remotes/${made.id}`;
    const result = await t.call('POST', `${path}/action`, { action: 'participated', version: 1 }, made.remoteToken);
    expect(result.status).toBe(200);
    expect(result.body.game.results[9]).toBe('participated');
    expect(kidsScores(result.body.game).bonus).toBe(10);
    expect(kidsScores(result.body.game).team).toBe(10);
    const restored = await t.call('POST', '/api/kids-remotes', { easy: false, game: packKidsGame(result.body.game, t.clock.now) });
    expect(restored.status).toBe(201);
    expect(restored.body.game.results[9]).toBe('participated');
  });
});

describe('Kids-Fernbedienung in D1 / SQLite', () => {
  for (const migrated of [false, true]) it(`überlebt einen Worker-Neustart, Migration ${migrated ? 'vorhanden' : 'automatisch'}`, async () => {
    const db = new DatabaseSync(':memory:');
    if (migrated) db.exec(readFileSync(new URL('../migrations/0006_kids_remotes.sql', import.meta.url), 'utf8'));
    const binding: D1Like = { prepare: (sql) => new Statement(db, sql), async batch() { throw Error('Unexpected batch'); } };
    const store = new D1KidsRemoteStore(binding); const t = setup(store); const made = await t.create();
    const raw = db.prepare('SELECT * FROM kids_remotes WHERE id = ?').get(made.id)!;
    expect(raw.owner_hash).not.toBe(made.ownerToken); expect(raw.remote_hash).not.toBe(made.remoteToken);
    t.reboot(new D1KidsRemoteStore(binding));
    const started = await t.call('POST', `/api/kids-remotes/${made.id}/action`, { action: 'start', version: 1 }, made.remoteToken);
    expect(started.status).toBe(200); expect(started.body.game.phase).toBe('moving');
    expect(await store.update(made.id, 1, made.game, true)).toBe(false);
    const ended=await t.call('POST',`/api/kids-remotes/${made.id}/action`,{action:'finish',version:2},made.remoteToken);
    expect(ended.body.game).toMatchObject({phase:'finished',index:0,deadline:null,remainingMs:0});
    t.reboot(new D1KidsRemoteStore(binding));
    expect((await t.call('GET',`/api/kids-remotes/${made.id}`,undefined,made.ownerToken)).body.game.phase).toBe('finished');
    t.clock.advance(KIDS_REMOTE_TTL); await store.cleanup(t.clock.now);
    expect(await store.load(made.id)).toBeNull(); db.close();
  });
  it('geht per Smartphone Schritt für Schritt zurück, nimmt dabei die Wertung zurück und hält an der Begrüßung an', async () => {
    const t = setup(), made = await t.create(), path = `/api/kids-remotes/${made.id}`;
    const action = (action: string, version: number) => t.call('POST', `${path}/action`, { action, version }, made.remoteToken);
    let version = 1;
    for (const forward of ['start', 'skip-countdown', 'return', 'ready', 'correct']) expect((await action(forward, version++)).status, forward).toBe(200);
    const phases: string[] = [];
    for (;;) {
      const back = await action('back', version);
      if (back.status !== 200) { expect(back.status).toBe(409); break; }
      version++; phases.push(back.body.game.phase);
      if (back.body.game.phase === 'judging') expect(kidsScores(back.body.game).team).toBe(0);
    }
    expect(phases).toEqual(['judging', 'returning', 'locked', 'reading', 'chapter', 'welcome']);
    const display = await t.call('GET', path, undefined, made.ownerToken);
    expect(display.body.game).toMatchObject({ phase: 'welcome', index: 0, results: Array(10).fill(null) });
  });
});
