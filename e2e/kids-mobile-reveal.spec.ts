import { expect, test } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true });

test('Kids: mobile Auflösung trennt Professor und Kommentar und lässt den Spruch abspielen', async ({ page }) => {
  test.setTimeout(180_000);
  const sizes = [
    { width: 320, height: 568 },
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ];
  await page.addInitScript(() => {
    const audio = { starts: 0, stops: 0 };
    Object.assign(window, { mobileProfessorAudio: audio });
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this), start = source.start.bind(source), stop = source.stop.bind(source);
      source.start = (...args) => { audio.starts++; return start(...args); };
      source.stop = (...args) => { audio.stops++; return stop(...args); };
      return source;
    };
  });
  const audioCounts = () => page.evaluate(() => (window as unknown as { mobileProfessorAudio: { starts: number; stops: number } }).mobileProfessorAudio);
  await page.clock.install();
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/kids');
    await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
    await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
    await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
    let starts = 0, stops = 0;
    for (const result of ['Keiner richtig · +0', 'Mindestens ein Kind richtig · +5', 'Mehrheit richtig · +10']) {
      await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
      await page.clock.fastForward(30000);
      await page.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
      await page.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
      await page.getByRole('button', { name: result, exact: true }).click();
      const play = page.getByRole('button', { name: 'Professor-Spruch abspielen', exact: true });
      await expect(play).toBeVisible();
      await play.scrollIntoViewIfNeeded();
      const problems = await page.evaluate(() => {
        const art = document.querySelector('.kids-reaction-art > .bluff-professor')!.getBoundingClientRect();
        const bubble = document.querySelector('.kids-reaction-bubble')!.getBoundingClientRect();
        const button = document.querySelector('.kids-reaction .kids-voice-play')!.getBoundingClientRect();
        const overlap = art.left < bubble.right && art.right > bubble.left && art.top < bubble.bottom && art.bottom > bubble.top;
        const hit = document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2);
        return { overlap, covered: !hit?.closest('.kids-voice-play'), smallTarget: button.height < 44,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      expect(problems, `${size.width}x${size.height}: ${result}`).toEqual({ overlap: false, covered: false, smallTarget: false, horizontalOverflow: false });
      await play.click();
      await expect.poll(async () => (await audioCounts()).starts).toBe(++starts);
      await page.getByRole('button', { name: 'Professor-Spruch stoppen', exact: true }).click();
      await expect.poll(async () => (await audioCounts()).stops).toBe(++stops);
      await page.getByRole('button', { name: 'Maussteuerung ausblenden', exact: true }).click();
      await expect(play).toBeVisible();
      await play.click();
      await expect.poll(async () => (await audioCounts()).starts).toBe(++starts);
      await page.getByRole('button', { name: 'Maussteuerung einblenden', exact: true }).click();
      await page.getByRole('button', { name: 'Professor-Spruch stoppen', exact: true }).click();
      await expect.poll(async () => (await audioCounts()).stops).toBe(++stops);
      await page.getByRole('button', { name: result.startsWith('Mehrheit') ? 'Nächstes Kapitel' : 'Nächste Aufgabe', exact: true }).click();
    }
  }
});
