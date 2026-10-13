import { describe, expect, it } from 'vitest';
import { createApi } from '../src/server/api';
import { matchingQuestions, pickQuestions, sanitizeSettings, withSettingDefaults } from '../src/server/engine';
import { getQuestion } from '../src/server/questions';
import { MemoryStore } from '../src/server/store';
import { PACK_QUESTIONS, inTopicPack } from '../src/server/topic-packs';
import { ALL_CATEGORIES, DEFAULT_SETTINGS } from '../src/shared/rules';
import { TOPIC_PACKS } from '../src/shared/topic-packs';
import type { PoolResponse, TopicPackId } from '../src/shared/types';
import { poolCount } from '../src/client/lib/pool';
import { seeded } from './helpers';

for (const lang of ['de', 'en'] as const) {
  describe(`Themenpakete (${lang})`, () => {
    it.each(TOPIC_PACKS.map((p) => p.id))('%s bietet genug Fragen und begrenzt auch Ersatzfragen', (topicPack) => {
      const settings = { ...DEFAULT_SETTINGS, lang, topicPack };
      const all = matchingQuestions(settings);
      expect(all.length).toBeGreaterThanOrEqual(12);
      expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
      const selected = pickQuestions(settings, new Set(), 12, seeded(72));
      expect(selected.main).toHaveLength(12);
      for (const id of [...selected.main, ...selected.spare]) expect(inTopicPack(getQuestion(id, lang), topicPack)).toBe(true);
      if (topicPack === 'neulinge') expect(all.every((q) => q.difficulty === 1)).toBe(true);
    });

    it('zeigt genau die spielbare Anzahl auch bei eingegrenzten Kategorien und Rundenarten', async () => {
      const api = createApi({ store: new MemoryStore() });
      const response = await api(new Request(`http://test/api/pool?lang=${lang}`));
      const pool = await response.json() as PoolResponse;
      for (const topicPack of TOPIC_PACKS.map((p) => p.id)) {
        for (const roundType of ['fragen', 'luecken', 'gemischt'] as const) {
          for (const categories of [ALL_CATEGORIES, ['evangelien'] as const, ['at'] as const]) {
            const settings = { ...DEFAULT_SETTINGS, lang, topicPack, roundType, categories: [...categories] };
            expect(poolCount(pool, settings)).toBe(matchingQuestions(settings).length);
          }
        }
      }
      expect(JSON.stringify(pool)).not.toMatch(/answer|discovery|bluffs|accept|prompt/);
    });
  });
}

it('validiert Pakete und lehnt leere Kombinationen ab, während alte Räume weiter funktionieren', () => {
  for (const id of Object.values(PACK_QUESTIONS).flat()) expect(() => getQuestion(id, 'de')).not.toThrow();
  expect(() => sanitizeSettings({ topicPack: 'falsch' as TopicPackId })).toThrow('Unbekanntes Themenpaket');
  expect(() => sanitizeSettings({ topicPack: 'tiere', categories: ['offenbarung'] })).toThrow('keine Fragen');
  const legacy = withSettingDefaults({ rounds: 4 });
  expect(matchingQuestions(legacy).length).toBe(matchingQuestions(DEFAULT_SETTINGS).length);
  const clear = sanitizeSettings({ topicPack: null }, { ...DEFAULT_SETTINGS, topicPack: 'tiere' });
  expect(matchingQuestions(clear).length).toBe(matchingQuestions(DEFAULT_SETTINGS).length);
});
