import { expect, test } from '@playwright/test';
import { createKidsGame } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';

test.use({ isMobile: false });

test('Smartphone: Zurück nimmt zu schnelle Klicks zurück, auch Wertung und Auflösung am Beamer', async ({ page, browser, request }) => {
  const game=createKidsGame();
  game.phase='judging'; game.index=1; game.results[0]='correct';
  const response=await request.post('/api/kids-remotes',{data:{easy:false,game:packKidsGame(game,Date.now())}});
  expect(response.status()).toBe(201);
  const remote=await response.json();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(({id,token})=>{ sessionStorage.setItem('bb:kids:display',JSON.stringify({id,token})); },{id:remote.id,token:remote.ownerToken});
  await page.goto('/kids');
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'de-DE'});
  const phone=await context.newPage();
  await phone.goto(`/kids/steuerung#id=${remote.id}&key=${remote.remoteToken}`);
  await expect(phone.getByRole('button',{name:'← Zurück zum Rückweg',exact:true})).toBeVisible();

  await phone.getByRole('button',{name:'Mehrheit richtig · +10',exact:true}).click();
  await expect(page.locator('#kids-reveal-title')).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('20');
  await expect(phone.getByText('Die Wertung dieser Aufgabe wird zurückgenommen.',{exact:true})).toBeVisible();
  await phone.getByRole('button',{name:'← Zurück zur Wertung',exact:true}).click();
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await expect(page.locator('#kids-reveal-title')).toHaveCount(0);
  await phone.getByRole('button',{name:'Mindestens ein Kind richtig · +5',exact:true}).click();
  await expect(page.getByTestId('team-score')).toHaveText('15');

  await phone.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await expect(page.getByRole('heading',{name:game.rounds[2].question.prompt,exact:true})).toBeVisible();
  await phone.getByRole('button',{name:'30 Sekunden starten',exact:true}).click();
  await expect(phone.getByText('Der Countdown startet danach wieder von vorn.',{exact:true})).toBeVisible();
  await phone.getByRole('button',{name:'← Zurück zum Vorlesen',exact:true}).click();
  await expect(phone.getByRole('button',{name:'30 Sekunden starten',exact:true})).toBeVisible();
  await expect(page.locator('.kids-clock-left')).toHaveAttribute('aria-label','30 Sekunden');
  await phone.getByRole('button',{name:'← Zurück zur Auflösung',exact:true}).click();
  await expect(page.locator('#kids-reveal-title')).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('15');
  expect(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});
