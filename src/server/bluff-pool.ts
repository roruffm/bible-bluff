// Frische Hausbluffs: Bluffs, die in echten Partien viele reingelegt oder viele Herzen bekommen haben,
// werden ohne Namen gesammelt. Erst nach Freigabe auf /admin kommen sie als Hausbluffs und Vorschläge ins Spiel.

import type { BluffCandidateView } from '../shared/types';
import { getQuestion, hasQuestion } from './questions';
import type { RoomState } from './state';
import type { BluffCandidateInput, BluffRow } from './store';
import { canonical, isDuplicate, normalize } from './text';

/** Normalform, unter der gleiche Bluffs zusammengezählt werden */
export function bluffKey(text: string): string {
  return canonical(text) || normalize(text);
}

/** Kandidaten aus einer beendeten Partie – ohne Bluffs, die schon Hausbluffs der Frage sind */
export function candidatesFromGame(state: RoomState): BluffCandidateInput[] {
  const out: BluffCandidateInput[] = [];
  for (const h of state.game?.history ?? []) {
    if (!hasQuestion(h.questionId)) continue;
    const q = getQuestion(h.questionId);
    for (const b of h.strong ?? []) {
      const key = bluffKey(b.text);
      if (!key || q.bluffs.some((house) => isDuplicate(house, b.text))) continue;
      out.push({ questionId: q.id, key, text: b.text, fooled: b.fooled, likes: b.likes });
    }
  }
  return out;
}

/** Für die Freigabe-Seite: Kandidat samt Frage, Antwort und bisherigen Hausbluffs */
export function candidateView(row: BluffRow): BluffCandidateView {
  const q = hasQuestion(row.questionId) ? getQuestion(row.questionId) : null;
  return {
    questionId: row.questionId,
    key: row.key,
    text: row.text,
    fooled: row.fooled,
    likes: row.likes,
    times: row.times,
    status: row.status,
    updatedAt: row.updatedAt,
    question: q ? { prompt: q.prompt, answer: q.answer, ref: q.ref, houseBluffs: q.bluffs } : null,
  };
}
