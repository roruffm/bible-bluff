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

for (const lang of ['de', 'en'] as const) {
  test(`guided fourth answer and topic packs (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lang === 'en' ? '/?lang=en' : '/');
    const practice = page.locator('.preview-practice');
    await practice.locator('summary').first().click();
    await practice.locator('textarea').fill(lang === 'en' ? 'In a loaf of bread' : 'In einem Brotlaib');
    await practice.getByRole('button', { name: lang === 'en' ? 'Check my bluff' : 'Bluff prüfen' }).click();
    await expect(practice.getByRole('status')).toContainText(lang === 'en' ? 'already listed' : 'steht schon oben');
    await practice.locator('textarea').fill(lang === 'en' ? 'In a fish' : 'In einem Fisch');
    await practice.getByRole('button', { name: lang === 'en' ? 'Check my bluff' : 'Bluff prüfen' }).click();
    await expect(practice.getByRole('status')).toContainText(lang === 'en' ? 'too close' : 'zu nah');
    await practice.locator('.practice-help > summary').click();
    await practice.locator('.practice-example').first().click();
    await practice.getByRole('button', { name: lang === 'en' ? 'Check my bluff' : 'Bluff prüfen' }).click();
    await expect(practice.locator('.is-ready')).toBeVisible();
    await practice.getByRole('button', { name: lang === 'en' ? 'Reveal the answer' : 'Auflösung zeigen' }).click();
    await expect(page.locator('.preview-reveal')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: lang === 'en' ? /Play with friends/ : /Mit Freunden spielen/ }).click();
    const pack = page.getByRole('button', { name: lang === 'en' ? /Animals of the Bible/ : /Tiere der Bibel/ });
    await pack.click();
    await expect(pack).toHaveAttribute('aria-pressed', 'true');
    await expect(pack).toContainText('19');
    await page.getByLabel(lang === 'en' ? 'Your nickname' : 'Dein Spitzname').fill('Test');
    await page.getByRole('button', { name: lang === 'en' ? 'Create a room' : 'Raum eröffnen', exact: true }).click();
    await page.waitForURL(/\/r\/[A-Z]+\d+$/);
    await expect(page.locator('.topic-pack.is-on')).toContainText(lang === 'en' ? 'Animals of the Bible' : 'Tiere der Bibel');
  });
}
