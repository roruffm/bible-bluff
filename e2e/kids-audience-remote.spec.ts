import { expect, test, type Page } from '@playwright/test';
import { professorAudio, trackProfessorAudio } from './professor-audio';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

async function audienceOnly(page: Page) {
  await expect(page.locator('.kids-show')).toHaveClass(/is-projecting/);
  await page.locator('.kids-playing-bar').hover();
  await expect(page.locator('.kids-show').locator('button:visible, a:visible, input:visible, select:visible, summary:visible')).toHaveCount(0);
}

test('Kinderbühne bleibt in allen Spielphasen ohne sichtbare Bedienung; Fernbedienung steuert die ganze Show', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trackProfessorAudio(page);
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Smartphone-Fernbedienung einrichten', exact: true }).click();
  const url = await page.getByRole('link', { name: 'Fernbedienung öffnen', exact: false }).getAttribute('href');
  await page.getByRole('button', { name: 'Zur Partie', exact: true }).click();
  await audienceOnly(page);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'de-DE' });
  const phone = await context.newPage();
  try {
    await phone.goto(url!);
    await phone.getByRole('button', { name: 'Spruch am Beamer abspielen', exact: false }).click();
    await expect.poll(async () => (await professorAudio(page)).played).toEqual(['welcome']);
    await phone.getByRole('button', { name: 'Professor-Audio stoppen', exact: false }).click();
    await phone.getByRole('button', { name: 'Mission starten', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Die erste Spur', exact: true })).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
    await expect(page.locator('#kids-question')).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Szene am Beamer abspielen', exact: false }).click();
    await expect(page.locator('.kids-cinema')).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Zur Frage', exact: false }).click();
    await phone.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
    await expect(page.getByText('1, 2 oder 3? Ab in euer Feld!', { exact: true })).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    await expect(page.getByText('Kurze Pause. Bleibt, wo ihr seid!', { exact: true })).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Weiter geht’s', exact: true }).click();
    await phone.getByRole('button', { name: 'Countdown überspringen', exact: true }).click();
    await expect(page.getByText('Stopp! Helfer prüfen die Felder.', { exact: true })).toBeVisible();
    await audienceOnly(page);
    await expect(phone.locator('.kids-remote-guide')).toHaveAttribute('open', '');
    await expect(phone.locator('.kids-remote-correct')).toHaveText('✓ Richtige Antwort');
    await phone.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Alle zurück zu eurer Gruppe!', exact: true })).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Alle sind zurück!', exact: true })).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
    await expect(page.locator('.kids-reveal')).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('tab', { name: 'Funktionen', exact: true }).click();
    await phone.getByRole('button', { name: 'Direkt ins Finale', exact: false }).click();
    await expect(page.getByRole('heading', { name: 'Knackt den Superbluff!', exact: true })).toBeVisible();
    await audienceOnly(page);
    await phone.getByRole('tab', { name: 'Funktionen', exact: true }).click();
    await phone.getByRole('button', { name: 'Spiel abschließen', exact: true }).click();
    await phone.getByRole('button', { name: 'Jetzt mit Punktestand abschließen', exact: true }).click();
    await expect(page.locator('.kids-ending')).toBeVisible();
    await audienceOnly(page);
    for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await audienceOnly(page);
    }
    // Reload restores the paired display in audience mode, without automatically replaying an audio.
    await page.reload();
    await expect(page.locator('.kids-ending')).toBeVisible();
    await audienceOnly(page);
    expect((await professorAudio(page)).starts).toBe(0);
    await page.keyboard.press('h');
    await expect(page.getByRole('button', { name: 'Bedienung', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
    await page.keyboard.press('h');
    await audienceOnly(page);
  } finally { await context.close(); }
});

test('Fernbedienung trennt Ablauf, durchsuchbare Audios und Funktionen ohne Überlagerung auf kleinen Displays', async ({ page, browser }) => {
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Smartphone-Fernbedienung einrichten', exact: true }).click();
  const url = await page.getByRole('link', { name: 'Fernbedienung öffnen', exact: false }).getAttribute('href');
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, locale: 'de-DE' });
  const phone = await context.newPage();
  try {
    await phone.goto(url!);
    await expect(phone.getByRole('tab', { name: 'Ablauf', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(phone.getByRole('button', { name: 'Mission starten', exact: true })).toBeVisible();
    await expect(phone.getByRole('button', { name: 'Direkt ins Finale', exact: false })).toHaveCount(0);
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await phone.setViewportSize(viewport);
      expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const order = await phone.evaluate(() => ({ action: document.querySelector('.kids-remote-actions')!.getBoundingClientRect().bottom, audio: document.querySelector('.kids-phase-audio')!.getBoundingClientRect().top }));
      expect(order.action).toBeLessThan(order.audio);
    }
    await phone.getByRole('tab', { name: 'Zusatzaudios', exact: true }).click();
    await expect(phone.getByRole('button', { name: 'Mission starten', exact: true })).toHaveCount(0);
    await phone.getByRole('searchbox', { name: 'Ansage suchen', exact: true }).fill('Jesus');
    await expect(phone.getByRole('button', { name: 'Bei Jesus sind wir willkommen am Beamer abspielen', exact: true })).toBeVisible();
    await phone.getByRole('searchbox', { name: 'Ansage suchen', exact: true }).fill('xyz-keine-ansage');
    await expect(phone.getByText('Keine Ansage gefunden.', { exact: false })).toBeVisible();
    await phone.getByRole('combobox', { name: 'Art der Ansage', exact: true }).selectOption('Spannung');
    await expect(phone.getByRole('searchbox', { name: 'Ansage suchen', exact: true })).toHaveValue('');
    await expect(phone.getByRole('button', { name: 'Richtig knifflig am Beamer abspielen', exact: true })).toBeVisible();
    await phone.getByRole('tab', { name: 'Funktionen', exact: true }).click();
    await expect(phone.getByRole('button', { name: 'Direkt ins Finale', exact: false })).toBeVisible();
    await expect(phone.getByRole('button', { name: 'Spiel abschließen', exact: true })).toBeVisible();
    await phone.getByRole('tab', { name: 'Funktionen', exact: true }).press('Home');
    await expect(phone.getByRole('tab', { name: 'Ablauf', exact: true })).toBeFocused();
    await expect(phone.getByRole('button', { name: 'Professor-Audio stoppen', exact: false })).toBeVisible();
  } finally { await context.close(); }
});
