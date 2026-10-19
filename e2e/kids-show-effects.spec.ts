import { expect, test, type Page } from '@playwright/test';
import { showKidsOperator } from './kids-operator';

test.use({viewport:{width:1280,height:800},isMobile:false});

async function begin(page: Page) {
  await page.goto('/kids');
  await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
  await showKidsOperator(page);
  await page.getByRole('button',{name:'Mission starten',exact:true}).click();
  await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
}
async function judging(page: Page) {
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Countdown überspringen',exact:true}).click();
  await page.getByRole('button',{name:'Zurück in die Gruppen',exact:true}).click();
  await page.getByRole('button',{name:'Alle sind zurück',exact:true}).click();
}

test('Kids: Gruppenauftritt, Punkteflug nach dem Trommelwirbel und kein Wiederholen nach Neuladen', async ({page}) => {
  await begin(page);
  await expect(page.locator('.kids-active-group')).toHaveClass(/is-mascot-entering/);
  await expect(page.locator('.kids-active-group .kids-group-symbol')).toHaveCSS('animation-name','kids-researcher-arrival');
  await judging(page);
  await page.getByRole('button',{name:'Mehrheit richtig · +10',exact:true}).click();
  await expect(page.locator('.kids-suspense')).toBeVisible();
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await expect(page.locator('.kids-points-token')).toContainText('+10',{timeout:8000});
  await expect(page.locator('.kids-points-token [data-group="minis"]')).toHaveCount(1);
  await expect(page.locator('.kids-points-flight')).toHaveCSS('pointer-events','none');
  await expect(page.getByTestId('team-score')).toHaveText('10');

  await page.reload();
  await page.getByRole('button',{name:'Show fortsetzen',exact:true}).click();
  await showKidsOperator(page);
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await expect(page.locator('.kids-active-group')).toHaveClass(/is-mascot-entering/);
  await expect(page.locator('.kids-active-group .kids-group-symbol')).toHaveCSS('animation-name','kids-star-arrival');
  await judging(page);
  await page.getByRole('button',{name:'Keiner richtig · +0',exact:true}).click();
  await expect(page.locator('.kids-suspense')).toBeVisible();
  await expect(page.locator('.kids-suspense')).toHaveCount(0,{timeout:8000});
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await expect(page.locator('.kids-active-group .kids-group-symbol')).toHaveCSS('animation-name','kids-torch-arrival');
});

test('Kids: Reduzierte Bewegung zeigt die Wertung sofort und verzichtet auf Auftritte und Punkteflug', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await begin(page);
  await expect(page.locator('.kids-active-group')).not.toHaveClass(/is-mascot-entering/);
  await judging(page);
  await page.getByRole('button',{name:'Mehrheit richtig · +10',exact:true}).click();
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await expect(page.locator('.kids-suspense')).toHaveCount(0);
});
