import { useCallback, useEffect, useState } from 'preact/hooks';
import { BLUFF_MAX } from '../../shared/rules';
import type { BluffCandidateView, BluffStatus, NicknameView, NicknamesResponse } from '../../shared/types';
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
 * Geschützter Adminbereich für gespielte Nicknamen und die Freigabe frischer Hausbluffs.
 */
export function AdminPage() {
  const [key, setKey] = useState(storedKey);
  const [draft, setDraft] = useState('');
  const [section, setSection] = useState<'nicknames' | 'bluffs'>('nicknames');
  const [tab, setTab] = useState<BluffStatus>('new');
  const [items, setItems] = useState<BluffCandidateView[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Adminbereich – Bible Bluff';
  }, []);

  const authError = useCallback((err: ApiError) => {
    if (err.code === 'admin_denied' || err.code === 'admin_off') {
      setError(err);
      rememberKey('');
      setKey('');
      setItems(null);
    }
  }, []);

  useEffect(() => {
    if (!key || section !== 'bluffs') return;
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
        authError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [key, tab, section, authError]);

  if (!key) {
    return (
      <main class="page admin">
        <header class="page-head">
          <Logo small />
        </header>
        <section class="card stack">
          <h1>Adminbereich</h1>
          <p class="muted">
            Gespielte Nicknamen ansehen und frische Hausbluffs freigeben. Melde dich mit deinem Admin-Schlüssel an.
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
              setError(null);
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
            setItems(null);
          }}
        >
          Abmelden
        </button>
      </header>
      <h1>Adminbereich</h1>
      <Segmented label="Bereich" value={section} options={[
        { value: 'nicknames', label: 'Nicknamen' },
        { value: 'bluffs', label: 'Hausbluffs' },
      ]} onChange={setSection} />
      {section === 'nicknames' ? <AdminNicknames adminKey={key} onAuthError={authError} /> : <>
      <h2>Frische Hausbluffs</h2>
      <p class="muted small">
        Diese Bluffs haben in echten Partien mindestens zwei Leute reingelegt oder zwei Herzen bekommen. Die Bluffs
        werden ohne Namen gespeichert. Freigegebene Bluffs ergänzen die Hausbluffs und Vorschläge der Frage.
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
      </>}
      <Button variant="ghost" block onClick={() => navigate('/')}>
        Zur Startseite
      </Button>
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}

function AdminNicknames({ adminKey, onAuthError }: { adminKey: string; onAuthError: (err: ApiError) => void }) {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<NicknamesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    api.adminNicknames(adminKey, search, offset).then((res) => {
      if (cancelled) return;
      if (offset && !res.items.length) setOffset(Math.max(0, offset - 50));
      else setData(res);
    }).catch((err: unknown) => {
      if (cancelled) return;
      const e = err instanceof ApiError ? err : new ApiError('http', 'Die Nicknamen laden gerade nicht.', 0);
      setError(e.message);
      onAuthError(e);
    });
    return () => { cancelled = true; };
  }, [adminKey, search, offset, revision, onAuthError]);

  const remove = async (item: NicknameView) => {
    if (!window.confirm(`„${item.name}“ aus der Liste entfernen? Bei einer neuen Spielteilnahme kann der Name wieder erscheinen.`)) return;
    setDeleting(item.key);
    setError(null);
    try {
      await api.adminDeleteNickname(adminKey, item.key);
      setRevision((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entfernen hat nicht geklappt.');
      if (err instanceof ApiError) onAuthError(err);
    } finally {
      setDeleting(null);
    }
  };
  const date = (at: number) => new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin',
  }).format(at);

  return <section class="stack admin-nicknames" aria-labelledby="nickname-heading">
    <h2 id="nickname-heading">Gespielte Nicknamen</h2>
    <p class="muted small">
      Erfasst werden menschliche Mitspielende ab Spielstart, auch bei späterem Beitritt. Der Bot und reine
      Spielleitungen zählen nicht mit. Die Liste bleibt nach dem Löschen eines Spielraums bestehen.
      Gleiche Nicknamen können zu verschiedenen Personen gehören.
    </p>
    <form class="row admin-search" onSubmit={(e) => {
      e.preventDefault(); setSearch(draft.trim()); setOffset(0); setRevision((n) => n + 1);
    }}>
      <label class="field">
        <span>Nickname suchen</span>
        <input type="search" value={draft} maxLength={80} onInput={(e) => setDraft(e.currentTarget.value)} placeholder="Name oder Teil des Namens" />
      </label>
      <Button type="submit" small>Suchen</Button>
    </form>
    <div class="row admin-nickname-summary">
      <p class="muted small" aria-live="polite">{data ? `${data.total} ${data.total === 1 ? 'Nickname' : 'Nicknamen'}${search ? ' gefunden' : ' erfasst'}` : 'Liste wird geladen …'}</p>
      <Button variant="ghost" small onClick={() => setRevision((n) => n + 1)}>Aktualisieren</Button>
    </div>
    {error && <p class="error" role="alert">{error}</p>}
    {!data && !error && <div class="loader" aria-label="Nicknamen werden geladen" />}
    {data?.items.length === 0 && <p class="notice">{search
      ? 'Kein Nickname passt zur Suche.'
      : 'Noch keine Nicknamen erfasst. Die Liste füllt sich mit den nächsten gespielten Partien. Bereits gelöschte Spielräume lassen sich nicht nachträglich auswerten.'}</p>}
    <ul class="admin-list">
      {data?.items.map((item) => <li class="card admin-nickname" key={item.key}>
        <div class="row admin-nickname-summary">
          <strong class="admin-nickname-name">{item.name}</strong>
          <Button variant="ghost" small disabled={deleting !== null} onClick={() => void remove(item)}>Entfernen</Button>
        </div>
        <dl class="admin-nickname-dates small">
          <div><dt>Erstmals erfasst</dt><dd><time dateTime={new Date(item.firstPlayedAt).toISOString()}>{date(item.firstPlayedAt)}</time></dd></div>
          <div><dt>Zuletzt erfasst</dt><dd><time dateTime={new Date(item.lastPlayedAt).toISOString()}>{date(item.lastPlayedAt)}</time></dd></div>
        </dl>
      </li>)}
    </ul>
    {data && (offset > 0 || data.nextOffset !== null) && <nav class="row admin-nickname-summary" aria-label="Nicknamen-Seiten">
      <Button variant="secondary" small disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Zurück</Button>
      <span class="small">{offset + 1}–{offset + data.items.length} von {data.total}</span>
      <Button variant="secondary" small disabled={data.nextOffset === null} onClick={() => setOffset(data.nextOffset ?? offset)}>Weiter</Button>
    </nav>}
  </section>;
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
