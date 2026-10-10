import type {
  Action,
  ApiErrorBody,
  BluffListResponse,
  BluffStatus,
  PoolResponse,
  PublicRoomsResponse,
  RecapCreatedResponse,
  RecapResponse,
  RoomView,
  SessionResponse,
  Settings,
  ViewResponse,
} from '../../shared/types';
import { clock } from './clock';
import { seenQuestions } from './seen';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<T> {
  const sent = Date.now();
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('network', 'Keine Verbindung zum Spielserver.', 0);
  }
  const received = Date.now();
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* leer */
  }
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiError(err?.code ?? 'http', err?.message ?? `Fehler ${res.status}`, res.status);
  }
  const view = (data as { view?: RoomView } | null)?.view;
  if (view) clock.sample(view.serverNow, sent, received);
  return data as T;
}

export const api = {
  createRoom(name: string, plays: boolean, settings: Settings, bot = false) {
    return request<SessionResponse>('POST', '/api/rooms', { name, plays, settings, bot, seen: seenQuestions() });
  },
  join(code: string, name: string, reclaim = false) {
    return request<SessionResponse>('POST', `/api/rooms/${encodeURIComponent(code)}/join`, { name, reclaim, seen: seenQuestions() });
  },
  state(code: string, token: string | null) {
    return request<ViewResponse>('GET', `/api/rooms/${encodeURIComponent(code)}`, undefined, token);
  },
  action(code: string, token: string, action: Action) {
    return request<ViewResponse>('POST', `/api/rooms/${encodeURIComponent(code)}/action`, action, token);
  },
  publicRooms() {
    return request<PublicRoomsResponse>('GET', '/api/rooms');
  },
  pool() {
    return request<PoolResponse>('GET', '/api/pool');
  },
  createRecap(code: string) {
    return request<RecapCreatedResponse>('POST', `/api/rooms/${encodeURIComponent(code)}/recap`);
  },
  recap(id: string) {
    return request<RecapResponse>('GET', `/api/recaps/${encodeURIComponent(id)}`);
  },
  adminBluffs(key: string, status: BluffStatus) {
    return request<BluffListResponse>('GET', `/api/admin/bluffs?status=${status}`, undefined, key);
  },
  adminDecide(key: string, decision: { questionId: string; key: string; status: BluffStatus; text: string }) {
    return request<{ ok: true }>('POST', '/api/admin/bluffs', decision, key);
  },
};

/** Fehler, nach denen weiteres Abfragen sinnlos ist */
export function isFatal(err: unknown): err is ApiError {
  return err instanceof ApiError && [401, 403, 404, 410].includes(err.status);
}
