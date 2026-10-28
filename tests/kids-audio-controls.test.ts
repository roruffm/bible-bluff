import { describe, expect, it } from 'vitest';
import { createKidsGame, kidsResumeGame, updateKidsGame, type KidsGame } from '../src/shared/kids-game';
import { packKidsGame, unpackKidsGame } from '../src/shared/kids-remote';
import { KIDS_AUDIO_SITUATIONS, kidsAudioAvailable, kidsAudioLabel, kidsAudioStatus, kidsContextAudio, parseKidsAudioFavorites } from '../src/shared/kids-audio-controls';
import { PROFESSOR_INTERJECTIONS } from '../src/shared/professor-interjections';

const reading = (): KidsGame => ({ ...createKidsGame(), phase: 'reading' });
describe('Übersichtliche Smartphone-Audios', () => {
  it('macht jede Zusatzansage über eine Situation auffindbar und hält die direkte Auswahl klein', () => {
    const clips = KIDS_AUDIO_SITUATIONS.flatMap(group => [...group.clips]);
    expect(new Set(clips)).toEqual(new Set(PROFESSOR_INTERJECTIONS.map(clip => clip.id)));
    for (const phase of ['welcome', 'chapter', 'reading', 'scene', 'moving', 'paused', 'locked', 'returning', 'judging', 'revealed', 'superbluff', 'finished'] as const) {
      for (const index of [0, 1, 3, 6, 9]) {
        const game = { ...reading(), phase, index };
        for (const step of ['scene', 'question'] as const) {
          const choices = kidsContextAudio(game, step);
          expect(choices.length).toBeLessThanOrEqual(3);
          expect(choices.every(choice => !!kidsAudioLabel(game, choice))).toBe(true);
        }
      }
    }
    expect(kidsContextAudio(reading(), 'scene')).toEqual(['call-minis', 'scene-invite']);
    expect(kidsContextAudio(reading(), 'question')).toEqual(['read-question', 'read-answers']);
  });
  it('ordnet Favoriten zur aktuellen Runde zu und übernimmt beschädigte oder übergroße Listen sicher', () => {
    expect(parseKidsAudioFavorites('kaputt')).toEqual([]);
    expect(parseKidsAudioFavorites('{"cheer":true}')).toEqual([]);
    expect(parseKidsAudioFavorites('["unbekannt",{},"cheer","cheer","quiet","result-final-correct","applause"]')).toEqual(['cheer', 'quiet', 'result-correct']);
    expect(kidsAudioAvailable(reading(), 'scene-invite')).toBe(true);
    expect(kidsAudioAvailable({ ...reading(), index: 1 }, 'scene-invite')).toBe(false);
    expect(kidsAudioAvailable(reading(), 'finale-parents')).toBe(false);
    expect(kidsAudioAvailable({ ...reading(), index: 9 }, 'finale-parents')).toBe(true);
    expect(kidsAudioLabel({ ...reading(), index: 9 }, 'result-correct')).toContain('+20');
  });
  it('zeigt nur das gemeldete Audio als laufend und beendet es ohne neue Wiedergabe oder Spieländerung', () => {
    const requested = updateKidsGame(reading(), 'interjection:cheer', 100);
    expect(kidsAudioStatus(requested).state).toBe('loading');
    const playing = updateKidsGame(requested, `voice-status:${requested.voiceSeq!}:playing`, 110);
    expect(kidsAudioStatus(playing)).toEqual({ state: 'playing', label: 'Läuft: Freunde anfeuern' });
    const ended = updateKidsGame(playing, `voice-status:${playing.voiceSeq!}:ended`, 200);
    expect(ended.voiceSeq).toBe(requested.voiceSeq);
    expect(ended.phase).toBe('reading');
    expect(ended.deadline).toBeNull();
    expect(ended.results).toBe(requested.results);
    expect(kidsAudioStatus(ended).state).toBe('idle');
    expect(updateKidsGame(ended, `voice-status:${ended.voiceSeq!}:playing`, 210)).toBe(ended);
    const next = updateKidsGame(playing, 'read-question', 120);
    expect(updateKidsGame(next, `voice-status:${playing.voiceSeq!}:ended`, 200)).toBe(next);
    const changedPhase = updateKidsGame(playing, 'scene', 120);
    expect(updateKidsGame(changedPhase, `voice-status:${playing.voiceSeq!}:ended`, 200)).toBe(changedPhase);
  });
  it('synchronisiert Status, meldet Ausfälle und spielt nach dem Wiederherstellen nichts erneut ab', () => {
    const requested = updateKidsGame(reading(), 'read-answers', 0);
    const failed = updateKidsGame(requested, `voice-status:${requested.voiceSeq!}:failed`, 1);
    expect(kidsAudioStatus(failed).state).toBe('failed');
    const packed = packKidsGame(failed, 2), restored = unpackKidsGame(packed, 3)!;
    expect(restored.voiceStatus).toEqual(failed.voiceStatus);
    expect(kidsAudioStatus(kidsResumeGame(restored, 4)).state).toBe('idle');
    expect(unpackKidsGame({ ...packed, voiceStatus: { sequence: 99, state: 'playing' } }, 3)).toBeNull();
    expect(unpackKidsGame({ ...packed, voiceStatus: { sequence: 1, state: 'erfunden' } }, 3)).toBeNull();
    const moving = updateKidsGame(reading(), 'start', 100);
    const countdown = updateKidsGame(moving, 'interjection:signal-countdown', 101);
    expect(kidsAudioStatus(countdown).state).toBe('scheduled');
    expect(kidsAudioStatus({ ...countdown, remainingMs: 4000, voiceStatus: { sequence: countdown.voiceSeq!, state: 'playing' } }).state).toBe('playing');
  });
});
