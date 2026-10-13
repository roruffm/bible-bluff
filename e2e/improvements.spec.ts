import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { DEFAULT_SETTINGS } from '../src/shared/rules';
import { SAFE_BLUFFS } from './bluffs';
import { getQuestion } from '../src/server/questions';
import { isTooCloseToTruth } from '../src/server/text';

type Session = { code: string; token: string; playerId: string; view: { me: { name: string } } };
async function room(request: APIRequestContext, count = 2) {
  const response = await request.post('/api/rooms', { data: { name: 'Leitung', plays: true, settings: { ...DEFAULT_SETTINGS, rounds: 4, writeSeconds: 120, voteSeconds: 60, roundType: 'fragen' } } });
  const host = await response.json() as Session;
  const players = [host];
  for (let i = 2; i <= count; i++) players.push(await (await request.post(`/api/rooms/${host.code}/join`, { data: { name: `Mitspielende ${String(i).padStart(2, '0')}` } })).json() as Session);
  return { host, players, act: async (action: unknown, player = host) => {
    const response = await request.post(`/api/rooms/${host.code}/action`, { data: action, headers: { authorization: `Bearer ${player.token}` } });
    const result = await response.json();
    expect(response.ok(), JSON.stringify(result)).toBe(true);
    return result.view;
  } };
}
async function enter(page: Page, host: Session) {
  await page.addInitScript((h) => localStorage.setItem(`bible-bluff:v1:room:${h.code}`, JSON.stringify({ code: h.code, token: h.token, playerId: h.playerId, name: h.view.me.name })), host);
  await page.goto(`/r/${host.code}`);
}
async function fits(page: Page) {
  try {
    await expect(async () => {
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const overflowing = await page.locator('.display-score-grid > *, .display-final-grid > *').evaluateAll((els) => els.filter((el) => el.scrollHeight > el.clientHeight + 2).map((el) => el.className));
      expect(overflowing).toEqual([]);
    }).toPass({ timeout: 5000 });
  } catch (error) {
    await page.screenshot({ path: test.info().outputPath('display-overflow.png'), fullPage: true });
    const bounds = await page.locator('.tv > *, .display-score-grid > *, .display-final-grid > *').evaluateAll((els) => els.map((el) => ({ class: el.className, top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, height: el.getBoundingClientRect().height })));
    throw new Error(`${String(error)}\n${JSON.stringify(bounds)}`);
  }
}

test('compact room setup and lobby keep advanced settings available', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/neu');
  await expect(page.getByRole('radiogroup', { name: 'Runden' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Zeit zum Bluffen' })).not.toBeVisible();
  await page.getByLabel('Dein Spitzname').fill('Rahel');
  await page.getByRole('button', { name: /Tiere der Bibel/ }).click();
  await page.getByText('Weitere Einstellungen', { exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Zeit zum Bluffen' }).getByRole('radio', { name: '90 s' }).click();
  await page.getByRole('button', { name: 'Raum eröffnen', exact: true }).click();
  await expect(page.locator('.lobby-summary')).toContainText('Tiere der Bibel');
  await expect(page.locator('.lobby-summary')).toContainText('90 s bluffen');
  await expect(page.getByRole('group', { name: 'Themenpakete' })).not.toBeVisible();
  await page.getByText('Einstellungen ändern', { exact: true }).click();
  await expect(page.getByRole('group', { name: 'Themenpakete' })).toBeVisible();
});

test('draft survives reload, pause and a failed submit; an old draft never enters the next round', async ({ page, request }) => {
  const r = await room(request);
  await enter(page, r.host);
  await r.act({ type: 'start' });
  const field = page.getByLabel('Deine erfundene Antwort');
  await field.fill(SAFE_BLUFFS.host);
  await page.reload();
  await expect(field).toHaveValue(SAFE_BLUFFS.host);
  await r.act({ type: 'pause' });
  await r.act({ type: 'resume' });
  await page.reload();
  await expect(field).toHaveValue(SAFE_BLUFFS.host);
  await page.route('**/api/rooms/*/action', (route) => route.fulfill({ status: 500, json: { error: { code: 'http', message: 'Abgabe fehlgeschlagen.' } } }));
  await page.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(page.getByRole('alert')).toContainText('Abgabe fehlgeschlagen.');
  await page.reload();
  await expect(field).toHaveValue(SAFE_BLUFFS.host);
  await page.unroute('**/api/rooms/*/action');
  await page.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(page.getByText('Dein Bluff ist drin ✓')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.includes(':draft:')))).toEqual([]);
  await r.act({ type: 'skipPhase' }); await r.act({ type: 'skipPhase' }); await r.act({ type: 'skipPhase' }); await r.act({ type: 'next' });
  await expect(field).toHaveValue('');
});

test('failed next action can be retried and disappears after a server phase change', async ({ page, request }) => {
  const r = await room(request);
  await enter(page, r.host);
  await r.act({ type: 'start' });
  for (let i = 0; i < 3; i++) await r.act({ type: 'skipPhase' });
  await expect(page.getByRole('button', { name: 'Nächste Runde', exact: true })).toBeVisible();
  let blocked = true;
  await page.route('**/api/rooms/*/action', (route) => blocked ? route.fulfill({ status: 500, json: { error: { code: 'http', message: 'Bitte erneut versuchen.' } } }) : route.continue());
  await page.getByRole('button', { name: 'Nächste Runde', exact: true }).click();
  await expect(page.locator('.action-error')).toContainText('Aktion fehlgeschlagen');
  blocked = false;
  await page.getByRole('button', { name: 'Erneut versuchen' }).click();
  await expect(page.getByText('Runde 2 von 4')).toBeVisible();
  await expect(page.locator('.action-error')).toHaveCount(0);
  for (let i = 0; i < 3; i++) await r.act({ type: 'skipPhase' });
  blocked = true;
  await page.getByRole('button', { name: 'Nächste Runde', exact: true }).click();
  await expect(page.locator('.action-error')).toBeVisible();
  await r.act({ type: 'next' });
  await expect(page.getByText('Runde 3 von 4')).toBeVisible();
  await expect(page.locator('.action-error')).toHaveCount(0);
});

test('twelve-player display fits lobby, write, vote, scores, heart and final into 720p', async ({ browser, request }, testInfo) => {
  const r = await room(request, 12);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const tv = await context.newPage();
  await tv.goto(`/tv/${r.host.code}`);
  await expect(tv.locator('.player')).toHaveCount(12);
  await fits(tv);
  await tv.screenshot({ path: testInfo.outputPath('display-lobby.png') });
  const started = await r.act({ type: 'start' });
  await expect(tv.getByText('Runde 1 von 4')).toBeVisible();
  await fits(tv);
  const bluffs = ['Zylinderhut aus Quarzglas', 'Becher Ziegenmilch', 'Gestreifter Regenschirm', 'Blaue Wollsocken', 'Bronzene Taschenuhr', 'Winzige Kieselsteine', 'Vergoldeter Käsekuchen', 'Purpurrote Samtkissen', 'Geschnitztes Holzpferd', 'Süßer Senf', 'Silberner Gartenzwerg', 'Koffer voller Knöpfe', 'Ein Zylinderhut aus Quarzglas', 'Eine Harfe aus Zedernholz', 'Neonpinke Rollschuhe', 'Dreieckige Sonnenbrille', 'Elektrische Zahnbürste', 'Karierte Hosenträger', 'Leuchtende Schneekugel', 'Ein riesiger Plüschpinguin'].filter((text) => !isTooCloseToTruth(text, getQuestion(started.round.question.id, 'de'))).slice(0, 12);
  expect(bluffs).toHaveLength(12);
  let view;
  for (let i = 0; i < 12; i++) view = await r.act({ type: 'bluff', text: bluffs[i] }, r.players[i]);
  await expect(tv.locator('.option')).toHaveCount(view.round.options.length);
  await fits(tv);
  await tv.screenshot({ path: testInfo.outputPath('display-vote.png') });
  await r.act({ type: 'skipPhase' });
  await expect(tv.locator('.reveal')).toBeVisible();
  await fits(tv);
  await r.act({ type: 'revealNext' });
  await expect(tv.locator('.stamp-truth')).toBeVisible();
  await fits(tv);
  await r.act({ type: 'revealNext' });
  await expect(tv.locator('.reveal-rest')).toBeVisible();
  await fits(tv);
  await r.act({ type: 'skipPhase' });
  await expect(tv.locator('.display-scoreboard .score-row')).toHaveCount(12);
  await fits(tv);
  await tv.screenshot({ path: testInfo.outputPath('display-scores.png') });
  await tv.getByRole('button', { name: 'Anzeige anhalten' }).click();
  const long = getQuestion('mk-donnersoehne', 'de');
  await tv.route(`**/api/rooms/${r.host.code}`, async (route) => {
    const response = await route.fetch(); const body = await response.json();
    if (body.view.round?.phase === 'scores') {
      body.view.round.question.prompt = long.prompt;
      body.view.round.answer = { text: long.answer, ref: long.ref, discovery: long.discovery };
      body.view.round.favorites.forEach((item: { text: string }) => { item.text = 'Ein riesiger Zylinderhut aus Quarzglas mit flauschigen bunten Glitzerpompons'; });
    }
    await route.fulfill({ response, json: body });
  });
  await expect(tv.locator('.display-extra-text')).toContainText(long.discovery);
  await fits(tv);
  await tv.getByRole('button', { name: 'Nächste Ansicht', exact: true }).click();
  await fits(tv);
  await tv.screenshot({ path: testInfo.outputPath('display-long-text.png') });
  await tv.unroute(`**/api/rooms/${r.host.code}`);
  for (let round = 2; round <= 4; round++) { await r.act({ type: 'next' }); for (let i = 0; i < 3; i++) await r.act({ type: 'skipPhase' }); }
  await r.act({ type: 'next' });
  await expect(tv.getByRole('heading', { name: 'Herzensrunde', exact: true })).toBeVisible();
  await fits(tv);
  // Diese Personen spielen per API statt auf zwölf echten, regelmäßig abfragenden Handys.
  // Auch auf langsameren CI-Rechnern müssen alle als verbunden gelten, bevor die erste Antwort kommt.
  for (const p of r.players) {
    const state = await request.get(`/api/rooms/${r.host.code}`, { headers: { authorization: `Bearer ${p.token}` } });
    expect(state.ok()).toBe(true);
  }
  for (const p of r.players) await r.act({ type: 'heart', text: 'Dass Jesus Menschen ernst nimmt und auch in schwierigen Momenten bei ihnen bleibt.' }, p);
  await expect(tv.locator('.heart-answer')).toHaveCount(2);
  await fits(tv);
  await tv.screenshot({ path: testInfo.outputPath('display-heart.png') });
  await r.act({ type: 'next' });
  await expect(tv.getByRole('heading', { name: 'Endstand', exact: true })).toBeVisible();
  await fits(tv);
  await expect(tv.locator('.recap-share .qr')).toBeVisible();
  await tv.screenshot({ path: testInfo.outputPath('display-final.png') });
  await tv.getByRole('button', { name: 'Anzeige anhalten' }).click();
  for (let i = 0; i < 4; i++) { await tv.getByRole('button', { name: 'Nächste Ansicht', exact: true }).click(); await fits(tv); }
  await context.close();
});
