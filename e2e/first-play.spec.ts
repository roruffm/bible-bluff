import { expect, test } from '@playwright/test';

test('new visitor tries a bluff and reaches the first real question without setup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.hero').getByRole('button', { name: 'Jetzt gegen Jakob spielen' })).toBeVisible();
  await page.getByRole('button', { name: /In einem Brotlaib/ }).click();
  await expect(page.getByText('Reingelegt!')).toBeVisible();
  await expect(page.getByRole('button', { name: /Im Maul eines Fisches/ })).toHaveClass(/is-true/);

  await page.locator('.preview-reveal').getByRole('button', { name: 'Jetzt gegen Jakob spielen' }).click();
  await page.waitForURL(/\/r\/[A-Z]+\d+$/);
  await expect(page.getByText('Runde 1 von 4')).toBeVisible();
  await expect(page.getByLabel('Deine erfundene Antwort')).toBeVisible();
});
