import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsResumeGame, updateKidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';

describe('Kids: Startansage zum Countdown', () => {
  it('spricht beim Start der Antwortzeit automatisch, auch statt der vorgelesenen Frage', () => {
    for (const short of [false, true]) for (const index of [0, 9]) {
      const reading = updateKidsGame({ ...createKidsGame(Math.random, { short }), phase: 'reading', index, results: Array(10).fill(null).map((_, i) => i < index && (!short || i < 3) ? 'correct' : null) }, 'read-question', 1000);
      const started = updateKidsGame(reading, 'start', 2000);
      expect(started).toMatchObject({ phase: 'moving', voicePlaying: true, voiceKind: 'interjection', voiceClip: 'signal-go', voiceCue: `moving:${index}`, voiceSeq: reading.voiceSeq! + 1 });
      const restored = unpackKidsGame(packKidsGame(started, 2500), 2600)!;
      expect(restored).toMatchObject({ phase: 'moving', voicePlaying: true, voiceClip: 'signal-go' });
    }
  });

  it('wiederholt die Startansage weder beim Fortsetzen noch nach dem Neuladen', () => {
    const reading = updateKidsGame(updateKidsGame(createKidsGame(), 'next', 0), 'next', 0);
    const started = updateKidsGame(reading, 'start', 1000);
    const paused = updateKidsGame(started, 'pause', 5000);
    expect(paused).toMatchObject({ phase: 'paused', voicePlaying: false, voiceCue: null });
    const resumed = updateKidsGame(paused, 'resume', 6000);
    expect(resumed).toMatchObject({ phase: 'moving', voicePlaying: false, voiceSeq: paused.voiceSeq });
    expect(kidsResumeGame(started, 3000)).toMatchObject({ phase: 'paused', voicePlaying: false, voiceCue: null });
    expect(updateKidsGame(started, 'start', 3000)).toBe(started);
  });
});
