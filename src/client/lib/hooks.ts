import { useEffect, useRef, useState } from 'preact/hooks';
import type { Action, RoomView } from '../../shared/types';
import { ApiError, api, isFatal } from './api';
import { clock } from './clock';
import { t } from './i18n';
import { clearDraft, draftKey } from './draft';
import { actionPhase } from './action-state';

/** Server-Zeit, die sich regelmäßig aktualisiert (für Timer und die Aufdeckung). */
export function useServerNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Abfragetakt: schnell, wo Fortschritt sichtbar ist – sparsamer, wo die Geräte selbst rechnen. */
function pollDelay(view: RoomView | null, failures: number): number {
  if (failures > 0) return Math.min(8000, 1000 * 2 ** (failures - 1));
  if (!view) return 1000;
  if (view.status === 'lobby') return 2000;
  if (view.status === 'finished') return 4000;
  if (view.paused) return 2000;
  switch (view.round?.phase) {
    case 'reveal':
      return 1500;
    case 'scores':
    case 'heartShow':
      return 2000;
    default:
      return 1000;
  }
}

function viewKey(view: RoomView) {
  return JSON.stringify({ ...view, serverNow: 0 });
}

export interface RoomConnection {
  view: RoomView | null;
  fatal: ApiError | null;
  offline: boolean;
  act: (action: Action, options?: { inline?: boolean }) => Promise<{ suggestion?: string }>;
  actionError: string | null;
  retryAction: () => Promise<void>;
  dismissActionError: () => void;
  refresh: () => void;
}

/**
 * Hält den Spielstand aktuell: etwa jede Sekunde abfragen, im Hintergrund pausieren,
 * nach Verbindungsabbrüchen geduldig wieder anklopfen.
 */
export function useRoom(code: string, token: string | null): RoomConnection {
  const [view, setView] = useState<RoomView | null>(null);
  const [fatal, setFatal] = useState<ApiError | null>(null);
  const [offline, setOffline] = useState(false);
  const [failed, setFailed] = useState<{ action: Action; message: string; phase: string } | null>(null);
  const failedRef = useRef<typeof failed>(null);
  const viewRef = useRef<RoomView | null>(null);
  const keyRef = useRef('');
  const pollRef = useRef<() => void>(() => {});

  const apply = (next: RoomView) => {
    if (next.me && (next.status !== 'playing' || next.round?.phase !== 'write' || next.heart)) {
      clearDraft(draftKey(code, next.me.id));
    }
    if (failedRef.current && failedRef.current.phase !== actionPhase(next)) dismissActionError();
    const key = viewKey(next);
    if (key === keyRef.current) return;
    keyRef.current = key;
    viewRef.current = next;
    setView(next);
  };

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let failures = 0;
    let inFlight = false;

    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      if (!stopped) timer = window.setTimeout(poll, ms);
    };

    const poll = async () => {
      if (stopped || inFlight) return;
      if (document.hidden) return; // weiter geht es bei visibilitychange
      inFlight = true;
      try {
        const res = await api.state(code, token);
        failures = 0;
        setOffline(false);
        apply(res.view);
        if (res.view.status === 'closed') stopped = true;
      } catch (err) {
        if (isFatal(err)) {
          setFatal(err);
          stopped = true;
        } else {
          failures++;
          if (failures >= 2) setOffline(true);
        }
      } finally {
        inFlight = false;
      }
      schedule(pollDelay(viewRef.current, failures));
    };

    const onVisible = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        poll();
      }
    };
    pollRef.current = () => {
      window.clearTimeout(timer);
      poll();
    };

    keyRef.current = '';
    viewRef.current = null;
    setView(null);
    setFatal(null);
    dismissActionError();
    setOffline(false);
    poll();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [code, token]);

  const dismissActionError = () => {
    failedRef.current = null;
    setFailed(null);
  };
  const fail = (action: Action, phase: string, err: unknown) => {
    const failure = { action, phase, message: err instanceof Error ? err.message : t('Das ging nicht.') };
    failedRef.current = failure;
    setFailed(failure);
  };

  const act = async (action: Action, options: { inline?: boolean } = {}) => {
    if (!token) throw new ApiError('unknown_session', t('Bitte tritt zuerst bei.'), 401);
    const phase = actionPhase(viewRef.current);
    try {
      const res = await api.action(code, token, action);
      dismissActionError();
      apply(res.view);
      return { suggestion: res.suggestion };
    } catch (err) {
      if (isFatal(err) && (err as ApiError).code !== 'not_host') setFatal(err as ApiError);
      else if (!options.inline && phase === actionPhase(viewRef.current)) fail(action, phase, err);
      throw err;
    }
  };

  const retryAction = async () => {
    const failure = failedRef.current;
    if (!failure) return;
    try {
      // Erst prüfen, ob die ursprüngliche Aktion trotz verloren gegangener Antwort schon wirksam war.
      const res = await api.state(code, token);
      apply(res.view);
      if (actionPhase(res.view) !== failure.phase) return;
      await act(failure.action);
    } catch (err) {
      if (isFatal(err) && err.code !== 'not_host') setFatal(err);
      else if (failedRef.current === failure) fail(failure.action, failure.phase, err);
    }
  };

  return { view, fatal, offline, act, actionError: failed?.message ?? null, retryAction, dismissActionError, refresh: () => pollRef.current() };
}

/** Kurzes Vibrieren auf Android – iOS ignoriert das stillschweigend. */
export function buzz(pattern: number | number[]) {
  try {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.(pattern);
  } catch {
    /* egal */
  }
}

/** Hält den Bildschirm während der Partie wach (wo der Browser es unterstützt). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        if (cancelled) lock.release().catch(() => {});
        else sentinel = lock;
      } catch {
        /* z. B. Energiesparmodus – dann eben nicht */
      }
    };
    const onVisible = () => {
      if (!document.hidden) request();
    };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
