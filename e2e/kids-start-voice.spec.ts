import { expect, test } from '@playwright/test';
import { createKidsGame } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';
import { showKidsOperator } from './kids-operator';
import { professorAudio, trackProfessorAudio } from './professor-audio';

test.use({ isMobile: false });

test('Professor: Start des Countdowns am Beamer spielt automatisch die Startansage, Fortsetzen nicht', async ({ page }) => {
  await trackProfessorAudio(page);
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
  await showKidsOperator(page);
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
  expect((await professorAudio(page)).starts).toBe(0);
  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await expect.poll(async () => (await professorAudio(page)).played).toEqual(['interjection-signal-go']);
  await page.getByRole('button', { name: 'Pause', exact: false }).click();
  await page.getByRole('button', { name: 'Weiter geht’s', exact: true }).click();
  await page.waitForTimeout(800);
  expect((await professorAudio(page)).played).toEqual(['interjection-signal-go']);
});

test('Smartphone: Start des Countdowns spielt die Startansage am Beamer, nicht am Handy', async ({ page, browser, request }) => {
  const game = createKidsGame();
  game.phase = 'reading'; game.index = 1; game.results[0] = 'correct';
  const response = await request.post('/api/kids-remotes', { data: { easy: false, game: packKidsGame(game, Date.now()) } });
  expect(response.status()).toBe(201);
  const remote = await response.json();
  await trackProfessorAudio(page);
  await page.addInitScript(({ id, token }) => { sessionStorage.setItem('bb:kids:display', JSON.stringify({ id, token })); }, { id: remote.id, token: remote.ownerToken });
  await page.goto('/kids');
  await showKidsOperator(page);
  await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
  await page.getByRole('button', { name: 'Klang einschalten', exact: true }).click();
  await page.getByRole('button', { name: 'Menü schließen', exact: true }).click();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const phone = await context.newPage(), phoneAudio: string[] = [];
  phone.on('request', r => { if (r.url().includes('/professor-bluff/')) phoneAudio.push(r.url()); });
  await phone.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
  await phone.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await expect.poll(async () => (await professorAudio(page)).played).toEqual(['interjection-signal-go']);
  expect(phoneAudio).toEqual([]);
  await context.close();
});
