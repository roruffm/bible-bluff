import { BLUFF_MAX } from '../../shared/rules';

// Ein Entwurf je Raum und Person, nur in diesem Browser-Tab. Kein Senden an den Server.
const PREFIX = 'bible-bluff:v1:draft:';
export function draftKey(code: string, playerId: string): string {
  return `${PREFIX}${code}:${playerId}`;
}

export function loadDraft(key: string, roundId: string, submitted?: string | null): string | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    if (typeof draft !== 'object' || !draft) return null;
    const { round, text } = draft as { round?: unknown; text?: unknown };
    if (round !== roundId || typeof text !== 'string' || text.trim().replace(/\s+/g, ' ') === submitted) {
      sessionStorage.removeItem(key);
      return null;
    }
    return text.slice(0, BLUFF_MAX);
  } catch {
    return null;
  }
}

export function saveDraft(key: string, roundId: string, text: string) {
  try {
    if (text) sessionStorage.setItem(key, JSON.stringify({ round: roundId, text: text.slice(0, BLUFF_MAX) }));
    else sessionStorage.removeItem(key);
  } catch {
    // Auch bei gesperrtem Speicher bleibt die Eingabe nutzbar.
  }
}

export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Gesperrter Speicher.
  }
}
