import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsResumeGame, updateKidsGame } from '../src/shared/kids-game';
import { kidsIntroPosition } from '../src/shared/kids-intro';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';
import { createKidsRemoteApi } from '../src/server/kids-remote-api';
import { MemoryKidsRemoteStore } from '../src/server/kids-remote-store';

describe('Erklärvideo am Spielbeginn', () => {
  it('hält Spiel und Audios an, pausiert auf derselben Stelle und kehrt zur Begrüßung zurück', () => {
    let game = updateKidsGame(createKidsGame(), 'speak', 1000);
    game = updateKidsGame(game, 'play-intro', 2000);
    expect(game).toMatchObject({ phase: 'welcome', voicePlaying: false, introVideo: { playing: true, positionMs: 0 } });
    for (const action of ['next', 'speak', 'interjection:cheer', 'play-intro'] as const) expect(updateKidsGame(game, action, 5000)).toBe(game);
    game = updateKidsGame(game, 'pause-intro', 7000);
    expect(game.introVideo).toMatchObject({ playing: false, positionMs: 5000, startedAt: null });
    game = updateKidsGame(game, 'play-intro', 20_000);
    expect(kidsIntroPosition(game.introVideo!, 21_000)).toBe(6000);
    game = updateKidsGame(game, 'restart-intro', 22_000);
    expect(kidsIntroPosition(game.introVideo!, 22_000)).toBe(0);
    game = updateKidsGame(game, 'stop-intro', 23_000);
    expect(game.introVideo).toBeUndefined();
    expect(game.phase).toBe('welcome');
    expect(updateKidsGame(game, 'next', 24_000).phase).toBe('chapter');
    expect(game.results.every(r => r === null)).toBe(true);
  });

  it('überträgt Abspielpositionen unabhängig von Geräteuhren und pausiert gesicherte lokale Stände', () => {
    const game = updateKidsGame(createKidsGame(), 'play-intro', 1000);
    const restored = unpackKidsGame(packKidsGame(game, 6000), 80_000)!;
    expect(kidsIntroPosition(restored.introVideo!, 81_000)).toBe(6000);
    const saved = kidsResumeGame(restored, 82_000);
    expect(saved.introVideo).toMatchObject({ playing: false, positionMs: 7000, startedAt: null });
    expect(kidsIntroPosition(saved.introVideo!, 100_000)).toBe(7000);
    const oldGame = createKidsGame();
    expect(unpackKidsGame(packKidsGame(oldGame, 0), 0)?.introVideo).toBeUndefined();
    const invalid = packKidsGame(game, 1000);
    expect(unpackKidsGame({ ...invalid, introVideo: { ...invalid.introVideo, positionMs: -1 } }, 0)).toBeNull();
    expect(unpackKidsGame({ ...invalid, phase: 'reading' }, 0)).toBeNull();
  });

  it('bietet das Video nur zur passenden Show an und stoppt es beim Abschluss', () => {
    for (const game of [updateKidsGame(createKidsGame(), 'next', 0)]) {
      expect(updateKidsGame(game, 'play-intro', 0)).toBe(game);
    }
    const game = updateKidsGame(createKidsGame(), 'play-intro', 0);
    expect(updateKidsGame(game, 'finish', 1000)).toMatchObject({ phase: 'finished', introVideo: undefined });
    expect(updateKidsGame(game, 'jump-final', 1000)).toMatchObject({ phase: 'superbluff', introVideo: undefined });
  });

  it('nimmt Videobefehle der verbundenen Fernbedienung entgegen', async () => {
    let now = 1000;
    const api = createKidsRemoteApi(new MemoryKidsRemoteStore(), () => now);
    const create = await api(new Request('https://example.test/api/kids-remotes', { method: 'POST', body: JSON.stringify({ easy: false, game: packKidsGame(createKidsGame(), now) }) }), ['api', 'kids-remotes']);
    let remote = await create.json() as any;
    const token = remote.remoteToken;
    const id = remote.id;
    for (const [action, time] of [['play-intro', 2000], ['pause-intro', 8000], ['play-intro', 10_000], ['stop-intro', 12_000], ['next', 13_000]] as const) {
      now = time;
      const response = await api(new Request(`https://example.test/api/kids-remotes/${id}/action`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ action, version: remote.version }) }), ['api', 'kids-remotes', id, 'action']);
      expect(response.status).toBe(200);
      remote = await response.json();
      if (action === 'pause-intro') expect(remote.game.introVideo.positionMs).toBe(6000);
    }
    expect(remote.game.phase).toBe('chapter');
  });
});
