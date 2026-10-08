// Sitzungen pro Raum im Browser merken – damit ein Neuladen oder kurzer Abbruch nichts kostet.

export interface Session {
  code: string;
  token: string;
  playerId: string;
  name: string;
}

const PREFIX = 'bible-bluff:v1:';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSession(code: string): Session | null {
  try {
    const raw = storage()?.getItem(PREFIX + 'room:' + code);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  try {
    storage()?.setItem(PREFIX + 'room:' + session.code, JSON.stringify(session));
    storage()?.setItem(PREFIX + 'last', session.code);
    storage()?.setItem(PREFIX + 'name', session.name);
  } catch {
    /* privater Modus – dann eben ohne Wiedereinstieg */
  }
}

export function clearSession(code: string) {
  try {
    storage()?.removeItem(PREFIX + 'room:' + code);
    if (storage()?.getItem(PREFIX + 'last') === code) storage()?.removeItem(PREFIX + 'last');
  } catch {
    /* egal */
  }
}

export function lastRoom(): string | null {
  try {
    return storage()?.getItem(PREFIX + 'last') ?? null;
  } catch {
    return null;
  }
}

export function rememberedName(): string {
  try {
    return storage()?.getItem(PREFIX + 'name') ?? '';
  } catch {
    return '';
  }
}
