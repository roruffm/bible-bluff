import type { Page } from '@playwright/test';

/** Tests der Mausbedienung aktivieren sie ausdrücklich; die Kinderansicht bleibt der Standard. */
export async function showKidsOperator(page: Page) {
  await page.locator('.kids-show.is-playing').waitFor();
  if (await page.locator('.kids-show').evaluate(el => el.classList.contains('is-projecting'))) await page.keyboard.press('h');
}
