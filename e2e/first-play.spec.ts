import { expect, test } from '@playwright/test';

test('new visitor tries a bluff and reaches the first real question without setup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Jetzt sofort spielen' })).toBeVisible();
  await page.getByRole('button', { name: /Er bat um eine Kaffeepause/ }).click();
  await expect(page.getByText('Reingelegt!')).toBeVisible();
  await expect(page.getByRole('button', { name: /Er schlief ein und fiel aus dem Fenster/ })).toHaveClass(/is-true/);

  await page.getByRole('button', { name: 'Jetzt gegen Joseph spielen' }).click();
  await page.waitForURL(/\/r\/[A-Z]+\d+$/);
  await expect(page.getByText('Runde 1 von 4')).toBeVisible();
  await expect(page.getByLabel('Deine erfundene Antwort')).toBeVisible();
});
