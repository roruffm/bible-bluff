import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

test('Kids: Startseitenlogo, Vorlesen, 30 Sekunden, Pause, Stopp und Auflösung', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'BibleBluff Kids – Beamer-Spiel für Kinder' }).click();
  await expect(page).toHaveURL(/\/kids$/);
  await page.getByRole('button', { name: '6', exact: true }).click();
  await page.getByRole('button', { name: 'Extra leicht' }).click();
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await expect(page.locator('.kids-answer')).toHaveCount(3);
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label', '30 Sekunden');
  await expect(page.locator('.kids-correct-mark')).toHaveCount(0);
  await expect(page.getByText('Erst zuhören. Dann geht’s los!')).toBeVisible();
  await page.clock.install();
  await page.getByRole('button', { name: '30 Sekunden starten' }).click();
  await page.clock.runFor(10000);
  await page.keyboard.press('p');
  await expect(page.getByText('Kurze Pause. Bleibt, wo ihr seid!')).toBeVisible();
  await page.clock.runFor(40000);
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label', '20 Sekunden');
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(19900);
  await expect(page.locator('.kids-correct-mark')).toHaveCount(0);
  await page.clock.runFor(100);
  await expect(page.getByText('Stopp! Jetzt stehen bleiben!')).toBeVisible();
  await expect(page.locator('.kids-correct-mark')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
  await expect(page.locator('.kids-celebration')).toBeVisible();
  await expect(page.locator('.kids-discovery small')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Erst zuhören. Dann geht’s los!')).toBeVisible();
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label', '30 Sekunden');
  await expect(page.locator('.kids-correct-mark')).toHaveCount(0);
  await expect(page.locator('.kids-celebration')).toHaveCount(0);
});

test('Kids: ganze Partie mit Finale und neuer Frageauswahl, ohne Raum oder Spieler', async ({ page }) => {
  const roomRequests: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/api/')) roomRequests.push(r.url()); });
  await page.goto('/kids');
  await page.getByRole('button', { name: '6', exact: true }).click();
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await page.clock.install();
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: '30 Sekunden starten' }).click();
    await page.clock.runFor(30000);
    await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
    await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
    const box = await page.locator('.kids-controls').boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
    await page.getByRole('button', { name: i === 5 ? 'Zum großen Finale' : 'Nächste Frage' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ihr wart spitze!' })).toBeVisible();
  await page.getByRole('button', { name: 'Noch eine Runde!' }).click();
  await expect(page.locator('.kids-answer')).toHaveCount(3);
  await page.getByRole('button', { name: 'Spiel beenden' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Zur Auswahl', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Los geht’s!' })).toBeVisible();
  expect(roomRequests).toEqual([]);
});
