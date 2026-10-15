import { describe, expect, it } from 'vitest';
import { KIDS_QUESTIONS } from '../src/shared/kids-questions';
import { QUESTIONS } from '../src/server/questions';
import { createKidsGame, kidsPrimaryAction, updateKidsGame } from '../src/client/lib/kids';

describe('Kids-Fragenpool', () => {
  it('enthält nur einzeln ausgewählte Fragen mit passender Herkunft und genau einer richtigen Antwort', () => {
    expect(KIDS_QUESTIONS.length).toBe(28);
    expect(new Set(KIDS_QUESTIONS.map((q) => q.sourceId)).size).toBe(KIDS_QUESTIONS.length);
    for (const q of KIDS_QUESTIONS) {
      const source = QUESTIONS.find((candidate) => candidate.id === q.sourceId);
      expect(source, q.sourceId).toBeDefined();
      expect(q.ref).toBe(source!.ref);
      expect(q.prompt.length).toBeLessThan(100);
      expect(q.distractors).toHaveLength(2);
      expect(new Set([q.answer, ...q.distractors].map((s) => s.toLowerCase())).size).toBe(3);
      expect(q.explanation.length).toBeGreaterThan(30);
    }
    expect(KIDS_QUESTIONS.filter((q) => q.level === 1).length).toBeGreaterThanOrEqual(15);
  });
  it('zieht ohne Wiederholungen, mischt die Antwortpositionen und begrenzt auf den leichten Pool', () => {
    for (const count of [6, 10, 15]) {
      const game = createKidsGame(count, true);
      expect(game.rounds).toHaveLength(count);
      expect(new Set(game.rounds.map((r) => r.question.sourceId)).size).toBe(count);
      expect(game.rounds.every((r) => r.question.level === 1)).toBe(true);
      const counts = [0, 0, 0];
      for (const round of game.rounds) {
        expect(round.answers).toHaveLength(3);
        expect(round.answers[round.correctIndex]).toBe(round.question.answer);
        expect(round.answers.filter((answer) => answer === round.question.answer)).toHaveLength(1);
        counts[round.correctIndex]++;
      }
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });
});

describe('Kids-Beamerablauf', () => {
  it('gibt volle 30 Sekunden nach dem Vorlesen und deckt erst nach Ablauf bewusst auf', () => {
    let g = createKidsGame(6);
    expect(g.phase).toBe('reading');
    expect(updateKidsGame(g, 'tick', 999999)).toBe(g);
    expect(updateKidsGame(g, 'reveal', 999999)).toBe(g);
    g = updateKidsGame(g, 'start', 100000);
    g = updateKidsGame(g, 'tick', 129999);
    expect(g.phase).toBe('moving');
    expect(g.remainingMs).toBe(1);
    expect(updateKidsGame(g, 'reveal', 129999)).toBe(g);
    g = updateKidsGame(g, 'tick', 130000);
    expect(g.phase).toBe('locked');
    expect(g.remainingMs).toBe(0);
    g = updateKidsGame(g, 'reveal', 135000);
    expect(g.phase).toBe('revealed');
    expect(updateKidsGame(g, 'tick', 999999)).toBe(g);
    g = updateKidsGame(g, 'next', 140000);
    expect(g.index).toBe(1);
    expect(g.phase).toBe('reading');
    expect(g.remainingMs).toBe(30000);
  });
  it('rechnet nach Tabwechsel mit der echten Deadline und friert nur bei ausdrücklicher Pause ein', () => {
    let g = updateKidsGame(createKidsGame(6), 'start', 1000);
    expect(updateKidsGame(g, 'tick', 200000).phase).toBe('locked');
    g = updateKidsGame(g, 'pause', 6500);
    expect(g.phase).toBe('paused');
    expect(g.remainingMs).toBe(24500);
    expect(updateKidsGame(g, 'tick', 100000)).toBe(g);
    g = updateKidsGame(g, 'resume', 100000);
    expect(g.deadline).toBe(124500);
    expect(updateKidsGame(g, 'tick', 124500).phase).toBe('locked');
  });
  it('beendet nach der letzten Auflösung und lässt keine Fragen überspringen', () => {
    let g = createKidsGame(6);
    expect(updateKidsGame(g, 'next', 0)).toBe(g);
    for (let i = 0; i < 6; i++) {
      g = updateKidsGame(g, 'start', 0);
      g = updateKidsGame(g, 'tick', 30000);
      g = updateKidsGame(g, 'reveal', 30000);
      g = updateKidsGame(g, 'next', 30000);
    }
    expect(g.phase).toBe('finished');
    expect(g.index).toBe(5);
    expect(kidsPrimaryAction('moving')).toBeNull();
    expect(kidsPrimaryAction('locked')).toBe('reveal');
    expect(kidsPrimaryAction('revealed')).toBe('next');
  });
});
