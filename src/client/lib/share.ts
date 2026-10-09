/**
 * Teilen-Dialog des Handys; ohne ihn (oder wenn abgebrochen) wird der Link kopiert.
 * Liefert einen Hinweis für einen Toast – oder null, wenn der Dialog geteilt hat.
 */
export async function shareLink(data: { title: string; text: string; url: string }): Promise<string | null> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return null;
    }
  } catch {
    /* abgebrochen – dann eben kopieren */
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return 'Link kopiert';
  } catch {
    return data.url;
  }
}
