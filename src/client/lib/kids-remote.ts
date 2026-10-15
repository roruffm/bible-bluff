import { useEffect, useRef, useState } from 'preact/hooks';
import type { KidsGame } from '../../shared/kids-game';
import { packKidsGame, type KidsCredentials, type KidsRemoteAction, type KidsRemoteCreated, type KidsRemoteView } from '../../shared/kids-remote';

const KEYS = { display: 'bb:kids:display', control: 'bb:kids:control' };
class RemoteError extends Error { constructor(message: string, public status: number) { super(message); } }
function valid(value: unknown): value is KidsCredentials {
  if (!value || typeof value !== 'object') return false;
  const c = value as KidsCredentials;
  return /^[a-f0-9]{32}$/.test(c.id) && /^[a-f0-9]{48}$/.test(c.token) && (c.remoteToken === undefined || /^[a-f0-9]{48}$/.test(c.remoteToken));
}
function initial(mode: 'display' | 'control'): KidsCredentials | null {
  try {
    if (mode === 'control' && location.hash) {
      const params = new URLSearchParams(location.hash.slice(1));
      const c = { id: params.get('id') ?? '', token: params.get('key') ?? '' };
      if (valid(c)) { sessionStorage.setItem(KEYS.control, JSON.stringify(c)); history.replaceState(null, '', location.pathname); return c; }
    }
    const c: unknown = JSON.parse(sessionStorage.getItem(KEYS[mode]) ?? 'null');
    return valid(c) ? c : null;
  } catch { return null; }
}
async function request<T>(method: string, path: string, data?: unknown, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const sent = Date.now();
  try {
    const response = await fetch(path, { method, cache: 'no-store', signal: controller.signal, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(data === undefined ? {} : { 'content-type': 'application/json' }) }, body: data === undefined ? undefined : JSON.stringify(data) });
    const json = await response.json();
    if (!response.ok) throw new RemoteError(json.error?.message ?? 'Das hat nicht geklappt.', response.status);
    // Derselbe Zeitpunkt auf beiden Geräten, auch wenn deren Uhren verschieden gestellt sind.
    if (json.game && typeof json.serverNow === 'number' && json.game.deadline !== null) json.game.deadline += (sent + Date.now()) / 2 - json.serverNow;
    return json as T;
  } catch (err) {
    if (err instanceof RemoteError) throw err;
    throw new RemoteError('Verbindung unterbrochen. Es wird erneut verbunden …', 0);
  } finally { clearTimeout(timeout); }
}
export function kidsControlUrl(credentials: KidsCredentials): string {
  return `${location.origin}/kids/steuerung#${new URLSearchParams({ id: credentials.id, key: credentials.remoteToken ?? credentials.token })}`;
}

/** Nur auf Wunsch aktiv. Die lokale Partie funktioniert weiterhin ohne Fernbedienungs-Server. */
export function useKidsRemote(mode: 'display' | 'control', onGame: (game: KidsGame) => void) {
  const [credentials, setCredentials] = useState<KidsCredentials | null>(() => initial(mode));
  const [view, setView] = useState<KidsRemoteView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState(false);
  const state = useRef({ credentials, view, epoch: 0, pending: false, onGame });
  state.current.onGame = onGame;
  const save = (c: KidsCredentials | null) => {
    state.current.credentials = c; state.current.epoch++;
    setCredentials(c);
    try { if (c) sessionStorage.setItem(KEYS[mode], JSON.stringify(c)); else sessionStorage.removeItem(KEYS[mode]); } catch { /* für diese Sitzung reicht der Arbeitsspeicher */ }
  };
  const apply = (next: KidsRemoteView, epoch: number) => {
    if (state.current.epoch !== epoch || (state.current.view && next.id === state.current.view.id && next.version < state.current.view.version)) return;
    state.current.view = next; setView(next); setError(''); setFatal(false); state.current.onGame(next.game);
  };
  const fail = (err: unknown, epoch: number) => {
    if (state.current.epoch !== epoch) return;
    setError(err instanceof Error ? err.message : 'Keine Verbindung.');
    if (err instanceof RemoteError && [401, 403, 404, 410].includes(err.status)) {
      setFatal(true);
      if (mode === 'display') { save(null); state.current.view = null; setView(null); }
    }
  };
  useEffect(() => {
    if (mode !== 'control') return;
    const change = () => {
      if (!location.hash) return;
      const next = initial('control');
      if (next) { save(next); state.current.view = null; setView(null); setFatal(false); setError(''); }
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (!credentials) return;
    let alive = true; let polling = false; let timer: number | undefined;
    const epoch = state.current.epoch;
    const poll = async () => {
      if (!alive || polling) return;
      polling = true;
      try {
        const next = await request<KidsRemoteView>('GET', `/api/kids-remotes/${credentials.id}`, undefined, credentials.token);
        if (alive) apply(next, epoch);
      } catch (err) {
        if (alive) fail(err, epoch);
        if (err instanceof RemoteError && [401, 403, 404, 410].includes(err.status)) alive = false;
      }
      polling = false;
      if (alive && state.current.epoch === epoch) timer = window.setTimeout(poll, 1000);
    };
    void poll();
    const refresh = () => { if (!document.hidden) { clearTimeout(timer); void poll(); } };
    document.addEventListener('visibilitychange', refresh);
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [credentials?.id, credentials?.token]);
  const connect = async (game: KidsGame, easy: boolean) => {
    if (state.current.pending || state.current.credentials) return;
    state.current.pending = true; setBusy(true); setError('');
    const epoch = state.current.epoch;
    try {
      const created = await request<KidsRemoteCreated>('POST', '/api/kids-remotes', { game: packKidsGame(game, Date.now()), easy });
      if (state.current.epoch !== epoch) { await request('DELETE', `/api/kids-remotes/${created.id}`, undefined, created.ownerToken); return; }
      save({ id: created.id, token: created.ownerToken, remoteToken: created.remoteToken });
      apply(created, state.current.epoch);
    } catch (err) { fail(err, epoch); } finally { state.current.pending = false; setBusy(false); }
  };
  const send = async (action: KidsRemoteAction) => {
    const { credentials: c, view: current, epoch } = state.current;
    if (!c || !current || state.current.pending || fatal) return;
    state.current.pending = true; setBusy(true);
    try {
      const next = await request<KidsRemoteView>('POST', `/api/kids-remotes/${c.id}/action`, { action, version: current.version }, c.token);
      apply(next, epoch);
    } catch (err) {
      if (err instanceof RemoteError && err.status === 409) {
        try { apply(await request<KidsRemoteView>('GET', `/api/kids-remotes/${c.id}`, undefined, c.token), epoch); } catch (refreshError) { fail(refreshError, epoch); }
      } else fail(err, epoch);
    } finally { state.current.pending = false; setBusy(false); }
  };
  const disconnect = async () => {
    const c = state.current.credentials;
    save(null); state.current.view = null; setView(null); setError(''); setFatal(false);
    if (c && mode === 'display') try { await request('DELETE', `/api/kids-remotes/${c.id}`, undefined, c.token); } catch { /* der Link läuft auch ohne erneute Verbindung ab */ }
  };
  return { active: !!credentials, credentials, view, error, busy, fatal, restoring: !!credentials && !view && !error, connect, send, disconnect };
}
