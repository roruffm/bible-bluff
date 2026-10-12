// Die englische Fassung im Browser: Flagge auf der Startseite, ein englischer Raum mit Einladungslink,
// eine Runde bis zum Punktestand – und nirgends ein deutsches Wort.

import { type Browser, type Page, expect, test } from '@playwright/test';
import { SAFE_BLUFFS_EN } from './bluffs';

async function phone(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', (err) => {
    throw new Error(`${name}: ${err.message}`);
  });
  return page;
}

/** Sichtbarer Text ohne Umlaute, ß und deutsche Anführungszeichen */
async function expectNoGerman(page: Page, where: string) {
  const text = await page.locator('body').innerText();
  const lines = text.split('\n').filter((line) => /[äöüÄÖÜß„]/.test(line));
  expect(lines, where).toEqual([]);
}

const VOTE_TITLE = /Which answer is true\?|What goes in the gap\?/;
const BLUFF_FIELD = /Your made-up answer|What goes in the gap/;

test('Startseite: Die Flagge schaltet auf Englisch – und zurück', async ({ browser }) => {
  const page = await phone(browser, 'start');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mitspielen' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');

  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Join' })).toBeVisible();
  await expect(page.getByText('Make up bluffs. Find the truth. Discover the Bible.')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');

  // Anleitung und Farben ganz aufgeklappt – alles englisch
  await page.locator('.guide > summary').click();
  await page.locator('.colors > summary').click();
  for (const topic of await page.locator('.guide-topic > summary').all()) await topic.click();
  await expect(page.locator('.guide')).toContainText('Heart-to-heart');
  await expect(page.locator('.colors')).toContainText('Sea of Galilee');
  await expectNoGerman(page, 'Startseite');

  // Die Wahl bleibt auf diesem Gerät
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Join' })).toBeVisible();
  await page.getByRole('radio', { name: 'Deutsch' }).click();
  await expect(page.getByRole('heading', { name: 'Mitspielen' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('ein englischer Raum: Einladung, eine Runde, Punktestand', async ({ browser }) => {
  const host = await phone(browser, 'host');
  await host.goto('/?lang=en');
  await host.getByRole('button', { name: 'Create a room' }).click();
  await host.getByLabel('Your nickname').fill('Hannah');
  await host.getByRole('radiogroup', { name: 'Rounds' }).getByRole('radio', { name: '4', exact: true }).click();
  await host.getByRole('button', { name: 'Create a room' }).click();
  await host.waitForURL(/\/r\/[A-Z]+\d+$/);
  const code = host.url().split('/r/')[1];
  await expect(host.locator('.fresh-note')).toContainText('New for everyone');
  await expectNoGerman(host, 'Warteraum der Leitung');

  // Über den Einladungslink (mit ?lang=en) kommt Amara gleich auf Englisch herein
  const amara = await phone(browser, 'amara');
  await amara.goto(`/r/${code}?lang=en`);
  await amara.getByLabel('Your nickname').fill('Amara');
  await amara.getByRole('button', { name: 'Join' }).click();
  await expect(amara.getByText('Starting soon – the host will start the game.')).toBeVisible();

  // Ben hat ein deutsches Handy und tippt nur den Code ein: Im Raum gilt trotzdem Englisch
  const ben = await phone(browser, 'ben');
  await ben.goto(`/r/${code}`);
  await ben.getByLabel('Dein Spitzname').fill('Ben');
  await ben.getByRole('button', { name: 'Beitreten' }).click();
  await expect(ben.getByText('Starting soon – the host will start the game.')).toBeVisible();

  const tvContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const tv = await tvContext.newPage();
  await tv.goto(`/tv/${code}`);
  await expect(tv.locator('.player')).toHaveCount(3);
  await expectNoGerman(tv, 'Leinwand im Warteraum');

  await host.getByRole('button', { name: 'Start the game' }).click();
  for (const p of [host, amara, ben, tv]) await expect(p.getByText('Round 1 of 4')).toBeVisible();

  await host.getByLabel(BLUFF_FIELD).fill(SAFE_BLUFFS_EN.host);
  await host.getByRole('button', { name: 'Submit bluff' }).click();
  await expect(host.getByText('Your bluff is in')).toBeVisible();
  await expectNoGerman(host, 'Bluff abgegeben');
  await amara.getByLabel(BLUFF_FIELD).fill(SAFE_BLUFFS_EN.amara);
  await amara.getByRole('button', { name: 'Submit bluff' }).click();
  await ben.getByLabel(BLUFF_FIELD).fill(SAFE_BLUFFS_EN.ben);
  await ben.getByRole('button', { name: 'Submit bluff' }).click();

  for (const p of [host, amara, ben]) await expect(p.getByText(VOTE_TITLE)).toBeVisible();
  await expectNoGerman(ben, 'Abstimmung');
  await amara.locator('.option', { hasText: SAFE_BLUFFS_EN.host }).click();
  await ben.locator('.option', { hasText: SAFE_BLUFFS_EN.host }).click();
  await host.locator('button.option:not([disabled])').first().click();

  await expect(amara.getByText('You fell for it')).toBeVisible({ timeout: 30_000 });
  await expect(host.getByText('Your bluff! You fooled 2 people.')).toBeVisible({ timeout: 10_000 });
  await expectNoGerman(tv, 'Aufdeckung auf der Leinwand');

  await expect(host.getByText('Scores')).toBeVisible({ timeout: 40_000 });
  await expect(host.locator('.talk-notes')).toContainText('Cheat sheet for the host');
  await expect(amara.locator('.merksatz')).toContainText('Discovery');
  for (const [p, where] of [
    [host, 'Punkte der Leitung'],
    [amara, 'Punkte bei Amara'],
    [tv, 'Punkte auf der Leinwand'],
  ] as const) {
    await expectNoGerman(p, where);
  }
});

test('englische Seiten: Neugierig auf Jesus, Impressum und Datenschutz', async ({ browser }) => {
  const page = await phone(browser, 'seiten');
  await page.goto('/jesus?lang=en');
  await expect(page.getByRole('heading', { name: 'Curious about Jesus?', level: 1 })).toBeVisible();
  await expect(page.getByText('“I have called you friends.”')).toBeVisible();
  await expectNoGerman(page, 'Jesus-Seite');
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { name: 'Privacy', level: 1 })).toBeVisible();
  await expect(page.getByText('The German version is legally binding.')).toBeVisible();
  await expectNoGerman(page, 'Datenschutz');
  await page.getByRole('link', { name: 'Legal notice' }).click();
  await expect(page.getByRole('heading', { name: 'Legal notice', level: 1 })).toBeVisible();
  await expectNoGerman(page, 'Impressum');
});
