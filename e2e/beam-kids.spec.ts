import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

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
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1024, height: 768 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      const box = await page.locator('.kids-controls').boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.getByRole('button', { name: i === 5 ? 'Zum großen Finale' : 'Nächste Frage' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ihr wart spitze!' })).toBeVisible();
  await page.getByRole('button', { name: 'Noch eine Runde!' }).click();
  await expect(page.locator('.kids-answer')).toHaveCount(3);
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  await page.getByRole('button', { name: 'Spiel beenden' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Zur Auswahl', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Los geht’s!' })).toBeVisible();
  expect(roomRequests).toEqual([]);
});

test('Kids: reine Spielansicht bleibt über Tastatur bedienbar', async ({ page }) => {
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await page.keyboard.press('h');
  await expect(page.locator('.kids-page')).toHaveClass(/is-projecting/);
  await expect(page.getByRole('button', { name: '30 Sekunden starten' })).toBeHidden();
  await page.clock.install();
  await page.keyboard.press('Space');
  await expect(page.getByText('1, 2 oder 3? Ab in euer Feld!')).toBeVisible();
  await page.clock.fastForward(30000);
  await expect(page.getByText('Stopp! Jetzt stehen bleiben!')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
  await expect(page.locator('.kids-discovery small')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.getByRole('button', { name: 'Nächste Frage' })).toBeVisible();
});

test('Kids: große Texte und stabile Felder passen in 4:3, 720p und Full HD', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/kids');
  await page.getByRole('button', { name: '15', exact: true }).click();
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await page.clock.install();
  const viewports = [{ width: 800, height: 600 }, { width: 1024, height: 768 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }];
  const check = async () => {
    const issues = await page.evaluate(() => {
      const problems: string[] = [];
      const textFits = (selector: string, containerSelector?: string) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          const box = (containerSelector ? el.closest(containerSelector)! : el).getBoundingClientRect();
          if (text.left < box.left - 1 || text.right > box.right + 1 || text.top < box.top - 1 || text.bottom > box.bottom + 1) problems.push(`${selector}: ${el.textContent}`);
        });
      };
      textFits('#kids-question');
      textFits('.kids-answer-text');
      textFits('.is-revealed .kids-discovery p', '.kids-bottom');
      for (const el of document.querySelectorAll('.kids-status, .kids-answers, .kids-bottom')) {
        const box = el.getBoundingClientRect();
        if (box.bottom > innerHeight + 1 || box.right > innerWidth + 1 || box.left < 0) problems.push(`Außerhalb: ${el.className}`);
      }
      return problems;
    });
    expect(issues).toEqual([]);
  };
  for (let i = 0; i < 15; i++) {
    const positions: Record<string, number[]> = {};
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await check();
      positions[viewport.width] = await page.locator('.kids-answer').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().y));
    }
    await page.getByRole('button', { name: '30 Sekunden starten' }).click();
    await page.clock.fastForward(30000);
    await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await check();
      const ys = await page.locator('.kids-answer').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().y));
      expect(ys).toEqual(positions[viewport.width]);
    }
    await page.getByRole('button', { name: i === 14 ? 'Zum großen Finale' : 'Nächste Frage' }).click();
  }
});
