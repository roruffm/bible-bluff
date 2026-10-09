// „Neues für alle“: Jedes Gerät merkt sich, welche Fragen es schon aufgelöst gesehen hat, und meldet
// sie beim Eröffnen oder Beitreten. Der Server zieht dann bevorzugt Fragen, die hier noch niemand kennt.
// Gespeichert werden nur Frage-IDs, nur auf diesem Gerät.

import { SEEN_SEND_MAX, SEEN_STORE_MAX } from '../../shared/rules';

const KEY = 'bible-bluff:v1:seen';

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Die zuletzt gesehenen Fragen, neueste zuerst – so viele, wie der Server annimmt */
export function seenQuestions(): string[] {
  return read().slice(-SEEN_SEND_MAX).reverse();
}

export function markSeen(questionId: string) {
  const list = read().filter((id) => id !== questionId);
  list.push(questionId);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-SEEN_STORE_MAX)));
  } catch {
    /* privater Modus – dann eben ohne Gedächtnis */
  }
}
