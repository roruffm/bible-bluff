// „Mein Vers für die Woche“: ein Vers passend zur Partie – als Sperrbildschirm-Bild und auf Wunsch mit
// sieben Kalender-Erinnerungen. Am Endstand und auf der Entdeckungen-Seite; alles bleibt auf dem Handy.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { REMINDER_TIMES, type ReminderTime } from '../../shared/calendar';
import type { BookGroup } from '../../shared/types';
import { suggestVerses, verseSource, type WeekVerse } from '../../shared/verses';
import { currentLang, t } from '../lib/i18n';
import { type VerseImage, tomorrow, verseImage } from '../lib/verse-image';
import { Button, Segmented, Toast } from './ui';

export function WeekVerseCard({ items }: { items: { book: string; group: BookGroup; key?: string }[] }) {
  const lang = currentLang();
  const signature = items.map((i) => `${i.key ?? ''}:${i.book}`).join('|');
  const options = useMemo(() => suggestVerses(items, 4, lang), [signature, lang]);
  const [chosen, setChosen] = useState<WeekVerse | null>(null);
  const [image, setImage] = useState<VerseImage | null>(null);
  const [time, setTime] = useState<ReminderTime>('0730');
  const [toast, setToast] = useState<string | null>(null);

  // Das Bild entsteht gleich beim Auswählen – so kann „Sichern“ direkt nach dem Tippen teilen (iOS verlangt das)
  useEffect(() => {
    if (!chosen) return;
    let alive = true;
    setImage(null);
    verseImage(chosen, lang)
      .then((img) => alive && setImage(img))
      .catch(() => alive && setToast(t('Das Bild ließ sich gerade nicht erstellen.')));
    return () => {
      alive = false;
    };
  }, [chosen?.id, lang]);

  const save = async () => {
    if (!image) return;
    try {
      if (navigator.canShare?.({ files: [image.file] })) {
        await navigator.share({ files: [image.file], title: t('Mein Vers für die Woche') });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.file.name;
    link.click();
    setToast(t('Bild gespeichert'));
  };

  return (
    <section class="card week-verse" aria-labelledby="week-verse-title">
      <h2 class="card-title" id="week-verse-title">
        {t('Mein Vers für die Woche')}
      </h2>
      <p class="muted small">
        {t(
          'Such dir einen Vers aus, der dich durch die Woche begleitet – als Bild für den Sperrbildschirm und, wenn du magst, mit einer täglichen Erinnerung.',
        )}
      </p>
      <div class="verse-choices" role="radiogroup" aria-label={t('Vers auswählen')}>
        {options.map((v) => (
          <button
            type="button"
            role="radio"
            aria-checked={chosen?.id === v.id}
            class={`verse-choice${chosen?.id === v.id ? ' is-on' : ''}`}
            onClick={() => setChosen(v)}
          >
            <span class="verse-text">{t('„{text}“', { text: v.text })}</span>
            <span class="verse-ref">{v.ref}</span>
          </button>
        ))}
      </div>

      {chosen && (
        <div class="verse-result stack">
          <div class="verse-preview">
            {image ? (
              <img src={image.url} alt={t('Sperrbildschirm mit {ref}: {text}', { ref: chosen.ref, text: chosen.text })} width={1170} height={2532} />
            ) : (
              <div class="loader" aria-label={t('Bild entsteht')} />
            )}
          </div>
          <Button block raised disabled={!image} onClick={save}>
            {t('Als Sperrbildschirm sichern')}
          </Button>
          <p class="muted small center">{t('Im Teilen-Menü „Bild sichern“ wählen, dann in den Fotos als Hintergrund festlegen.')}</p>
          <div class="field">
            <span>{t('Tägliche Erinnerung (7 Tage, ab morgen)')}</span>
            <Segmented
              label={t('Uhrzeit der Erinnerung')}
              value={time}
              options={REMINDER_TIMES.map((r) => ({ value: r.value, label: t(r.label) }))}
              onChange={setTime}
            />
          </div>
          <a
            class="btn btn-secondary btn-block"
            href={`/api/kalender?vers=${encodeURIComponent(chosen.id)}&ab=${tomorrow()}&zeit=${time}${lang === 'en' ? '&lang=en' : ''}`}
          >
            {t('In den Kalender eintragen')}
          </a>
          <p class="muted small">
            {t(
              'Dein Handykalender erinnert dich eine Woche lang an den Vers, jeden Tag mit einem kleinen Gedanken – ohne App und ohne Anmeldung. Wortlaut: {source}.',
              { source: verseSource(lang) },
            )}
          </p>
        </div>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </section>
  );
}
