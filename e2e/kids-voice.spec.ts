import { expect, test, type Page } from '@playwright/test';

test.use({ viewport:{width:1280,height:800}, isMobile:false });
async function observeAudio(page:Page) {
  await page.addInitScript(()=>{
    const counters={starts:0,stops:0};
    Object.assign(window,{professorAudio:counters});
    const create=AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource=function(){
      const source=create.call(this), start=source.start.bind(source), stop=source.stop.bind(source);
      source.start=(...args)=>{counters.starts++;return start(...args);};
      source.stop=(...args)=>{counters.stops++;return stop(...args);};
      return source;
    };
  });
}
async function counts(page:Page) { return page.evaluate(()=> (window as unknown as {professorAudio:{starts:number;stops:number}}).professorAudio); }

test('Professor: manuell abspielen, stoppen, wiederholen und beim Weitergehen abbrechen',async({page})=>{
  await observeAudio(page);
  const recordings:string[]=[];page.on('request',request=>{if(request.url().includes('/professor-bluff/'))recordings.push(request.url());});
  await page.goto('/kids');await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
  expect(recordings).toEqual([]);expect((await counts(page)).starts).toBe(0);
  await page.getByRole('button',{name:'Professor-Spruch abspielen',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).starts).toBe(1);
  expect(recordings[0]).toContain('/professor-bluff/welcome.mp3');
  await page.getByRole('button',{name:'Professor-Spruch stoppen',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).stops).toBe(1);
  await page.getByRole('button',{name:'Professor-Spruch abspielen',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).starts).toBe(2);
  await page.getByRole('button',{name:'Mission starten',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).stops).toBe(2);
  await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
  expect((await counts(page)).starts).toBe(2);
  await page.getByRole('button',{name:'Professor-Spruch abspielen',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).starts).toBe(3);
  expect(recordings.at(-1)).toContain('/professor-bluff/intro.mp3');
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','30 Sekunden');
  await page.getByRole('button',{name:'Spiel mit Punktestand abschließen',exact:true}).click();
  await page.getByRole('button',{name:'Jetzt mit Punktestand abschließen',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).stops).toBe(3);
  await expect(page.getByTestId('team-score')).toHaveText('0');
  await page.getByRole('button',{name:'Professor-Spruch abspielen',exact:true}).click();
  await expect.poll(async()=>(await counts(page)).starts).toBe(4);
  expect(recordings.at(-1)).toContain('/professor-bluff/lose.mp3');
});

test('Professor: Smartphone startet und stoppt am Beamer, Neuladen spielt nichts automatisch',async({page,browser})=>{
  await observeAudio(page);await page.goto('/kids');
  await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Smartphone verbinden',exact:true}).click();
  const link=page.getByRole('link',{name:'Fernbedienung öffnen',exact:false});await expect(link).toBeVisible();
  const url=await link.getAttribute('href');await page.getByRole('button',{name:'Zur Partie',exact:true}).click();
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'de-DE'}), phone=await context.newPage();
  const phoneAudio:string[]=[];phone.on('request',request=>{if(request.url().includes('/professor-bluff/'))phoneAudio.push(request.url());});
  await phone.goto(url!);await expect(phone.getByText('Mit der Beamer-Partie verbunden',{exact:true})).toBeVisible();
  expect((await counts(page)).starts).toBe(0);
  await phone.getByRole('button',{name:'Spruch am Beamer abspielen',exact:false}).click();
  await expect.poll(async()=>(await counts(page)).starts).toBe(1);
  await phone.getByRole('button',{name:'Sprache stoppen',exact:false}).click();
  await expect.poll(async()=>(await counts(page)).stops).toBe(1);
  await phone.getByRole('button',{name:'Spruch am Beamer abspielen',exact:false}).click();
  await expect.poll(async()=>(await counts(page)).starts).toBe(2);
  await page.reload();await expect(page.getByRole('button',{name:'Mission starten',exact:true})).toBeVisible();
  expect((await counts(page)).starts).toBe(0);expect(phoneAudio).toEqual([]);
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Klang einschalten',exact:true}).click();
  await page.getByRole('button',{name:'Menü schließen',exact:true}).click();
  let release!:()=>void, waiting!:()=>void;
  const blocked=new Promise<void>(resolve=>{release=resolve;}), poll=new Promise<void>(resolve=>{waiting=resolve;});
  await page.route('**/api/kids-remotes/*',async route=>{if(route.request().method()==='GET'){waiting();await blocked;}await route.continue();});
  await poll;
  await phone.getByRole('button',{name:'Spruch am Beamer abspielen',exact:false}).click();
  await phone.getByRole('button',{name:'Mission starten',exact:true}).click();
  release();
  await expect(page.getByRole('heading',{name:'Die erste Spur',exact:true})).toBeVisible();
  await page.waitForTimeout(200);
  expect((await counts(page)).starts).toBe(0);
  await context.close();
});
