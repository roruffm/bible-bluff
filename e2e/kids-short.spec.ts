import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

async function startShort(page: Page) {
  await page.goto('/kids');
  await page.getByRole('button', { name: /Kurzshow · 15 Minuten/ }).click();
  await expect(page.getByText('Zeigt eure Antwort mit 1, 2 oder 3 Fingern.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await expect(page.getByText('KURZSHOW · EIN KAPITEL FÜR ALLE', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
}
/** 20 Sekunden zeigen die Kinder ihre Finger, danach wird ohne Rückweg sofort gewertet. */
async function task(page: Page, key: '1' | '2' | '0') {
  await page.getByRole('button', { name: '20 Sekunden starten', exact: true }).click();
  await page.clock.runFor(20000);
  await expect(page.getByText('Stopp! Finger oben lassen.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zurück in die Gruppen', exact: true })).toHaveCount(0);
  await expect(page.locator('.kids-score-actions')).toBeVisible();
  await page.keyboard.press(key);
  await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
}

test('Kurzshow: eigener Startknopf, ein Kapitel mit Fingerabstimmung, Finale und Zeitplan', async ({ page }) => {
  await page.clock.install();
  await startShort(page);
  await expect(page.locator('.kids-round-counter')).toContainText('Kurzshow');
  await expect(page.locator('.kids-clock-left')).toHaveAttribute('aria-label', '20 Sekunden');
  await task(page, '1');
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await expect(page.getByTestId('prof-score')).toHaveText('6');
  await expect(page.locator('.kids-compact-score')).toHaveAttribute('aria-label', 'Gemeinsame Punktejagd: Kinderteam 10, Professor Bluff 6');
  await expect(page.locator('.kids-reveal-points')).toHaveText('+10 für euer Team!');
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  const plan = page.locator('.kids-operator-tools .kids-time-plan');
  await expect(plan).toContainText('Jetzt Aufgabe 1, Ziel bis 2:30');
  await expect(plan.locator('.kids-time-plan-status')).toHaveText('Im Plan ✓');
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();

  await page.getByRole('button', { name: 'Nächste Aufgabe', exact: true }).click();
  await task(page, '2');
  // Zu lange gebraucht: Die Wanduhr springt fünf Minuten weiter, ohne Timer abzuarbeiten. Ein großes runFor
  // bei laufender Testuhr kann den Sprung verlieren, wenn gleichzeitig deren Echtzeit-Takt Timer abarbeitet.
  await page.clock.setSystemTime(await page.evaluate(() => Date.now()) + 5 * 60 * 1000);
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  await expect(plan.locator('.kids-time-plan-status')).toContainText('über dem Plan');
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();

  // Auch die Kurzshow übersteht ein Neuladen.
  await page.reload();
  await expect(page.locator('.kids-resume')).toContainText('Kurzshow · Leuchtsterne · Kinderteam 15 · Professor Bluff 12');
  await page.getByRole('button', { name: 'Show fortsetzen', exact: true }).click();
  await page.getByRole('button', { name: 'Nächste Aufgabe', exact: true }).click();
  await task(page, '0');
  await page.getByRole('button', { name: 'Zum Superbluff', exact: true }).click();
  await expect(page.getByText('Knackt den Superbluff!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Gemeinsam ins Finale', exact: true }).click();
  await task(page, '1');
  await page.getByRole('button', { name: 'Zum Abschluss', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gemeinsam seid ihr stark!' })).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('25');
  await expect(page.getByTestId('prof-score')).toHaveText('28');
  await expect(page.locator('.kids-ending-count')).toContainText('4 Aufgaben');
});

test('Kurzshow: Smartphone zeigt Zeitplan und wertet direkt nach dem Stopp', async ({ page, browser }) => {
  await startShort(page);
  await page.getByRole('button', { name: 'Bedienung', exact: false }).click();
  await page.getByRole('button', { name: 'Smartphone verbinden', exact: true }).click();
  const url = await page.getByRole('link', { name: 'Fernbedienung öffnen', exact: false }).getAttribute('href');
  await page.getByRole('button', { name: 'Zur Partie', exact: true }).click();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' }), phone = await context.newPage();
  await phone.goto(url!);
  await expect(phone.getByText('Mit der Beamer-Partie verbunden', { exact: true })).toBeVisible();
  await expect(phone.locator('.kids-time-plan')).toContainText('Jetzt Aufgabe 1, Ziel bis 2:30');
  await expect(phone.locator('.kids-remote-question')).toContainText('Kurzshow');
  await phone.getByRole('button', { name: '20 Sekunden starten', exact: true }).click();
  await expect(phone.getByText('Kinder zeigen ihre Finger.', { exact: false })).toBeVisible({ timeout: 25000 });
  await phone.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
  await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
  await expect(page.getByTestId('team-score')).toHaveText('10');
  expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('Kurzshow: Wertung passt bei kleinen und flachen Fenstern', async ({ page }) => {
  await page.clock.install();
  for (const size of [{ width: 844, height: 390 }, { width: 1024, height: 500 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await startShort(page);
    await page.getByRole('button', { name: '20 Sekunden starten', exact: true }).click();
    await page.clock.runFor(20000);
    const problems = await page.evaluate(() => [...document.querySelectorAll('.kids-operator-actions, .kids-score-actions > *, #kids-question, .kids-status')]
      .filter((el) => { const box = el.getBoundingClientRect(); return box.left < -1 || box.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 2; })
      .map((el) => el.className || el.id));
    expect.soft(problems, `${size.width}x${size.height}`).toEqual([]);
  }
});
