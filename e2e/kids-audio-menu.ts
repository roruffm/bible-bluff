import type { Page } from '@playwright/test';

export async function openKidsAudioSituation(page: Page, situation: string) {
  const flow = page.getByRole('tab', { name: 'Ablauf', exact: true });
  if (await flow.count()) await flow.click();
  const menu = page.locator('.kids-mobile-more');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
  const back = menu.getByRole('button', { name: '← Alle Situationen', exact: true });
  if (await back.isVisible()) await back.click();
  await menu.getByRole('button', { name: situation, exact: true }).click();
}
