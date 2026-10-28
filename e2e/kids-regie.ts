import type { Page } from '@playwright/test';

export async function selectKidsRegie(page: Page, id: string) {
  await page.locator('.kids-remote-dashboard').waitFor({ state: 'visible' });
  const regie = page.locator('.kids-regie');
  if (!await regie.count()) return;
  const step = regie.locator(`[data-regie-step="${id}"]`);
  if (await step.count() && await step.isEnabled()) await step.click();
}
export async function runKidsRegie(page: Page, id: string, desktopLabel: string) {
  await page.locator('.kids-remote-dashboard').waitFor({ state: 'visible' });
  const regie = page.locator('.kids-regie');
  if (!await regie.count()) { await page.getByRole('button', { name: desktopLabel, exact: true }).click(); return; }
  if (id === 'recall') {
    const check = regie.getByRole('button', { name: 'Helfer sind fertig', exact: true });
    if (await check.isVisible()) await check.click();
  }
  if (id === 'next') {
    const announce = regie.locator('[data-regie-step="announce"]');
    if (await announce.count() && await announce.isEnabled()) {
      await announce.click();
      await regie.getByRole('button', { name: 'Überspringen ⏭', exact: true }).click();
    }
  } else await selectKidsRegie(page, id);
  await regie.locator('.kids-regie-main').click();
}
