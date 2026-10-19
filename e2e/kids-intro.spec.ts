import { expect, test } from '@playwright/test';
import { showKidsOperator } from './kids-operator';

// Chrome bringt die H.264/AAC-Codecs des Erklärvideos mit.
test.use({ channel: 'chrome', launchOptions: process.env.KIDS_TEST_CHROME_PATH ? { executablePath: process.env.KIDS_TEST_CHROME_PATH } : {}, viewport: { width: 1280, height: 800 }, isMobile: false });

test('Erklärvideo: Smartphone steuert nur den Beamer; Pause, Ende und Spielstart bleiben getrennt', async ({ page, browser }) => {
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Smartphone-Fernbedienung einrichten', exact: true }).click();
  const link = await page.getByRole('link', { name: 'Fernbedienung öffnen', exact: false }).getAttribute('href');
  await page.getByRole('button', { name: 'Zur Partie', exact: true }).click();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const phone = await phoneContext.newPage();
  const phoneVideo: string[] = [];
  phone.on('request', req => { if (req.url().endsWith('.mp4')) phoneVideo.push(req.url()); });
  try {
    await phone.goto(link!);
    const play = phone.getByRole('button', { name: 'Erklärvideo am Beamer abspielen', exact: false });
    await expect(play).toBeVisible();
    await play.click();
    const film = page.locator('.kids-intro-film');
    await expect(film).toBeVisible();
    await expect.poll(() => film.evaluate((el: HTMLVideoElement) => !el.paused && el.currentTime > .2)).toBe(true);
    await expect(page.locator('.kids-intro-stage button')).toHaveCount(0);
    await expect(phone.getByRole('button', { name: 'Mission starten', exact: true })).toBeDisabled();
    await page.keyboard.press('ArrowRight');
    await expect(film).toBeVisible();
    await phone.getByRole('button', { name: 'Erklärvideo pausieren', exact: false }).click();
    await expect.poll(() => film.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
    const pausedAt = await film.evaluate((el: HTMLVideoElement) => el.currentTime);
    await phone.getByRole('button', { name: 'Erklärvideo fortsetzen', exact: false }).click();
    await expect.poll(() => film.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(pausedAt + .1);
    // Dieselbe Fernbedienung auch am Desktop; keine zusätzliche Medienwiedergabe.
    await phone.setViewportSize({ width: 1440, height: 900 });
    await expect(phone.getByRole('button', { name: 'Video beenden', exact: false })).toBeVisible();
    await film.evaluate((el: HTMLVideoElement) => { el.currentTime = 10; });
    await expect.poll(() => film.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(9);
    await phone.getByRole('button', { name: 'Video von vorne', exact: false }).click();
    await expect.poll(() => film.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(4);
    // Das echte Ende des Films gibt die Begrüßung wieder frei.
    await film.evaluate((el: HTMLVideoElement) => { el.currentTime = el.duration - .2; });
    await expect(page.locator('.kids-intro-stage')).toBeHidden();
    await expect(phone.getByRole('button', { name: 'Mission starten', exact: true })).toBeEnabled();
    await phone.getByRole('button', { name: 'Mission starten', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Die erste Spur', exact: true })).toBeVisible();
    expect(phoneVideo).toEqual([]);
  } finally { await phoneContext.close(); }
});

test('Erklärvideo: Mausbedienung kann wiederholen und abbrechen; die Kinder sehen keine Videoknöpfe', async ({ page }) => {
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Erklärvideo am Beamer abspielen', exact: false })).toBeHidden();
  await showKidsOperator(page);
  await page.getByRole('button', { name: 'Erklärvideo am Beamer abspielen', exact: false }).click();
  await expect(page.locator('.kids-intro-film')).toBeVisible();
  await page.getByRole('button', { name: 'Video beenden', exact: false }).click();
  await expect(page.locator('.kids-intro-stage')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Mission starten', exact: true })).toBeEnabled();
});
