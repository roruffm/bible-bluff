import { expect, test } from '@playwright/test';
import { createKidsGame } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';
import { showKidsOperator } from './kids-operator';

test.use({ viewport: { width: 1440, height: 900 }, isMobile: false });

test('Kids: Jona-Einheiten bleiben bei Wiederherstellung, Fernbedienung und Auflösung eindeutig; Feldfarben stimmen überein', async ({ page, browser, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const game = createKidsGame();
  game.index = 4; game.phase = 'reading'; game.results.fill('none', 0, 4); game.results[0] = 'correct';
  const response = await request.post('/api/kids-remotes', { data: { easy: false, game: packKidsGame(game, Date.now()) } });
  expect(response.status()).toBe(201);
  const remote = await response.json();
  await page.addInitScript(({ id, token }) => sessionStorage.setItem('bb:kids:display', JSON.stringify({ id, token })), { id: remote.id, token: remote.ownerToken });
  await page.goto('/kids');
  await showKidsOperator(page);
  await expect(page.locator('.kids-answers .kids-answer-text')).toHaveText(['1 Tag', '40 Tage', '3 Tage']);
  const expected = ['#ffad5c', '#7fbfff', '#b994ff'];
  const palette = () => page.locator('.kids-answers > li').evaluateAll(els => els.map(el => getComputedStyle(el).getPropertyValue('--field').trim()));
  expect(await palette()).toEqual(expected);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
  const control = await context.newPage();
  try {
    await control.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await control.setViewportSize(size);
      await expect(control.locator('.kids-remote-answers li')).toHaveCount(3);
      expect(await control.locator('.kids-remote-answers li').evaluateAll(els => els.map(el => getComputedStyle(el).getPropertyValue('--field').trim()))).toEqual(expected);
      await expect(control.locator('.kids-remote-answers li').nth(0)).toContainText('1 Tag');
      await expect(control.locator('.kids-remote-answers li').nth(1)).toContainText('40 Tage');
      await expect(control.locator('.kids-remote-answers li').nth(2)).toContainText('3 Tage');
    }
    await control.getByRole('button', { name: 'Countdown überspringen', exact: true }).click();
    await control.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
    await control.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
    await control.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
    await expect(page.locator('.kids-reveal-answer .kids-answer-text')).toHaveText('3 Tage');
    await expect(page.getByTestId('team-score')).toHaveText('20');
  } finally { await context.close(); }
});

test('Kids: Maskottchen begrüßen durchgehend und verabschieden kurz; die Antwortwahl bleibt ruhig und nur die letzten Sekunden pulsieren', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/kids');
  await expect(page.locator('.kids-show-teams .kids-mascot')).toHaveCount(3);
  const allLoop = (mascots: Element[]) => mascots.map(el => {
    const animations = el.getAnimations({ subtree: true });
    return animations.length > 0 && animations.every(a => a.effect!.getTiming().iterations === Infinity);
  });
  await expect.poll(() => page.locator('.kids-show-teams .kids-mascot').evaluateAll(allLoop)).toEqual([true, true, true]);
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
  await showKidsOperator(page);
  await expect(page.locator('.kids-team-badges .kids-mascot')).toHaveCount(3);
  await expect.poll(() => page.locator('.kids-team-badges .kids-mascot').evaluateAll(allLoop)).toEqual([true, true, true]);
  await expect(page.locator('.is-welcome .professor-character .bluff-arm-right')).toHaveCSS('animation-iteration-count', 'infinite');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('.kids-team-badges .kids-mascot').evaluateAll(els => els.every(el => el.getAnimations({ subtree: true }).length === 0))).toBe(true);
  await expect(page.locator('.is-welcome .professor-character .bluff-arm-right')).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
  await expect(page.locator('.kids-mascot-perch')).not.toHaveClass(/is-flying/, { timeout: 6000 });
  expect(await page.locator('.kids-active-group .kids-mascot').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await page.clock.install();
  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  await expect(page.locator('.kids-clock-left .kids-clock-beat')).toHaveCSS('animation-name', 'none');
  expect(await page.locator('.kids-answers').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await page.clock.fastForward(25_000);
  await expect(page.locator('.kids-clock-left')).toHaveClass(/is-urgent/);
  await expect(page.locator('.kids-clock-left .kids-clock-beat')).toHaveCSS('animation-name', 'kids-clock-beat-urgent');
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await expect(page.locator('.kids-clock-left .kids-clock-beat')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Spiel mit Punktestand abschließen', exact: true }).click();
  await page.getByRole('button', { name: 'Jetzt mit Punktestand abschließen', exact: true }).click();
  await expect(page.locator('.kids-ending-groups .kids-mascot')).toHaveCount(3);
  expect(await page.locator('.kids-ending-groups').evaluate(el => el.getAnimations({ subtree: true }).every(a => a.effect!.getTiming().iterations !== Infinity))).toBe(true);
});
