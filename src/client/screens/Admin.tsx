import { useEffect, useState } from 'preact/hooks';
import { BLUFF_MAX } from '../../shared/rules';
import type { BluffCandidateView, BluffStatus } from '../../shared/types';
import { Button, Logo, QuestionText, Segmented, Toast } from '../components/ui';
import { ApiError, api } from '../lib/api';
import { navigate } from '../lib/router';

const KEY_STORAGE = 'bible-bluff:v1:admin-key';

function storedKey(): string {
  try {
    return window.localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

function rememberKey(key: string) {
  try {
    if (key) window.localStorage.setItem(KEY_STORAGE, key);
    else window.localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* privater Modus – dann eben jedes Mal eingeben */
  }
}

const TABS: { value: BluffStatus; label: string }[] = [
  { value: 'new', label: 'Neu' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' },
];

/**
 * Freigabe frischer Hausbluffs: Bluffs, die in echten Partien viele reingelegt oder viele Herzen
 * bekommen haben. Erst nach einem Tipp auf „Aufnehmen“ tauchen sie als Hausbluffs und Vorschläge auf.
 */
export function AdminPage() {
  const [key, setKey] = useState(storedKey);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<BluffStatus>('new');
  const [items, setItems] = useState<BluffCandidateView[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Freigabe – Bible Bluff';
  }, []);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .adminBluffs(key, tab)
      .then((res) => !cancelled && setItems(res.items))
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof ApiError ? err : new ApiError('http', 'Die Liste lädt gerade nicht.', 0);
        setError(e);
        if (e.code === 'admin_denied') {
          rememberKey('');
          setKey('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, tab]);

  if (!key) {
    return (
      <main class="page admin">
        <header class="page-head">
          <Logo small />
        </header>
        <section class="card stack">
          <h1>Frische Hausbluffs</h1>
          <p class="muted">
            Starke Bluffs aus echten Partien prüfen und freigeben. Dafür brauchst du den Schlüssel, der im
            Cloudflare-Dashboard als Secret <code>ADMIN_KEY</code> hinterlegt ist.
          </p>
          {error?.code === 'admin_off' && <p class="notice">{error.message} Lege zuerst das Secret ADMIN_KEY an.</p>}
          {error?.code === 'admin_denied' && (
            <p class="error" role="alert">
              {error.message}
            </p>
          )}
          <form
            class="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const k = draft.trim();
              if (!k) return;
              rememberKey(k);
              setKey(k);
            }}
          >
            <label class="field">
              <span>Schlüssel</span>
              <input type="password" value={draft} autocomplete="current-password" onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)} />
            </label>
            <Button type="submit" block disabled={!draft.trim()}>
              Anmelden
            </Button>
          </form>
        </section>
      </main>
    );
  }

  const decided = (item: BluffCandidateView, status: BluffStatus) => {
    setItems((list) => (list ?? []).filter((i) => !(i.questionId === item.questionId && i.key === item.key)));
    setToast(status === 'approved' ? 'Aufgenommen' : status === 'rejected' ? 'Abgelehnt' : 'Zurückgestellt');
  };

  return (
    <main class="page admin">
      <header class="page-head admin-head">
        <Logo small />
        <button
          class="btn btn-ghost btn-small"
          onClick={() => {
            rememberKey('');
            setKey('');
          }}
        >
          Abmelden
        </button>
      </header>
      <h1>Frische Hausbluffs</h1>
      <p class="muted small">
        Diese Bluffs haben in echten Partien mindestens zwei Leute reingelegt oder zwei Herzen bekommen. Namen werden
        nie gespeichert. Freigegebene Bluffs ergänzen die Hausbluffs und Vorschläge der Frage.
      </p>
      <Segmented label="Status" value={tab} options={TABS} onChange={setTab} />

      {error && error.code !== 'admin_denied' && (
        <p class="error" role="alert">
          {error.message}
        </p>
      )}
      {!items && !error && <div class="loader" aria-label="Lädt" />}
      {items && items.length === 0 && (
        <p class="muted center">{tab === 'new' ? 'Gerade nichts zu prüfen.' : 'Hier ist noch nichts.'}</p>
      )}
      <ul class="admin-list">
        {items?.map((item) => (
          <AdminItem key={`${item.questionId}:${item.key}`} adminKey={key} item={item} onDecided={(s) => decided(item, s)} />
        ))}
      </ul>
      <Button variant="ghost" block onClick={() => navigate('/')}>
        Zur Startseite
      </Button>
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}

function AdminItem({
  adminKey,
  item,
  onDecided,
}: {
  adminKey: string;
  item: BluffCandidateView;
  onDecided: (status: BluffStatus) => void;
}) {
  const [text, setText] = useState(item.text);
  const [error, setError] = useState<string | null>(null);
  const decide = async (status: BluffStatus) => {
    setError(null);
    try {
      await api.adminDecide(adminKey, { questionId: item.questionId, key: item.key, status, text });
      onDecided(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das ging nicht.');
    }
  };
  const q = item.question;
  return (
    <li class="card admin-item">
      {q ? (
        <div class="admin-q">
          <p class="admin-prompt">
            <QuestionText prompt={q.prompt} />
          </p>
          <p class="admin-answer">
            ✓ {q.answer} <span class="muted small">· {q.ref}</span>
          </p>
          <p class="muted small">Bisherige Hausbluffs: {q.houseBluffs.map((b) => `„${b}“`).join(' · ')}</p>
        </div>
      ) : (
        <p class="muted small">Diese Frage gibt es nicht mehr ({item.questionId}).</p>
      )}
      <label class="field">
        <span>Bluff</span>
        <input value={text} maxLength={BLUFF_MAX} onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)} />
      </label>
      <p class="admin-stats small">
        {item.fooled} reingelegt · {item.likes} {item.likes === 1 ? 'Herz' : 'Herzen'}
        {item.times > 1 ? ` · ${item.times}× stark` : ''}
      </p>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <div class="row">
        {item.status !== 'approved' && (
          <Button variant="gold" small disabled={!q || !text.trim()} onClick={() => decide('approved')}>
            Aufnehmen
          </Button>
        )}
        {item.status !== 'rejected' && (
          <Button variant="secondary" small onClick={() => decide('rejected')}>
            {item.status === 'approved' ? 'Wieder entfernen' : 'Ablehnen'}
          </Button>
        )}
        {item.status === 'rejected' && (
          <Button variant="ghost" small onClick={() => decide('new')}>
            Zurück zu „Neu“
          </Button>
        )}
      </div>
    </li>
  );
}
