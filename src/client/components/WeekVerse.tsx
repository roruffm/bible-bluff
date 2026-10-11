// „Mein Vers für die Woche“: ein Vers passend zur Partie – als Sperrbildschirm-Bild und auf Wunsch mit
// sieben Kalender-Erinnerungen. Am Endstand und auf der Entdeckungen-Seite; alles bleibt auf dem Handy.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { REMINDER_TIMES, type ReminderTime } from '../../shared/calendar';
import type { BookGroup } from '../../shared/types';
import { VERSE_SOURCE, suggestVerses, type WeekVerse } from '../../shared/verses';
import { type VerseImage, tomorrow, verseImage } from '../lib/verse-image';
import { Button, Segmented, Toast } from './ui';

export function WeekVerseCard({ items }: { items: { book: string; group: BookGroup; key?: string }[] }) {
  const signature = items.map((i) => `${i.key ?? ''}:${i.book}`).join('|');
  const options = useMemo(() => suggestVerses(items), [signature]);
  const [chosen, setChosen] = useState<WeekVerse | null>(null);
  const [image, setImage] = useState<VerseImage | null>(null);
  const [time, setTime] = useState<ReminderTime>('0730');
  const [toast, setToast] = useState<string | null>(null);

  // Das Bild entsteht gleich beim Auswählen – so kann „Sichern“ direkt nach dem Tippen teilen (iOS verlangt das)
  useEffect(() => {
    if (!chosen) return;
    let alive = true;
    setImage(null);
    verseImage(chosen)
      .then((img) => alive && setImage(img))
      .catch(() => alive && setToast('Das Bild ließ sich gerade nicht erstellen.'));
    return () => {
      alive = false;
    };
  }, [chosen?.id]);

  const save = async () => {
    if (!image) return;
    try {
      if (navigator.canShare?.({ files: [image.file] })) {
        await navigator.share({ files: [image.file], title: 'Mein Vers für die Woche' });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.file.name;
    link.click();
    setToast('Bild gespeichert');
  };

  return (
    <section class="card week-verse" aria-labelledby="week-verse-title">
      <h2 class="card-title" id="week-verse-title">
        Mein Vers für die Woche
      </h2>
      <p class="muted small">
        Such dir einen Vers aus, der dich durch die Woche begleitet – als Bild für den Sperrbildschirm und, wenn du magst, mit
        einer täglichen Erinnerung.
      </p>
      <div class="verse-choices" role="radiogroup" aria-label="Vers auswählen">
        {options.map((v) => (
          <button
            type="button"
            role="radio"
            aria-checked={chosen?.id === v.id}
            class={`verse-choice${chosen?.id === v.id ? ' is-on' : ''}`}
            onClick={() => setChosen(v)}
          >
            <span class="verse-text">„{v.text}“</span>
            <span class="verse-ref">{v.ref}</span>
          </button>
        ))}
      </div>

      {chosen && (
        <div class="verse-result stack">
          <div class="verse-preview">
            {image ? (
              <img src={image.url} alt={`Sperrbildschirm mit ${chosen.ref}: ${chosen.text}`} width={1170} height={2532} />
            ) : (
              <div class="loader" aria-label="Bild entsteht" />
            )}
          </div>
          <Button block raised disabled={!image} onClick={save}>
            Als Sperrbildschirm sichern
          </Button>
          <p class="muted small center">
            Im Teilen-Menü „Bild sichern“ wählen, dann in den Fotos als Hintergrund festlegen.
          </p>
          <div class="field">
            <span>Tägliche Erinnerung (7 Tage, ab morgen)</span>
            <Segmented
              label="Uhrzeit der Erinnerung"
              value={time}
              options={REMINDER_TIMES.map((t) => ({ value: t.value, label: t.label }))}
              onChange={setTime}
            />
          </div>
          <a
            class="btn btn-secondary btn-block"
            href={`/api/kalender?vers=${encodeURIComponent(chosen.id)}&ab=${tomorrow()}&zeit=${time}`}
          >
            In den Kalender eintragen
          </a>
          <p class="muted small">
            Dein Handykalender erinnert dich eine Woche lang an den Vers, jeden Tag mit einem kleinen Gedanken – ohne App und
            ohne Anmeldung. Wortlaut: {VERSE_SOURCE}.
          </p>
        </div>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </section>
  );
}
