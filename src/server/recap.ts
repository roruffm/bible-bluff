// Entdeckungen zum Mitnehmen: Nach dem Spiel bleibt eine teilbare Seite mit allen Fragen,
// Antworten, Bibelstellen und Lieblingsbluffs. Sie enthält bewusst keine Namen und hängt nicht
// am Raum: Räume werden nach einiger Zeit gelöscht, die Seite bleibt.

import type { RecapView } from '../shared/types';
import { getQuestion } from './questions';
import type { RoomState } from './state';

/** Ohne 0/O, 1/l/i – gut abzutippen, falls jemand den Link vorliest */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const ID_LENGTH = 10;

export function randomRecapId(): string {
  const buf = new Uint8Array(ID_LENGTH * 2);
  crypto.getRandomValues(buf);
  let id = '';
  for (const b of buf) {
    // Werte oberhalb des größten Vielfachen verwerfen, damit jedes Zeichen gleich wahrscheinlich ist
    if (b >= 256 - (256 % ALPHABET.length)) continue;
    id += ALPHABET[b % ALPHABET.length];
    if (id.length === ID_LENGTH) return id;
  }
  return id + randomRecapId().slice(0, ID_LENGTH - id.length);
}

export function isRecapId(value: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${ID_LENGTH}}$`).test(value);
}

/** Stellt die Seite aus einer beendeten Partie zusammen – deterministisch, damit doppelte Anfragen dasselbe speichern. */
export function buildRecap(state: RoomState, id: string): RecapView {
  const g = state.game!;
  return {
    id,
    playedAt: g.finishedAt ?? g.phaseStartedAt,
    players: state.players.filter((p) => p.plays).length,
    items: g.history.map((h) => {
      const q = getQuestion(h.questionId);
      return {
        book: q.book,
        group: q.group,
        prompt: q.prompt,
        answer: q.answer,
        ref: q.ref,
        discovery: q.discovery,
        favorites: (h.favorites ?? []).map((f) => f.text),
      };
    }),
  };
}
