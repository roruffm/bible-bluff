import { expect, test } from '@playwright/test';

test('Admin kann gespielte Nicknamen auf dem Handy suchen und entfernen', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const created = await request.post('/api/rooms', {
    data: { name: 'AdminTestLena', bot: true, settings: { lang: 'en' } },
  });
  expect(created.ok()).toBeTruthy();
  const host = await created.json();
  expect((await request.post(`/api/rooms/${host.code}/action`, {
    data: { type: 'start' }, headers: { authorization: `Bearer ${host.token}` },
  })).ok()).toBeTruthy();

  expect((await request.get('/api/admin/nicknames')).status()).toBe(401);
  await page.goto('/admin');
  await page.getByLabel('Schlüssel', { exact: true }).fill('wrong-key');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Schlüssel', { exact: true }).fill('playwright-admin-key');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gespielte Nicknamen' })).toBeVisible();
  await expect(page.getByText('AdminTestLena', { exact: true })).toBeVisible();
  await expect(page.getByText('Erstmals erfasst', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByLabel('Nickname suchen').fill('niemand-mit-diesem-namen');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();
  await expect(page.getByText('Kein Nickname passt zur Suche.')).toBeVisible();
  await page.getByLabel('Nickname suchen').fill('admintestlena');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();
  await expect(page.getByText('1 Nickname gefunden', { exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Entfernen', exact: true }).click();
  await expect(page.getByText('Kein Nickname passt zur Suche.')).toBeVisible();

  await page.getByRole('radio', { name: 'Hausbluffs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Frische Hausbluffs' })).toBeVisible();
  await expect(page.getByText('Gerade nichts zu prüfen.')).toBeVisible();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByLabel('Schlüssel', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
