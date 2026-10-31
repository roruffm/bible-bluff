import { expect, test } from '@playwright/test';
import { createKidsGame } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';
import { runKidsRegie, selectKidsRegie } from './kids-regie';

test('Smartphone-Regie: Wiedergabe, Stopp, Wiederherstellung und vollständiger Rundenabschluss', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const made = await request.post('/api/kids-remotes', { data: { easy: false, game: packKidsGame({ ...createKidsGame(), phase: 'reading' }, Date.now()) } });
  expect(made.status()).toBe(201);
  const remote = await made.json(), path = `/api/kids-remotes/${remote.id}`;
  const headers = { authorization: `Bearer ${remote.ownerToken}` };
  const acknowledge = async () => {
    let view: { version: number; game: { voiceSeq: number; voicePlaying: boolean } };
    await expect.poll(async () => { view = await (await request.get(path, { headers })).json(); return view.game.voicePlaying; }).toBe(true);
    for (const [offset, state] of ['playing', 'ended'].entries()) {
      const response = await request.post(path + '/action', { headers, data: { version: view!.version + offset, action: `voice-status:${view!.game.voiceSeq}:${state}` } });
      expect(response.status()).toBe(200);
    }
  };
  await page.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
  const step = (id: string) => page.locator(`[data-regie-step="${id}"]`);
  await expect(page.locator('.kids-regie')).not.toContainText('Professor-Tipp');
  await runKidsRegie(page, 'call', 'Forscher aufrufen am Beamer abspielen');
  await expect(step('call')).toHaveAttribute('aria-label', 'Aufruf, offen');
  await acknowledge();
  await expect(step('call')).toHaveAttribute('aria-label', 'Aufruf, erledigt');
  await expect(step('invite')).toHaveAttribute('aria-current', 'step');
  const positions = await page.locator('.kids-regie-action').evaluate(el => ({ invite: el.querySelector('.kids-regie-main')!.getBoundingClientRect().bottom, scene: el.querySelector('.kids-regie-scene-next')!.getBoundingClientRect().top }));
  expect(positions.invite).toBeLessThan(positions.scene);
  await page.getByRole('button', { name: 'Seht euch die Szene an am Beamer abspielen', exact: true }).click();
  await page.getByRole('button', { name: 'Professor-Audio stoppen', exact: true }).click();
  await expect(step('invite')).toHaveAttribute('aria-label', 'Ansage, offen');
  await page.reload();
  await expect(step('call')).toHaveAttribute('aria-label', 'Aufruf, erledigt');
  await expect(step('invite')).toHaveAttribute('aria-current', 'step');
  await runKidsRegie(page, 'question', 'Frage am Beamer vorlesen');
  await acknowledge();
  await expect(step('question')).toHaveAttribute('aria-label', 'Frage, erledigt');
  await expect(step('invite')).toHaveAttribute('aria-label', 'Ansage, übersprungen');
  await expect(step('scene')).toHaveAttribute('aria-label', 'Szene, übersprungen');
  await page.getByRole('button', { name: 'Überspringen ⏭', exact: true }).click();
  await expect(step('answers')).toHaveAttribute('aria-label', 'Antworten, übersprungen');
  await runKidsRegie(page, 'countdown', '30 Sekunden starten');
  await page.getByRole('button', { name: 'Countdown überspringen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Stopp auf den Antwortfeldern', exact: true })).toBeVisible();
  await expect(step('stop')).toHaveAttribute('aria-current', 'step');
  await page.getByRole('button', { name: 'Stopp · Helfer prüfen am Beamer abspielen', exact: true }).click();
  await acknowledge();
  await expect(step('stop')).toHaveAttribute('aria-label', 'Stopp, erledigt');
  await expect(page.getByRole('heading', { name: 'Die Felder prüfen lassen', exact: true })).toBeVisible();
  await runKidsRegie(page, 'recall', 'Zurück in die Gruppen');
  await acknowledge();
  await expect(step('recall')).toHaveAttribute('aria-label', 'Rückruf, erledigt');
  await runKidsRegie(page, 'back', 'Alle sind zurück');
  await page.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mehrheit richtig +10 am Beamer abspielen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mehrheit richtig +10 am Beamer abspielen', exact: true }).click();
  await acknowledge();
  await expect(page.getByRole('button', { name: 'Nächste Aufgabe', exact: true })).toBeVisible();
  await page.reload();
  await expect(step('announce')).toHaveAttribute('aria-label', 'Ansage, erledigt');
  await page.getByRole('button', { name: 'Nächste Aufgabe', exact: true }).click();
  await expect(page.locator('.kids-regie-round')).toContainText('Runde 2 von 10');
  await selectKidsRegie(page, 'answers');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

