import { expect, test } from '@playwright/test';
import { showKidsOperator } from './kids-operator';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

test('Kids: Musik läuft durch die Runden, stoppt separat und pausiert mit dem Countdown', async ({ page }) => {
  await page.addInitScript(() => {
    const counts = { starts: 0, stops: 0 };
    Object.assign(window, { musicAudio: counts });
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this), start = source.start.bind(source), stop = source.stop.bind(source);
      source.start = (...args) => { if (source.loop) counts.starts++; return start(...args); };
      source.stop = (...args) => { if (source.loop) counts.stops++; return stop(...args); };
      return source;
    };
  });
  const counts = () => page.evaluate(() => (window as unknown as { musicAudio: { starts: number; stops: number } }).musicAudio);
  await page.goto('/kids');
  expect(await counts()).toEqual({ starts: 0, stops: 0 });
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
  await showKidsOperator(page);
  await expect.poll(counts).toEqual({ starts: 1, stops: 0 });
  await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
  await page.getByRole('button', { name: 'Hintergrundmusik lauter', exact: true }).click();
  await expect(page.locator('.kids-music-volume output')).toHaveText('30 %');
  expect(await counts()).toEqual({ starts: 1, stops: 0 });
  await page.getByRole('button', { name: '♫ Musik ausschalten', exact: true }).click();
  await expect.poll(counts).toEqual({ starts: 1, stops: 1 });
  await page.getByRole('button', { name: '♫ Musik einschalten', exact: true }).click();
  await expect.poll(counts).toEqual({ starts: 2, stops: 1 });
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
  expect(await counts()).toEqual({ starts: 2, stops: 1 });
  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await page.keyboard.press('p');
  await expect.poll(counts).toEqual({ starts: 2, stops: 2 });
  await page.getByRole('button', { name: 'Weiter geht’s', exact: true }).click();
  await expect.poll(counts).toEqual({ starts: 3, stops: 2 });
});
