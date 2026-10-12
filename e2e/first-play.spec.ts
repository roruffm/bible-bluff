import { expect, test } from '@playwright/test';

test('new visitor tries a bluff and reaches the first real question without setup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Jetzt sofort spielen' })).toBeVisible();
  await page.getByRole('button', { name: /In einem Brotlaib/ }).click();
  await expect(page.getByText('Reingelegt!')).toBeVisible();
  await expect(page.getByRole('button', { name: /Im Maul eines Fisches/ })).toHaveClass(/is-true/);

  await page.getByRole('button', { name: 'Jetzt gegen Jakob spielen' }).click();
  await page.waitForURL(/\/r\/[A-Z]+\d+$/);
  await expect(page.getByText('Runde 1 von 4')).toBeVisible();
  await expect(page.getByLabel('Deine erfundene Antwort')).toBeVisible();
});

test('home page asks for a nickname only once a room code is typed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Mitspielen' })).toBeVisible();
  await expect(page.getByLabel('Dein Spitzname')).toHaveCount(0);
  await page.getByLabel('Raumcode').fill('lampe7');
  await expect(page.getByLabel('Raumcode')).toHaveValue('LAMPE7');
  await expect(page.getByLabel('Dein Spitzname')).toBeVisible();
});
