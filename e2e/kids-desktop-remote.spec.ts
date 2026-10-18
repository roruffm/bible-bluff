import { expect, test } from '@playwright/test';
import { createKidsGame } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';
import { showKidsOperator } from './kids-operator';
import { professorAudio, trackProfessorAudio } from './professor-audio';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

test('Fernbedienung: Desktop priorisiert Aufgabe und Audios, klappt Extras auf und wechselt ohne Spielverlust zur Smartphoneansicht', async ({ page, browser, request }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const game = createKidsGame();
  game.index = 1; game.phase = 'reading'; game.results[0] = 'correct';
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
  const control = await context.newPage();
  try {
    await control.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
    await expect(control.locator('.kids-remote-page')).toHaveClass(/is-desktop/);
    await expect(control.getByRole('tablist')).toHaveCount(0);
    for (const name of ['Spiel steuern', 'Professor-Audios', 'Weitere Funktionen']) await expect(control.getByRole('region', { name, exact: true })).toBeVisible();
    await expect(control.locator('.kids-remote-guide')).not.toHaveAttribute('open', '');
    await expect(control.locator('.kids-remote-question .kids-remote-answers li')).toHaveCount(3);
    await expect(control.locator('.kids-remote-question .kids-audio-claim')).toBeVisible();
    await expect(control.locator('.kids-phase-audio .kids-audio-claim')).toHaveCount(0);
    await expect(control.getByRole('button', { name: '30 Sekunden starten', exact: true })).toBeVisible();
    await expect(control.getByRole('searchbox', { name: 'Ansage suchen', exact: true })).toHaveCount(0);
    await expect(control.getByRole('button', { name: 'Richtig knifflig am Beamer abspielen', exact: true })).toBeVisible();
    await expect(control.getByRole('button', { name: 'Direkt ins Finale', exact: false })).toHaveCount(0);
    // Zwei klare Bereiche auf allen Desktopbreiten; seltene Funktionen bleiben eingeklappt.
    for (const width of [1024, 1280, 1366, 1920, 2560]) {
      await control.setViewportSize({ width, height: 900 });
      const layout = await control.evaluate(() => {
        const rect = (id: string) => { const b = document.getElementById(id)!.getBoundingClientRect(); return { x: b.x, right: b.right, y: b.y, bottom: b.bottom }; };
        return { flow: rect('kids-panel-flow'), audio: rect('kids-panel-audio'), tools: rect('kids-panel-tools'), pageWidth: document.querySelector('.kids-remote-page')!.getBoundingClientRect().width, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(layout.overflow).toBe(false);
      expect(layout.pageWidth).toBeGreaterThan(900);
      expect(layout.flow.right).toBeLessThan(layout.audio.x);
      expect(layout.tools.right).toBeLessThan(layout.audio.x);
      expect(layout.tools.y).toBeGreaterThan(layout.flow.bottom);
      await expect(control.getByRole('button', { name: '30 Sekunden starten', exact: true })).toBeInViewport();
    }
    await control.setViewportSize({ width: 1440, height: 900 });
    await control.screenshot({ path: info.outputPath('desktop-remote.png'), fullPage: true });
    await control.locator('.kids-phase-audio').getByRole('button', { name: 'Leuchtsterne aufrufen am Beamer abspielen', exact: true }).click();
    await expect.poll(async () => (await professorAudio(page)).played.at(-1)).toBe('interjection-call-mittis');
    await control.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
    await expect(page.locator('.kids-clock-left')).toBeVisible();
    await control.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    await expect(control.locator('.kids-remote-live strong')).toHaveText('Pause');
    const audioBeforeResize = (await professorAudio(page)).starts;
    await control.setViewportSize({ width: 390, height: 844 });
    await expect(control.locator('.kids-remote-page')).not.toHaveClass(/is-desktop/);
    await expect(control.getByRole('tab', { name: 'Ablauf', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(control.getByRole('button', { name: 'Weiter geht’s', exact: true })).toBeVisible();
    await expect(control.getByRole('button', { name: 'Direkt ins Finale', exact: false })).toHaveCount(0);
    await control.getByRole('tab', { name: 'Zusatzaudios', exact: true }).click();
    await control.getByRole('searchbox', { name: 'Ansage suchen', exact: true }).fill('knifflig');
    await control.setViewportSize({ width: 1440, height: 900 });
    await expect(control.getByRole('region', { name: 'Spiel steuern', exact: true })).toBeVisible();
    await expect(control.getByRole('searchbox', { name: 'Ansage suchen', exact: true })).toHaveValue('knifflig');
    expect((await professorAudio(page)).starts).toBe(audioBeforeResize);
    await control.getByRole('button', { name: 'Countdown überspringen', exact: true }).click();
    await control.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
    await control.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
    await control.getByRole('button', { name: 'Mehrheit richtig · +10', exact: true }).click();
    await expect(page.getByTestId('team-score')).toHaveText('20');
    await expect(control.locator('.kids-phase-audio').getByRole('button', { name: 'Jemand richtig +5 am Beamer abspielen', exact: true })).toHaveCount(0);
    await control.getByRole('button', { name: 'Letzte Wertung ändern', exact: true }).click();
    await expect(control.locator('.kids-remote-more')).toHaveAttribute('open', '');
    await control.getByRole('button', { name: 'Mindestens ein Kind richtig · 5 Punkte', exact: true }).click();
    await expect(page.getByTestId('team-score')).toHaveText('15');
    await control.getByRole('button', { name: 'Spiel abschließen', exact: true }).click();
    await expect(control.getByRole('dialog')).toBeVisible();
    await control.getByRole('button', { name: 'Weiterspielen', exact: true }).click();
    await control.reload();
    await expect(control.locator('.kids-remote-live strong')).toHaveText('Aufgelöst');
    await expect(control.locator('.kids-remote-score')).toHaveAttribute('aria-label', 'Punktestand: Kinderteam 15, Professor Bluff 14');
    await control.getByText('Weitere Funktionen', { exact: true }).click();
    await control.getByText('Alle Zusatzaudios', { exact: true }).click();
    await expect(control.getByRole('searchbox', { name: 'Ansage suchen', exact: true })).toBeVisible();
    await control.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(control.getByRole('button', { name: 'Professor-Audio stoppen', exact: false })).toBeInViewport();
    await control.getByRole('button', { name: 'Direkt ins Finale', exact: true }).click();
    await expect(control.locator('.kids-remote-more')).not.toHaveAttribute('open', '');
    await control.getByRole('button', { name: 'Gemeinsam ins Finale', exact: true }).click();
    await control.getByRole('button', { name: 'Countdown überspringen', exact: true }).click();
    await control.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
    await control.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
    await control.getByRole('button', { name: 'Mehrheit richtig · +20', exact: true }).click();
    await expect(page.getByTestId('team-score')).toHaveText('35');
    await expect(control.locator('.kids-phase-audio').getByRole('button', { name: 'Finale: Mehrheit richtig +20 am Beamer abspielen', exact: true })).toBeVisible();
    await expect(control.locator('.kids-phase-audio').getByRole('button', { name: 'Finale: Jemand richtig +10 am Beamer abspielen', exact: true })).toHaveCount(0);

  } finally { await context.close(); }
});

test('Fernbedienung: Desktop zeigt Fortschritt, gut lesbare Restzeit, eindeutige Lösung und alle Wertungen als Knöpfe', async ({ page, request }) => {
  const game = createKidsGame();
  game.index = 1; game.phase = 'reading'; game.results[0] = 'correct';
  const response = await request.post('/api/kids-remotes', { data: { easy: false, game: packKidsGame(game, Date.now()) } });
  expect(response.status()).toBe(201);
  const remote = await response.json();
  await page.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
  await expect(page.locator('.kids-remote-page')).toHaveClass(/is-desktop/);
  await expect(page.locator('.kids-remote-question > span')).toContainText('Aufgabe 2 von 10');
  const correct = page.locator('.kids-remote-question .kids-remote-answers li.is-correct');
  await expect(correct).toHaveCount(1);
  await expect(correct).toContainText(game.rounds[1].question.answer);
  await expect(correct.locator('.kids-remote-correct')).toHaveText('✓ Richtige Antwort');
  await expect(page.locator('.kids-remote-timer')).toHaveCount(0);

  await page.getByRole('button', { name: '30 Sekunden starten', exact: true }).click();
  const timer = page.getByRole('timer');
  await expect(timer).toHaveAttribute('aria-label', /^\d+ Sekunden$/);
  const box = async (name: string) => (await page.getByRole('button', { name, exact: true }).boundingBox())!;
  const back = await box('← Zurück zum Vorlesen'), skip = await box('Countdown überspringen');
  expect(back.x + back.width).toBeLessThanOrEqual(skip.x);
  expect(Math.abs(back.y - skip.y)).toBeLessThan(2);
  const note = (await page.getByText('Der Countdown startet danach wieder von vorn.', { exact: true }).boundingBox())!;
  expect(note.y).toBeGreaterThan(back.y + back.height - 1);
  expect(note.x).toBeLessThan(skip.x);
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await expect(timer).toHaveAttribute('aria-label', /^\d+ Sekunden, pausiert$/);
  await expect(page.getByText('Die Antwortzeit ist angehalten. Mit „Weiter geht’s“ läuft sie weiter.', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Countdown überspringen', exact: true }).click();
  await page.getByRole('button', { name: 'Zurück in die Gruppen', exact: true }).click();
  await page.getByRole('button', { name: 'Alle sind zurück', exact: true }).click();
  for (const name of ['Mehrheit richtig · +10', 'Mindestens ein Kind richtig · +5', 'Keiner richtig · +0']) {
    const button = page.getByRole('button', { name, exact: true });
    expect((await button.boundingBox())!.height, name).toBeGreaterThanOrEqual(44);
    expect(await button.evaluate(el => getComputedStyle(el).borderTopWidth), name).not.toBe('0px');
  }
  await page.getByRole('button', { name: 'Keiner richtig · +0', exact: true }).click();
  const link = page.getByRole('button', { name: 'Letzte Wertung ändern', exact: true });
  await expect(link).toBeVisible();
  expect(await link.evaluate(el => getComputedStyle(el).boxShadow)).toBe('none');
});
