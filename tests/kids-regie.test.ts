import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsResumeGame, kidsScores, updateKidsGame, type KidsAction, type KidsGame } from '../src/shared/kids-game';
import { kidsRegieAction, kidsRegieCanUse, kidsRegieCurrent, kidsRegieStatus, kidsRegieSteps, parseKidsRegie } from '../src/shared/kids-regie';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';

const reading = (): KidsGame => ({ ...createKidsGame(), phase: 'reading' });
const act = (game: KidsGame, action: KidsAction, now = 100) => updateKidsGame(game, action, now);
const ended = (game: KidsGame) => act(act(game, `voice-status:${game.voiceSeq!}:playing`), `voice-status:${game.voiceSeq!}:ended`);
describe('Gespeicherte Smartphone-Regie', () => {
  it('zeigt die passende Folge pro Gruppe ohne Professor-Tipp und startet beim Öffnen nichts', () => {
    expect(kidsRegieSteps(reading()).map(s => s.id)).toEqual(['call', 'invite', 'scene', 'question', 'answers', 'countdown']);
    expect(kidsRegieSteps({ ...reading(), index: 1 }).map(s => s.id)).toEqual(['call', 'question', 'answers', 'countdown']);
    expect(kidsRegieSteps({ ...reading(), index: 9 }).map(s => s.id)).toEqual(['call', 'parents', 'scene', 'question', 'answers', 'countdown']);
    const selected = act(reading(), 'regie:select:answers');
    expect(kidsRegieCurrent(selected).id).toBe('answers');
    expect(selected.voiceSeq).toBeUndefined();
    expect(kidsScores(selected)).toEqual(kidsScores(reading()));
    expect(kidsRegieCurrent(createKidsGame()).id).toBe('chapter');
  });
  it('setzt Häkchen ausschließlich nach gestarteter und beendeter Aufnahme; Stopp, Fehler und veraltete Meldungen zählen nicht', () => {
    const requested = act(reading(), 'regie:do:call');
    expect(kidsRegieStatus(requested, 'call')).toBe('open');
    expect(kidsRegieStatus(act(requested, `voice-status:${requested.voiceSeq!}:ended`), 'call')).toBe('open');
    expect(kidsRegieStatus(act(requested, `voice-status:${requested.voiceSeq!}:failed`), 'call')).toBe('open');
    const stopped = act(requested, 'stop-speech');
    expect(kidsRegieStatus(stopped, 'call')).toBe('open');
    expect(act(stopped, `voice-status:${requested.voiceSeq!}:ended`)).toBe(stopped);
    const complete = ended(requested);
    expect(kidsRegieStatus(complete, 'call')).toBe('done');
    expect(kidsRegieCurrent(complete).id).toBe('invite');
    expect(complete.voicePlaying).toBe(false);
    expect(complete.voiceSeq).toBe(requested.voiceSeq);
    expect(complete.phase).toBe('reading');
    expect(kidsRegieStatus(act(complete, 'interjection:cheer'), 'invite')).toBe('open');
  });
  it('markiert ausgelassene Schritte ehrlich und behält Auswahl, Häkchen und offene Aufnahmen nach Wiederherstellung', () => {
    const question = act(reading(), 'regie:do:question');
    for (const id of ['call', 'invite', 'scene'] as const) expect(kidsRegieStatus(question, id)).toBe('skipped');
    const complete = ended(question);
    expect(kidsRegieCurrent(complete).id).toBe('answers');
    const restored = unpackKidsGame(packKidsGame(complete, 100), 200)!;
    expect(kidsRegieCurrent(kidsResumeGame(restored, 200)).id).toBe('answers');
    const interrupted = act(restored, 'regie:do:answers');
    const resumed = kidsResumeGame(unpackKidsGame(packKidsGame(interrupted, 200), 300)!, 300);
    expect(kidsRegieStatus(resumed, 'answers')).toBe('open');
    expect(resumed.voicePlaying).toBe(false);
    expect(kidsRegieCurrent(resumed).id).toBe('answers');
    expect(kidsRegieStatus(act(resumed, 'regie:skip:answers'), 'answers')).toBe('skipped');
  });
  it('wartet auf das Szenenende und behandelt einen Abbruch als übersprungen', () => {
    const scene = act(reading(), 'regie:do:scene');
    expect(kidsRegieStatus(scene, 'scene')).toBe('open');
    expect(act(scene, 'regie:do:result')).toBe(scene);
    const complete = act(scene, 'tick', scene.deadline!);
    expect(kidsRegieStatus(complete, 'scene')).toBe('done');
    expect(kidsRegieCurrent(complete).id).toBe('question');
    expect(kidsRegieStatus(act(scene, 'end-scene'), 'scene')).toBe('skipped');
    expect(kidsRegieStatus(kidsResumeGame(scene, 101), 'scene')).toBe('open');
  });
  it('führt über Helferprüfung und Rückruf zur Wertung, ohne früh zu punkten oder die Auflösung automatisch anzusagen', () => {
    let game = act(reading(), 'regie:do:countdown');
    expect(game.phase).toBe('moving');
    expect(kidsRegieStatus(game, 'countdown')).toBe('done');
    game = act(game, 'tick', game.deadline!);
    expect(kidsRegieCurrent(game)).toMatchObject({ id: 'stop', action: 'interjection:signal-stop' });
    expect(act(game, 'regie:do:result')).toBe(game);
    game = act(game, 'regie:do:stop');
    expect(game).toMatchObject({ phase: 'locked', voicePlaying: true, voiceClip: 'signal-stop' });
    expect(kidsRegieStatus(game, 'stop')).toBe('open');
    game = ended(game);
    expect(kidsRegieStatus(game, 'stop')).toBe('done');
    expect(kidsRegieCurrent(game).id).toBe('check');
    game = act(game, 'regie:do:check');
    expect(kidsRegieCurrent(game).id).toBe('recall');
    game = act(game, 'regie:do:recall');
    expect(game).toMatchObject({ phase: 'returning', voicePlaying: true, voiceClip: 'return' });
    expect(kidsRegieStatus(game, 'recall')).toBe('open');
    game = ended(game);
    expect(kidsRegieCurrent(game).id).toBe('back');
    game = act(game, 'regie:do:back');
    expect(game.phase).toBe('judging');
    expect(kidsScores(game).playedRounds).toBe(0);
    game = act(game, 'participated');
    expect(kidsScores(game).team).toBe(5);
    expect(kidsRegieCurrent(game)).toMatchObject({ id: 'announce', action: 'interjection:result-participated' });
    expect(game.voicePlaying).toBe(false);
    game = ended(act(game, 'regie:do:announce'));
    expect(kidsRegieCurrent(game).id).toBe('next');
    game = act(game, 'correct-last');
    expect(kidsRegieCurrent(game).id).toBe('announce');
    expect(kidsRegieCurrent(game).action).toBe('interjection:result-correct');
    game = act(game, 'regie:skip:announce');
    const next = act(game, 'regie:do:next');
    expect(next.index).toBe(1);
    expect(kidsRegieCurrent(next).id).toBe('call');
    expect(next.regie!.rounds[0].steps.announce).toBe('skipped');
  });
  it('schützt Phasengrenzen, Punkte und gespeicherte Daten vor ungültigen Regiebefehlen', () => {
    const game = reading();
    expect(act(game, 'regie:do:back')).toBe(game);
    expect(act(game, 'regie:do:announce')).toBe(game);
    expect(kidsRegieAction('regie:do:professor')).toBeNull();
    expect(parseKidsRegie({ rounds: [{ index: 0, steps: { call: 'done' } }, { index: 0, steps: {} }] })).toBeNull();
    for (const regie of [{ rounds: [{ index: 10, steps: {} }] }, { rounds: [{ index: 0, steps: { call: 'gespielt' } }] }, { rounds: [{ index: 0, steps: {}, selected: 'unknown' }] }]) expect(unpackKidsGame({ ...packKidsGame(game, 0), regie }, 0)).toBeNull();
    const final = { ...game, index: 9, phase: 'revealed' as const, results: game.results.map((_, i) => i === 9 ? 'correct' as const : null) };
    expect(kidsRegieCurrent(final).action).toBe('interjection:result-final-correct');
    expect(kidsRegieStatus({ ...game, phase: 'judging' }, 'question')).toBe('skipped');
  });
  it('bietet Stopp auch nach übersprungenem Countdown und nach Wiederherstellung an, ausschließlich auf den Feldern', () => {
    for (const index of [0, 1, 9]) {
      const initial = reading();
      const skipped = act({ ...initial, index, results: initial.results.map((result, i) => i < index ? 'correct' : result) }, 'skip-countdown');
      expect(kidsRegieSteps(skipped).map(s => s.id)).toEqual(['stop', 'check', 'recall', 'back', 'result', 'announce']);
      expect(kidsRegieCurrent(skipped).id).toBe('stop');
      expect(skipped.voicePlaying).toBe(false);
      const requested = act(skipped, 'regie:do:stop');
      const stopped = act(requested, 'stop-speech');
      expect(kidsRegieStatus(stopped, 'stop')).toBe('open');
      expect(kidsRegieStatus(act(requested, `voice-status:${requested.voiceSeq!}:failed`), 'stop')).toBe('open');
      const restored = kidsResumeGame(unpackKidsGame(packKidsGame(requested, 100), 200)!, 200);
      expect(kidsRegieCurrent(restored).id).toBe('stop');
      expect(restored.voicePlaying).toBe(false);
      const complete = ended(act(restored, 'regie:do:stop'));
      const saved = unpackKidsGame(packKidsGame(complete, 200), 300)!;
      expect(kidsRegieCurrent(saved).id).toBe('check');
      expect(kidsRegieStatus(act(skipped, 'regie:skip:stop'), 'stop')).toBe('skipped');
      const checked = act(skipped, 'regie:do:check');
      expect(kidsRegieStatus(checked, 'stop')).toBe('skipped');
      expect(kidsRegieCurrent(checked).id).toBe('recall');
      expect(kidsScores(checked)).toEqual(kidsScores(skipped));
    }
    for (const phase of ['reading', 'moving', 'paused', 'returning', 'judging', 'revealed', 'finished'] as const) {
      const game = { ...reading(), phase };
      expect(kidsRegieCanUse(game, 'stop')).toBe(false);
      expect(act(game, 'regie:do:stop')).toBe(game);
    }
    expect(kidsRegieStatus({ ...reading(), phase: 'returning' }, 'stop')).toBe('skipped');
  });
});

