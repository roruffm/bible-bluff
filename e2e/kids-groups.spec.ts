import { showKidsOperator } from './kids-operator';
import { expect,test } from '@playwright/test';
test.use({viewport:{width:1280,height:800},isMobile:false});
test('Kids: neue Gruppennamen tragen bei jedem Auftreten ihr festes Symbol',async({page})=>{
  await page.goto('/kids');
  for(const [group,name,age] of [['minis','Glühwürmchen','3–5 Jahre'],['mittis','Leuchtsterne','6–8 Jahre'],['maxis','Fackelträger','9–11 Jahre']] as const){
    const badge=page.locator(`.kids-show-teams [data-group="${group}"]`);
    await expect(badge).toHaveText(name);await expect(badge.locator('svg')).toHaveCount(1);
    await expect(badge.locator('../..')).toContainText(age);
  }
  await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click(); await showKidsOperator(page);
  await expect(page.locator('.kids-team-badges .kids-group-symbol')).toHaveCount(3);
  await expect(page.locator('.kids-team-badges .kids-group-ages')).toHaveText(['3–5 Jahre','6–8 Jahre','9–11 Jahre']);
  await expect(page.locator('.kids-show-interlude')).not.toContainText(/Die Spürnasen|Die Rätselknacker|Die Bluffjäger/);
  for(const viewport of [{width:800,height:600},{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080},{width:2560,height:1440}]) {
    await page.setViewportSize(viewport);
    const problems=await page.locator('.kids-show-interlude').evaluate(el=>{
      const issues:string[]=[];
      for(const child of el.querySelectorAll('.kids-show-story,.kids-show-host,.kids-team-badges > div')) {
        const box=child.getBoundingClientRect();
        if(box.left<0 || box.right>innerWidth+1 || box.top<0 || box.bottom>innerHeight+1)issues.push(`Außerhalb: ${child.className}`);
      }
      for(const name of el.querySelectorAll('.kids-group-name > span')) {
        const box=name.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(name);
        const text=range.getBoundingClientRect();
        if(text.left<box.left-1 || text.right>box.right+1)issues.push(`Name abgeschnitten: ${name.textContent}`);
        if(parseFloat(getComputedStyle(name).fontSize)<22)issues.push(`Name zu klein: ${name.textContent}`);
      }
      return issues;
    });
    expect(problems).toEqual([]);
  }
  await page.setViewportSize({width:1280,height:800});
  await expect(page.locator('.kids-compact-score')).toHaveCount(1);
  await page.getByRole('button',{name:'Mission starten',exact:true}).click();
  await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
  await expect(page.locator('.kids-active-group [data-group="minis"]')).toHaveText('Glühwürmchen');
  await page.getByRole('button',{name:'Spiel mit Punktestand abschließen',exact:true}).click();
  await page.getByRole('button',{name:'Jetzt mit Punktestand abschließen',exact:true}).click();
  await expect(page.locator('.kids-ending header .kids-group-symbol')).toHaveCount(3);
  await expect(page.locator('.kids-page')).not.toContainText(/Minis|Mittis|Maxis/);
});
