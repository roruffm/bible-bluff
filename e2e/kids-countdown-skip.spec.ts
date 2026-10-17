import { showKidsOperator } from './kids-operator';
import { expect, test } from '@playwright/test';
import { createKidsGame } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';
import { professorAudio, trackProfessorAudio } from './professor-audio';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('Countdown überspringen: nur im Bedienungsmenü und vor dem Start ohne vorzeitige Auflösung', async ({ page }) => {
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click(); await showKidsOperator(page);
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
  const skip = page.getByRole('button', { name: 'Countdown überspringen', exact: true });
  await expect(skip).toHaveCount(0);
  await showKidsOperator(page);
  await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
  await expect(page.locator('#kids-operator-tools').getByRole('button', { name: 'Countdown überspringen', exact: true })).toBeVisible();
  await skip.click();
  await expect(page.locator('#kids-operator-tools')).toHaveCount(0);
  await expect(skip).toHaveCount(0);
  await expect(page.locator('.kids-clock-left')).toHaveAttribute('aria-label', '0 Sekunden');
  await expect(page.getByText('Stopp! Helfer prüfen die Felder.', { exact: true })).toBeVisible();
  await expect(page.locator('.kids-answer.is-correct')).toHaveCount(0);
  await expect(page.getByTestId('team-score')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Zurück in die Gruppen', exact: true })).toBeVisible();
});

test('Smartphone überspringt den laufenden Countdown, stoppt vorgemerkte Sprache und lässt die Wertung manuell', async ({ page, browser, request }) => {
  const game = { ...createKidsGame(), phase: 'paused' as const, remainingMs: 20000 };
  const response = await request.post('/api/kids-remotes', { data: { easy: false, game: packKidsGame(game, Date.now()) } });
  expect(response.status()).toBe(201);
  const remote = await response.json();
  await page.addInitScript(({ id, token }) => {
    sessionStorage.setItem('bb:kids:display', JSON.stringify({ id, token }));
  }, { id: remote.id, token: remote.ownerToken });
  await trackProfessorAudio(page);
  await page.goto('/kids');
  await showKidsOperator(page);
  await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
  await page.getByRole('button', { name: 'Klang einschalten', exact: true }).click();
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Countdown überspringen', exact: true })).toHaveCount(0);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'de-DE' });
  const phone = await context.newPage();
  try {
    await phone.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
    const skip = phone.getByRole('button', { name: 'Countdown überspringen', exact: true });
    await expect(skip).toBeVisible();
    await phone.getByRole('button', { name: 'Weiter geht’s', exact: true }).click();
    await phone.getByRole('button', { name: 'Countdown für letzte 5 Sekunden vormerken', exact: true }).click();
    await expect.poll(async () => (await professorAudio(page)).played).toEqual(['interjection-signal-countdown']);
    await skip.click();
    await expect(page.getByText('Stopp! Helfer prüfen die Felder.', { exact: true })).toBeVisible();
    await expect.poll(async () => (await professorAudio(page)).stops).toBe(1);
    await expect(page.locator('.kids-clock-left')).toHaveAttribute('aria-label', '0 Sekunden');
    await expect(skip).toHaveCount(0);
    await expect(page.getByTestId('team-score')).toHaveText('0');
    await expect(page.locator('.kids-answer.is-correct')).toHaveCount(0);
    await expect(phone.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true })).toHaveCount(0);
    await phone.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
    await phone.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
    await phone.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
    await expect(page.getByTestId('team-score')).toHaveText('10');
  } finally { await context.close(); }
});
