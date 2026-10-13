import { expect, it } from 'vitest';
import { practiceFeedback } from '../src/client/lib/practice';

it('hilft bei leeren, doppelten, wahren und eigenständigen deutschen Bluffs', () => {
  expect(practiceFeedback('  ', 'de')).toBe('empty');
  expect(practiceFeedback('x'.repeat(121), 'de')).toBe('long');
  expect(practiceFeedback('In einem Fischmaul', 'de')).toBe('truth');
  expect(practiceFeedback('Im Maul des Fisches.', 'de')).toBe('truth');
  expect(practiceFeedback('in einem BROTLAIB', 'de')).toBe('duplicate');
  expect(practiceFeedback('In einem Vogelnest!', 'de')).toBe('duplicate');
  expect(practiceFeedback('Im Henkel eines Wasserkrugs.', 'de')).toBe('ready');
});

it('prüft auch auf Englisch, ohne eine angebliche Erfolgsquote zu berechnen', () => {
  expect(practiceFeedback('Inside a fish', 'en')).toBe('truth');
  expect(practiceFeedback('In the mouth of a fish', 'en')).toBe('truth');
  expect(practiceFeedback('In a loaf of bread!', 'en')).toBe('duplicate');
  expect(practiceFeedback('In a bird’s nest.', 'en')).toBe('duplicate');
  expect(practiceFeedback('In a tax collector’s sandal.', 'en')).toBe('ready');
});
