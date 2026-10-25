import { expect, test } from '@playwright/test';
import { showKidsOperator } from './kids-operator';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

test('Kids: eigene Musiketappen wechseln mit der Show, pausieren und bleiben getrennt von Professor-Audios', async ({ page }) => {
  await page.addInitScript(() => {
    const audio = { starts: [] as string[], stops: [] as string[] };
    Object.assign(window, { musicAudio: audio });
    const fetched = new WeakMap<ArrayBuffer, string>(), decoded = new WeakMap<AudioBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const bytes = await arrayBuffer.call(this);
      if (this.url.includes('/audio/kids-music/')) fetched.set(bytes, this.url.split('/').pop()!);
      return bytes;
    };
    const decode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, bytes: ArrayBuffer) {
      const file = fetched.get(bytes);
      return decode.call(this, bytes).then(buffer => { if (file) decoded.set(buffer, file); return buffer; });
    } as typeof decode;
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this), start = source.start.bind(source), stop = source.stop.bind(source);
      source.start = (...args) => { const file = source.buffer && decoded.get(source.buffer); if (file) audio.starts.push(file); return start(...args); };
      source.stop = (...args) => { const file = source.buffer && decoded.get(source.buffer); if (file) audio.stops.push(file); return stop(...args); };
      return source;
    };
  });
  const counts = () => page.evaluate(() => (window as unknown as { musicAudio: { starts: string[]; stops: string[] } }).musicAudio);
  const last = () => counts().then(audio => audio.starts.at(-1));
  await page.goto('/kids');
  expect((await counts()).starts).toEqual([]);
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click(); await showKidsOperator(page);
  await expect.poll(last).toBe('ready-set-solve-01-willkommen.mp3');
  await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
  await expect(page.locator('.kids-music-stage')).toHaveText('Etappe: Begrüßung');
  await page.getByRole('button', { name: 'Hintergrundmusik lauter', exact: true }).click();
  await expect(page.locator('.kids-music-volume output')).toHaveText('30 %');
  expect((await counts()).starts).toHaveLength(1);
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await expect.poll(last).toBe('ready-set-solve-02-rundenstart.mp3');
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
  await expect.poll(last).toBe('ready-set-solve-03-nachdenken.mp3');
  await page.getByRole('button', { name: 'Frage vorlesen', exact: false }).click();
  expect((await counts()).starts).toHaveLength(3);
  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await expect.poll(last).toBe('ready-set-solve-04-antwortzeit.mp3');
  await page.keyboard.press('p');
  await expect.poll(() => counts().then(audio => audio.stops.at(-1))).toBe('ready-set-solve-04-antwortzeit.mp3');
  await page.getByRole('button', { name: 'Weiter geht’s', exact: true }).click();
  await expect.poll(() => counts().then(audio => audio.starts)).toHaveLength(5);
  await page.getByRole('button', { name: 'Direkt ins Finale', exact: true }).click();
  await expect.poll(last).toBe('ready-set-solve-07-finale.mp3');
  await page.getByRole('button', { name: 'Spiel mit Punktestand abschließen', exact: true }).click();
  await page.getByRole('button', { name: 'Jetzt mit Punktestand abschließen', exact: true }).click();
  await expect.poll(last).toBe('ready-set-solve-08-abschluss.mp3');
});
