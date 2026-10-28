import { expect, type Page } from '@playwright/test';

async function waitForLayout(page: Page) {
  await page.locator('.kids-remote-dashboard').waitFor({ state: 'visible' });
  const desktop = await page.evaluate(() => matchMedia('(min-width: 1024px)').matches);
  if (desktop) await expect(page.locator('.kids-remote-page')).toHaveClass(/is-desktop/);
  else await expect(page.locator('.kids-remote-page')).not.toHaveClass(/is-desktop/);
  return desktop;
}
export async function selectKidsRegie(page: Page, id: string) {
  if (await waitForLayout(page)) return;
  const regie = page.locator('.kids-regie');
  await expect(regie).toBeVisible();
  const step = regie.locator(`[data-regie-step="${id}"]`);
  await expect(step).toBeEnabled();
  await step.click();
}
export async function runKidsRegie(page: Page, id: string, desktopLabel: string) {
  const desktop = await waitForLayout(page);
  const regie = page.locator('.kids-regie');
  if (desktop) {
    const name = ['answers', 'question', 'welcome'].includes(id) ? `▶ ${desktopLabel}` : desktopLabel;
    await page.getByRole('button', { name, exact: true }).click({ timeout: 15000 });
    return;
  }
  if (id === 'recall') {
    await expect(regie.locator('[data-regie-step="recall"]')).toBeEnabled();
    const check = regie.getByRole('button', { name: 'Helfer sind fertig', exact: true });
    if (await check.isVisible()) await check.click();
  }
  if (id === 'next') {
    const announce = regie.locator('[data-regie-step="announce"]');
    await expect(announce).toBeEnabled();
    if (await announce.isEnabled()) {
      await announce.click();
      await regie.getByRole('button', { name: 'Überspringen ⏭', exact: true }).click();
    }
  } else await selectKidsRegie(page, id);
  await regie.locator('.kids-regie-main').click({ timeout: 15000 });
}
