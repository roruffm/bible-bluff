import { useEffect, useState } from 'preact/hooks';
import type { AwardView } from '../../shared/types';
import { bluffStory } from '../lib/bluff-story';
import { currentLang, t } from '../lib/i18n';
import { Button, Toggle } from './ui';

export function BluffStory({ award }: { award: AwardView }) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState(false);
  const [image, setImage] = useState<Awaited<ReturnType<typeof bluffStory>> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const lang = currentLang();
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setImage(null); setMessage(null);
    bluffStory(award, lang, names).then((img) => {
      if (alive) setImage(img);
    }).catch(() => { if (alive) setMessage(t('Das Bild ließ sich gerade nicht erstellen.')); });
    return () => { alive = false; };
  }, [open, names, award.quote, award.story?.prompt, award.story?.fooled, lang]);
  if (!award.story) return null;
  const save = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url; link.download = image.file.name; link.click();
    setMessage(t('Bild gespeichert'));
  };
  const share = async () => {
    if (!image) return;
    try {
      if (navigator.canShare?.({ files: [image.file] })) {
        await navigator.share({ files: [image.file], title: award.title });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
    save();
  };
  return <div class="bluff-story">
    <Button variant="secondary" small onClick={() => setOpen(!open)}>{open ? t('Story-Karte schließen') : t('Story-Karte erstellen')}</Button>
    {open && <div class="story-preview stack">
      <Toggle checked={names} onChange={setNames} label={t('Namen auf der Karte zeigen')} hint={t('Ohne Namen ist die Karte anonym.')} />
      {image ? <img src={image.url} alt={t('Story-Karte mit Frage und bestem Bluff')} width="1080" height="1920" /> : !message && <p role="status">{t('Karte wird gestaltet …')}</p>}
      <Button variant="gold" block disabled={!image} onClick={share}>{t('Story-Karte teilen')}</Button>
      <Button variant="ghost" small disabled={!image} onClick={save}>{t('Bild herunterladen')}</Button>
      <p class="muted small">{t('Für Instagram-Story oder WhatsApp-Status. Wähle die App im Teilen-Menü oder lade das Bild dort hoch.')}</p>
      {message && <p role="status" class="small">{message}</p>}
    </div>}
  </div>;
}
