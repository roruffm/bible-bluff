import { showKidsOperator } from './kids-operator';
import { expect, test, type Page } from '@playwright/test';
import { professorAudio, trackProfessorAudio } from './professor-audio';
import { KIDS_SCENE_VOICE_URLS } from '../src/shared/kids-scenes';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

async function begin(page: Page) {
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click(); await showKidsOperator(page);
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
}
const allVoices = /^✓ Aufnahmen (\d+)\/\1/;

test('Kids: Neuladen mitten im Countdown setzt die Show angehalten mit allen Punkten fort', async ({ page }) => {
  await page.goto('/kids');
  await expect(page.getByRole('button', { name: 'Show fortsetzen', exact: true })).toHaveCount(0);
  await begin(page);
  await page.clock.install();
  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await page.clock.fastForward(30000);
  await page.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
  await page.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
  await page.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
  await page.getByRole('button', { name: 'Nächste Aufgabe', exact: true }).click();
  const question = await page.locator('#kids-question').innerText(), answers = await page.locator('.kids-answer-text').allInnerTexts();
  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await page.clock.runFor(12000);
  await expect(page.locator('.kids-clock-left')).toHaveAttribute('aria-label', '18 Sekunden');

  await page.reload();
  const resume = page.getByRole('button', { name: 'Show fortsetzen', exact: true });
  await expect(resume).toBeFocused();
  await expect(page.locator('.kids-resume')).toContainText('Kapitel 1 · Leuchtsterne · Kinderteam 10 · Professor Bluff 7');
  await expect(page.locator('.kids-resume')).toContainText('Der Countdown ist angehalten.');
  await page.keyboard.press('Space'); await showKidsOperator(page);
  await expect(page.locator('#kids-question')).toHaveText(question);
  await expect(page.locator('.kids-answer-text')).toHaveText(answers);
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await expect(page.getByTestId('prof-score')).toHaveText('7');
  await expect(page.getByText('Kurze Pause. Bleibt, wo ihr seid!', { exact: true })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.locator('.kids-clock-left')).toHaveAttribute('aria-label', '18 Sekunden');
  await page.getByRole('button', { name: /^Weiter geht/ }).click();
  await page.clock.runFor(18000);
  await expect(page.getByText('Stopp! Helfer prüfen die Felder.', { exact: true })).toBeVisible();

  // Auch der Endbildschirm übersteht ein Neuladen; „Verwerfen“ räumt den Stand ab.
  await page.getByRole('button', { name: 'Spiel mit Punktestand abschließen', exact: true }).click();
  await page.getByRole('button', { name: 'Jetzt mit Punktestand abschließen', exact: true }).click();
  await page.reload();
  await expect(page.locator('.kids-resume')).toContainText('Endbildschirm · Kinderteam 10');
  await page.getByRole('button', { name: 'Verwerfen', exact: true }).click();
  await expect(page.locator('.kids-resume')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Show vorbereiten/ })).toBeVisible();
  await expect(page.locator('.kids-resume')).toHaveCount(0);

  // Wer bewusst zur Vorbereitung zurückgeht, bekommt die alte Show nicht wieder angeboten.
  await begin(page);
  await page.getByRole('button', { name: 'Spiel mit Punktestand abschließen', exact: true }).click();
  await page.getByRole('button', { name: 'Jetzt mit Punktestand abschließen', exact: true }).click();
  await showKidsOperator(page);
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  await page.getByRole('button', { name: 'Zur Vorbereitung', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Zur Vorbereitung', exact: true }).click();
  await page.reload();
  await expect(page.locator('.kids-resume')).toHaveCount(0);
});

test('Kids: Fällt das Netz aus, spricht der Professor aus den vorab geladenen Aufnahmen weiter', async ({ page, context }) => {
  await trackProfessorAudio(page);
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click(); await showKidsOperator(page);
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  await expect(page.locator('.kids-tech-status')).toHaveText(allVoices);
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();
  expect((await professorAudio(page)).starts).toBe(0);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Professor-Spruch abspielen', exact: true }).click();
  await expect.poll(async () => (await professorAudio(page)).played).toEqual(['welcome']);
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Professor-Spruch abspielen', exact: true }).click();
  await expect.poll(async () => (await professorAudio(page)).played).toEqual(['welcome', 'intro']);
  await expect(page.locator('.kids-connection-note')).toHaveCount(0);
});

test('Kids: Ohne Netz für das Smartphone geht es mit Maus und Tastatur weiter', async ({ page, context }) => {
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click(); await showKidsOperator(page);
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  await page.getByRole('button', { name: 'Smartphone verbinden', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Fernbedienung öffnen', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Zur Partie', exact: true }).click(); await showKidsOperator(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  const note = page.locator('.kids-connection-note', { hasText: 'Verbindung' });
  await expect(note).toContainText('Verbindung unterbrochen');
  await expect(page.getByRole('heading', { name: 'Die erste Spur', exact: true })).toHaveCount(0);
  await note.getByRole('button', { name: 'Ohne Smartphone weiterspielen', exact: true }).click();
  await expect(note).toHaveCount(0);
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Die erste Spur', exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#kids-question')).toBeVisible();
});

test.describe('mit Offline-Kopie', () => {
  test.use({ serviceWorkers: 'allow' });

  test('Kids: Technik-Check vor dem Einlass und Neuladen ganz ohne Internet', async ({ page, context }) => {
    await trackProfessorAudio(page);
    await page.goto('/kids');
    await page.getByRole('button', { name: 'Technik prüfen', exact: true }).click();
    const check = (label: string) => page.locator('.kids-check-row').filter({ has: page.locator('b', { hasText: new RegExp(`^${label}$`) }) });
    await expect(check('Ton')).toHaveClass(/is-ok/);
    await expect.poll(async () => (await professorAudio(page)).played).toEqual(['interjection-listen']);
    await expect(check('Aufnahmen')).toHaveClass(/is-ok/);
    await expect(check('Aufnahmen')).toContainText(/Alle \d+ Sprachaufnahmen sind geladen\./);
    await expect(check('Ohne Internet')).toHaveClass(/is-ok/, { timeout: 15000 });
    expect(await page.evaluate(async urls => {
      const cache = await caches.open('bb-kids-show');
      return Promise.all(urls.map(async url => (await cache.match(url))?.ok === true));
    }, KIDS_SCENE_VOICE_URLS)).toEqual([true, true, true]);
    await expect(check('Fernbedienung')).toHaveClass(/is-ok/);
    await expect(page.getByRole('button', { name: 'Erneut prüfen', exact: true })).toBeEnabled();

    await begin(page);
    const question = await page.locator('#kids-question').innerText();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Show fortsetzen', exact: true }).click(); await showKidsOperator(page);
    await expect(page.locator('#kids-question')).toHaveText(question);
    await showKidsOperator(page);
    await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
    await expect(page.locator('.kids-tech-status')).toHaveText(/^✓ Aufnahmen (\d+)\/\1 · ✓ Offline-Kopie$/);
    await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();
    await page.getByRole('button', { name: 'Frage vorlesen', exact: false }).click();
    await expect.poll(async () => (await professorAudio(page)).played).toEqual(['question-0']);
    await context.setOffline(false);
  });
});
