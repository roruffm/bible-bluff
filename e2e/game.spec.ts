import { type Browser, type Page, expect, test } from '@playwright/test';

async function phone(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', (err) => {
    throw new Error(`${name}: ${err.message}`);
  });
  return page;
}

async function createRoom(page: Page, name: string, plays = true): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Raum eröffnen' }).click();
  await page.getByLabel('Dein Spitzname').fill(name);
  if (!plays) await page.getByText('Ich spiele mit').click();
  await page.getByRole('radiogroup', { name: 'Runden' }).getByRole('radio', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'Raum eröffnen' }).click();
  await page.waitForURL(/\/r\/[A-Z]+\d+$/);
  return page.url().split('/r/')[1];
}

async function join(page: Page, code: string, name: string) {
  await page.goto(`/r/${code}`);
  await page.getByLabel('Dein Spitzname').fill(name);
  await page.getByRole('button', { name: 'Beitreten' }).click();
  await expect(page.getByText('Gleich geht’s los')).toBeVisible();
}

async function hostAction(host: Page, label: string | RegExp) {
  await host.locator('.topbar-menu').click();
  await host.locator('.sheet').getByRole('button', { name: label }).click();
  await expect(host.locator('.sheet')).toHaveCount(0);
}

test('eine komplette Partie auf drei Handys und der Leinwand', async ({ browser }) => {
  const host = await phone(browser, 'host');
  const code = await createRoom(host, 'Rahel');
  await expect(host.locator('.room-code')).toHaveText(code);
  await expect(host.locator('svg.qr')).toBeVisible();

  const jonas = await phone(browser, 'jonas');
  const mirjam = await phone(browser, 'mirjam');
  await join(jonas, code, 'Jonas');
  await join(mirjam, code, 'Mirjam');

  const tvContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const tv = await tvContext.newPage();
  await tv.goto(`/tv/${code}`);
  await expect(tv.locator('.player')).toHaveCount(3);

  await host.getByRole('button', { name: 'Partie starten' }).click();
  for (const p of [host, jonas, mirjam, tv]) await expect(p.getByText('Runde 1 von 4')).toBeVisible();

  // Bluffs schreiben – Jonas lässt sich einen Vorschlag geben
  await host.getByLabel('Deine erfundene Antwort').fill('Ein Krug voller Honig');
  await host.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(host.getByText('Dein Bluff ist drin')).toBeVisible();
  await jonas.getByRole('button', { name: /Vorschlag/ }).click();
  await expect(jonas.getByLabel('Deine erfundene Antwort')).not.toHaveValue('');
  await jonas.getByRole('button', { name: 'Bluff abgeben' }).click();
  await mirjam.getByLabel('Deine erfundene Antwort').fill('Drei Schriftrollen und Salz');
  await mirjam.getByRole('button', { name: 'Bluff abgeben' }).click();

  // Abstimmung beginnt, sobald alle abgegeben haben
  for (const p of [host, jonas, mirjam]) await expect(p.getByText('Welche Antwort stimmt?')).toBeVisible();
  await expect(host.locator('.option.is-mine')).toHaveCount(1);
  await expect(host.locator('.option.is-mine')).toContainText('Ein Krug voller Honig');
  await expect(tv.locator('.option')).toHaveCount(await host.locator('.option').count());

  // Jonas und Mirjam fallen auf Rahels Bluff herein, Rahel wählt irgendeine andere Antwort
  await jonas.locator('.option', { hasText: 'Ein Krug voller Honig' }).click();
  await mirjam.locator('.option', { hasText: 'Ein Krug voller Honig' }).click();
  await host.locator('button.option:not([disabled])').first().click();

  // Aufdeckung – synchron auf allen Geräten
  for (const p of [host, jonas, tv]) await expect(p.getByText('Aufdeckung').first()).toBeVisible();
  await expect(jonas.locator('.reveal-text', { hasText: 'Ein Krug voller Honig' })).toBeVisible({ timeout: 30_000 });
  await expect(jonas.getByText('Du bist darauf hereingefallen')).toBeVisible({ timeout: 10_000 });
  await expect(host.getByText(/Dein Bluff! 2 Personen reingelegt/)).toBeVisible({ timeout: 10_000 });
  await expect(tv.locator('.stamp-bluff')).toBeVisible();
  await expect(jonas.locator('.stamp-truth')).toBeVisible({ timeout: 30_000 });

  // Punkte und Entdeckung
  await expect(host.getByText('Punktestand')).toBeVisible({ timeout: 30_000 });
  await expect(host.locator('.merksatz')).toBeVisible();
  const rahelRow = host.locator('.score-row', { hasText: 'Rahel' });
  await expect(rahelRow.locator('.score-total')).toHaveText(/^[2-4]$/);
  await expect(rahelRow.locator('.delta.is-bluff')).toHaveText('Bluff +2');

  // Restliche Runden zügig über die Spielleitung durchschalten
  await host.getByRole('button', { name: 'Nächste Runde' }).click();
  for (let round = 2; round <= 4; round++) {
    await expect(host.getByText(`Runde ${round} von 4`)).toBeVisible();
    await hostAction(host, 'Schreibzeit jetzt beenden');
    await expect(host.getByText('Welche Antwort stimmt?')).toBeVisible();
    await hostAction(host, 'Abstimmung jetzt beenden');
    await hostAction(host, 'Aufdeckung überspringen');
    await expect(host.getByText('Punktestand')).toBeVisible();
    await host.getByRole('button', { name: round === 4 ? 'Zum Endstand' : 'Nächste Runde' }).click();
  }

  for (const p of [host, jonas, mirjam, tv]) await expect(p.getByRole('heading', { name: 'Endstand' })).toBeVisible();
  await expect(host.locator('.podium-place')).toHaveCount(3);
  await expect(host.locator('.discoveries li')).toHaveCount(4);
  await expect(host.getByText('Bluff-Meister')).toBeVisible();

  // Neue Partie mit denselben Leuten
  await host.getByRole('button', { name: 'Neue Partie mit allen' }).click();
  await expect(host.getByRole('button', { name: 'Partie starten' })).toBeVisible();
  await expect(jonas.getByText('Gleich geht’s los')).toBeVisible();
});

test('Spielleitung am Beamer: Pause, Wiedereinstieg und Entfernen', async ({ browser }) => {
  const host = await phone(browser, 'host');
  const code = await createRoom(host, 'Leitung', false);
  const anna = await phone(browser, 'anna');
  const ben = await phone(browser, 'ben');
  await join(anna, code, 'Anna');
  await join(ben, code, 'Ben');

  await host.getByRole('button', { name: 'Partie starten' }).click();
  // Wer nur leitet, sieht die Frage, aber kein Eingabefeld
  await expect(host.locator('.question-card')).toBeVisible();
  await expect(host.getByLabel('Deine erfundene Antwort')).toHaveCount(0);
  await expect(anna.getByLabel('Deine erfundene Antwort')).toBeVisible();

  // Pause friert die Zeit für alle ein
  await hostAction(host, 'Pausieren');
  await expect(anna.getByRole('dialog', { name: 'Pause' })).toBeVisible();
  await host.getByRole('dialog', { name: 'Pause' }).getByRole('button', { name: 'Fortsetzen' }).click();
  await expect(anna.getByRole('dialog', { name: 'Pause' })).toHaveCount(0);

  // Neu laden kostet nichts: Anna ist sofort wieder im Spiel
  await anna.getByLabel('Deine erfundene Antwort').fill('Eine Harfe aus Zedernholz');
  await anna.getByRole('button', { name: 'Bluff abgeben' }).click();
  await anna.reload();
  await expect(anna.getByText('„Eine Harfe aus Zedernholz“')).toBeVisible();

  // Leere Eingaben lassen sich gar nicht erst abschicken
  await expect(ben.getByRole('button', { name: 'Bluff abgeben' })).toBeDisabled();

  // Entfernen
  await host.locator('.topbar-menu').click();
  const row = host.locator('.manage-list li').filter({ has: host.locator('.manage-name', { hasText: /^Ben/ }) });
  await row.getByRole('button', { name: 'Entfernen' }).click();
  await row.getByRole('button', { name: 'Entfernen?' }).click();
  await expect(ben.getByRole('heading', { name: 'Entfernt' })).toBeVisible();

  // Raum schließen
  await host.getByRole('button', { name: 'Raum schließen' }).click();
  await host.getByRole('button', { name: /Für alle schließen/ }).click();
  await expect(anna.getByRole('heading', { name: 'Raum geschlossen' })).toBeVisible();
});
