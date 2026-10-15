import { expect,test } from '@playwright/test';
test.use({viewport:{width:1280,height:800},isMobile:false});
test('Kids: neue Gruppennamen tragen bei jedem Auftreten ihr festes Symbol',async({page})=>{
  await page.goto('/kids');
  for(const [group,name,age] of [['minis','Glühwürmchen','3–5 Jahre'],['mittis','Leuchtsterne','6–8 Jahre'],['maxis','Fackelträger','9–11 Jahre']] as const){
    const badge=page.locator(`.kids-show-teams [data-group="${group}"]`);
    await expect(badge).toHaveText(name);await expect(badge.locator('svg')).toHaveCount(1);
    await expect(badge.locator('../..')).toContainText(age);
  }
  await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
  await expect(page.locator('.kids-team-badges .kids-group-symbol')).toHaveCount(3);
  await expect(page.locator('.kids-team-badges .kids-group-ages')).toHaveText(['3–5 Jahre','6–8 Jahre','9–11 Jahre']);
  await expect(page.locator('.kids-show-interlude')).not.toContainText(/Die Spürnasen|Die Rätselknacker|Die Bluffjäger/);
  await expect(page.locator('.kids-team-score .kids-group-symbol')).toHaveCount(3);
  await expect(page.locator('.kids-round-counter [data-group="minis"]')).toHaveText('Glühwürmchen');
  await page.getByRole('button',{name:'Spiel mit Punktestand abschließen',exact:true}).click();
  await page.getByRole('button',{name:'Jetzt mit Punktestand abschließen',exact:true}).click();
  await expect(page.locator('.kids-ending header .kids-group-symbol')).toHaveCount(3);
  await expect(page.locator('.kids-page')).not.toContainText(/Minis|Mittis|Maxis/);
});
